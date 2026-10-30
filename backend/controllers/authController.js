const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { GarageOwner, TruckOwner } = require("../models");
const handleError = require("../utils/handleError");
const sendEmail = require("../utils/sendEmail");
const { normalizeAadhaar, hashAadhaar, encryptAadhaar, last4 } = require("../utils/aadhaar");

const isProd = process.env.NODE_ENV === "production";
const cookieBase = { httpOnly: true, sameSite: isProd ? "none" : "lax", secure: isProd };
const cookieOptions = { ...cookieBase, maxAge: 7 * 24 * 60 * 60 * 1000 };

const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

const publicUser = (u, role) => ({
  id: u._id, name: u.name, email: u.email || "", phone: u.phone, address: u.address || "", role,
  avatar: u.avatar || "",
  ...(role === "truckOwner" ? { aadhaarLast4: u.aadhaarLast4 || "" } : {}),
});

const sendAuth = (res, status, user, role, message) => {
  const token = generateToken({ id: user._id, role });
  res.cookie("token", token, cookieOptions);
  return res.status(status).json({ success: true, message, token, user: publicUser(user, role) });
};

const normEmail = (e) => (e ? String(e).trim().toLowerCase() : undefined);
const normPhone = (p) => String(p || "").trim();
const modelFor = (role) => (role === "garageOwner" ? GarageOwner : TruckOwner);

const findTaken = async (email, phone, excludeId) => {
  const conds = [{ phone }];
  if (email) conds.push({ email });
  const q = { $or: conds };
  if (excludeId) q._id = { $ne: excludeId };
  const [truck, garage] = await Promise.all([TruckOwner.findOne(q), GarageOwner.findOne(q)]);
  return { truck, garage };
};

const saveGarageOwner = async (req, res) => {
  try {
    const { name, phone, email, password, address, garageCode } = req.body;

    const existingGarages = await GarageOwner.countDocuments();
    if (existingGarages > 0 && (!process.env.GARAGE_SIGNUP_CODE || garageCode !== process.env.GARAGE_SIGNUP_CODE)) {
      return res.status(403).json({ success: false, message: "A valid garage access code is required" });
    }

    const e = normEmail(email);
    const p = normPhone(phone);
    const { truck, garage } = await findTaken(e, p);
    if (truck || garage) {
      return res.status(409).json({ success: false, message: "An account with this email or phone already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await GarageOwner.create({ name: name.trim(), phone: p, email: e, password: hashed, address });
    return sendAuth(res, 201, user, "garageOwner", "Account created successfully");
  } catch (error) {
    return handleError(res, error);
  }
};

const signup = async (req, res) => {
  try {
    const { name, phone, email, password, address, aadhaar } = req.body;
    const e = normEmail(email);
    const p = normPhone(phone);
    const aadhaarNo = normalizeAadhaar(aadhaar);

    const { truck, garage } = await findTaken(e, p);
    if (garage || (truck && truck.password)) {
      return res.status(409).json({ success: false, message: "An account with this email or phone already exists" });
    }

    const aadhaarHash = hashAadhaar(aadhaarNo);
    const aadhaarClash = await TruckOwner.findOne({ aadhaarHash }).select("_id");
    if (aadhaarClash && (!truck || String(aadhaarClash._id) !== String(truck._id))) {
      return res.status(409).json({ success: false, message: "This Aadhaar number is already registered with another account" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const aadhaarFields = { aadhaarHash, aadhaarEnc: encryptAadhaar(aadhaarNo), aadhaarLast4: last4(aadhaarNo) };

    if (truck) {
      truck.name = name.trim();
      truck.password = hashed;
      truck.email = e;
      if (address) truck.address = String(address).trim();
      Object.assign(truck, aadhaarFields);
      await truck.save();
      return sendAuth(res, 201, truck, "truckOwner", "Account created successfully");
    }

    const user = await TruckOwner.create({ name: name.trim(), phone: p, email: e, password: hashed, address, ...aadhaarFields });
    return sendAuth(res, 201, user, "truckOwner", "Account created successfully");
  } catch (error) {
    return handleError(res, error);
  }
};

const attemptLogin = async (req, res, roles) => {
  const { identifier, email, password } = req.body;
  const raw = identifier || email;
  if (!raw || !password) {
    return res.status(400).json({ success: false, message: "Email/mobile and password are required" });
  }

  const id = String(raw).trim();
  const query = id.includes("@") ? { email: id.toLowerCase() } : { phone: id };
  const [truck, garage] = await Promise.all([
    roles.includes("truckOwner") ? TruckOwner.findOne(query) : null,
    roles.includes("garageOwner") ? GarageOwner.findOne(query) : null,
  ]);

  for (const [user, role] of [[garage, "garageOwner"], [truck, "truckOwner"]]) {
    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      return sendAuth(res, 200, user, role, "Login successful");
    }
  }
  return res.status(401).json({ success: false, message: "Invalid email/phone or password" });
};

const login = async (req, res) => {
  try {
    return await attemptLogin(req, res, ["garageOwner", "truckOwner"]);
  } catch (error) {
    return handleError(res, error);
  }
};

const loginGarageOwner = async (req, res) => {
  try {
    return await attemptLogin(req, res, ["garageOwner"]);
  } catch (error) {
    return handleError(res, error);
  }
};

const logout = (req, res) => {
  res.clearCookie("token", cookieBase);
  return res.status(200).json({ success: true, message: "Logged out" });
};

const me = async (req, res) => {
  try {
    const user = await modelFor(req.user.role).findById(req.user.id).select("-password");
    if (!user) {
      res.clearCookie("token", cookieBase);
      return res.status(401).json({ success: false, message: "Account not found" });
    }
    return res.status(200).json({ success: true, user: publicUser(user, req.user.role) });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await modelFor(req.user.role).findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "Account not found" });

    const { name, phone, email, address } = req.body;
    if (name !== undefined) {
      if (!String(name).trim()) return res.status(400).json({ success: false, message: "Name is required" });
      user.name = String(name).trim();
    }
    if (phone !== undefined) {
      const p = normPhone(phone);
      if (!/^[6-9]\d{9}$/.test(p)) {
        return res.status(400).json({ success: false, message: "Enter a valid 10-digit mobile number" });
      }
      user.phone = p;
    }
    if (email !== undefined) {
      const e = normEmail(email);
      if (!e && req.user.role === "garageOwner") {
        return res.status(400).json({ success: false, message: "Email is required" });
      }
      if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
        return res.status(400).json({ success: false, message: "Enter a valid email address" });
      }
      user.email = e;
    }
    if (address !== undefined) user.address = String(address).trim();

    const { truck, garage } = await findTaken(user.email, user.phone, user._id);
    if (truck || garage) {
      return res.status(409).json({ success: false, message: "Another account already uses this email or phone" });
    }

    await user.save();
    return res.status(200).json({ success: true, message: "Profile updated", user: publicUser(user, req.user.role) });
  } catch (error) {
    return handleError(res, error);
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current and new password are required" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }
    const user = await modelFor(req.user.role).findById(req.user.id);
    if (!user || !user.password || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.status(200).json({ success: true, message: "Password changed" });
  } catch (error) {
    return handleError(res, error);
  }
};

const avatarDir = path.join(__dirname, "..", "uploads", "avatars");
const removeAvatarFile = (avatarPath) => {
  if (!avatarPath || !avatarPath.startsWith("/uploads/avatars/")) return;
  fs.unlink(path.join(avatarDir, path.basename(avatarPath)), () => {});
};

const looksLikeImage = (file) => {
  try {
    const fd = fs.openSync(file.path, "r");
    const buf = Buffer.alloc(12);
    fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);
    const jpg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    const png = buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const webp = buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP";
    return jpg || png || webp;
  } catch {
    return false;
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Please choose an image to upload" });
    if (!looksLikeImage(req.file)) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ success: false, message: "That file is not a valid JPG, PNG or WebP image" });
    }
    const user = await modelFor(req.user.role).findById(req.user.id);
    if (!user) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ success: false, message: "Account not found" });
    }
    const previous = user.avatar;
    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();
    removeAvatarFile(previous);
    return res.status(200).json({ success: true, message: "Profile picture updated", user: publicUser(user, req.user.role) });
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return handleError(res, error);
  }
};

const removeAvatar = async (req, res) => {
  try {
    const user = await modelFor(req.user.role).findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "Account not found" });
    const previous = user.avatar;
    user.avatar = "";
    await user.save();
    removeAvatarFile(previous);
    return res.status(200).json({ success: true, message: "Profile picture removed", user: publicUser(user, req.user.role) });
  } catch (error) {
    return handleError(res, error);
  }
};

const OTP_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;
const hashOtp = (otp) => crypto.createHmac("sha256", process.env.JWT_SECRET || "otp").update(String(otp)).digest("hex");
const escapeHtml = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const resetFields = "+resetPasswordToken +resetPasswordExpires +resetPasswordAttempts";

const findResetUser = async (email) => {
  const lookups = await Promise.all([GarageOwner, TruckOwner].map((M) => M.findOne({ email }).select(resetFields)));
  return lookups.find((u) => u && u.password);
};

const clearReset = (user) => {
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.resetPasswordAttempts = undefined;
};

const forgotPassword = async (req, res) => {
  const generic = { success: true, message: "If an account exists for this email, an OTP has been sent." };
  try {
    const email = normEmail(req.body.email);
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address" });
    }

    const user = await findResetUser(email);
    if (!user) return res.status(200).json(generic);

    const issuedAt = user.resetPasswordExpires ? user.resetPasswordExpires.getTime() - OTP_MINUTES * 60 * 1000 : 0;
    if (Date.now() - issuedAt < RESEND_COOLDOWN_MS) return res.status(200).json(generic);

    const otp = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    user.resetPasswordToken = hashOtp(otp);
    user.resetPasswordExpires = new Date(Date.now() + OTP_MINUTES * 60 * 1000);
    user.resetPasswordAttempts = 0;
    await user.save();

    try {
      await sendEmail({
        to: email,
        subject: "Your Truck Garage password reset OTP",
        text:
          `Hi ${user.name},\n\nYour OTP to reset your Truck Garage password is: ${otp}\n\n` +
          `It is valid for ${OTP_MINUTES} minutes. Do not share it with anyone.\n\n` +
          `If you did not ask for this, you can ignore this email - your password will not change.`,
        html:
          `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#1b2b45">` +
          `<h2 style="margin:0 0 12px">Reset your password</h2>` +
          `<p>Hi ${escapeHtml(user.name)},</p>` +
          `<p>Use this OTP to reset your Truck Garage password. It is valid for ${OTP_MINUTES} minutes.</p>` +
          `<p style="margin:24px 0;font-size:32px;font-weight:bold;letter-spacing:8px;color:#1f5eff">${otp}</p>` +
          `<p style="font-size:13px;color:#5b6b85">Do not share this OTP with anyone.</p>` +
          `<p style="font-size:13px;color:#5b6b85">If you did not ask for this, ignore this email - your password will not change.</p></div>`,
      });
    } catch (mailError) {
      console.error("Could not send reset email:", mailError.message);
      clearReset(user);
      await user.save();
    }
    return res.status(200).json(generic);
  } catch (error) {
    return handleError(res, error);
  }
};

const resetPassword = async (req, res) => {
  try {
    const email = normEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();
    const { password } = req.body;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address" });
    }
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: "Enter the 6-digit OTP" });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const invalid = { success: false, message: "The OTP is invalid or has expired. Please request a new one." };
    const user = await findResetUser(email);
    if (!user || !user.resetPasswordToken || !user.resetPasswordExpires || user.resetPasswordExpires <= new Date()) {
      return res.status(400).json(invalid);
    }

    const attempts = user.resetPasswordAttempts || 0;
    if (attempts >= OTP_MAX_ATTEMPTS) {
      clearReset(user);
      await user.save();
      return res.status(400).json(invalid);
    }

    const expected = Buffer.from(user.resetPasswordToken, "hex");
    const given = Buffer.from(hashOtp(otp), "hex");
    if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
      user.resetPasswordAttempts = attempts + 1;
      await user.save();
      return res.status(400).json(invalid);
    }

    user.password = await bcrypt.hash(String(password), 10);
    clearReset(user);
    await user.save();
    return res.status(200).json({ success: true, message: "Password updated. You can now log in." });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = { saveGarageOwner, signup, loginGarageOwner, login, logout, me, updateProfile, changePassword, uploadAvatar, removeAvatar, forgotPassword, resetPassword };
