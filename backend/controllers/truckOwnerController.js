const { TruckOwner, GarageOwner, Truck, Repair, Bill } = require("../models");
const handleError = require("../utils/handleError");

const PHONE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getAllTruckOwners = async (req, res) => {
  try {
    const owners = await TruckOwner.find().select("-password").sort({ name: 1 });
    return res.status(200).json({ success: true, owners });
  } catch (error) {
    return handleError(res, error);
  }
};

const getTruckOwnerById = async (req, res) => {
  try {
    const owner = await TruckOwner.findById(req.params.id).select("-password");
    if (!owner) return res.status(404).json({ success: false, message: "Truck owner not found" });
    return res.status(200).json({ success: true, owner });
  } catch (error) {
    return handleError(res, error);
  }
};

const validate = ({ name, phone, email }) => {
  if (!name || !String(name).trim()) return "Name is required";
  if (!PHONE_RE.test(String(phone || "").trim())) return "Enter a valid 10-digit mobile number";
  if (email && !EMAIL_RE.test(String(email).trim())) return "Enter a valid email address";
  return null;
};

const createTruckOwner = async (req, res) => {
  try {
    const problem = validate(req.body);
    if (problem) return res.status(400).json({ success: false, message: problem });

    const phone = String(req.body.phone).trim();
    const email = req.body.email ? String(req.body.email).trim().toLowerCase() : undefined;
    const clash = await Promise.all([
      TruckOwner.findOne({ $or: [{ phone }, ...(email ? [{ email }] : [])] }),
      GarageOwner.findOne({ $or: [{ phone }, ...(email ? [{ email }] : [])] }),
    ]);
    if (clash[0] || clash[1]) {
      return res.status(409).json({ success: false, message: "An owner with this phone or email already exists" });
    }

    const owner = await TruckOwner.create({
      name: String(req.body.name).trim(), phone, email, address: req.body.address,
    });
    return res.status(201).json({ success: true, message: "Owner added", owner: await TruckOwner.findById(owner._id).select("-password") });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateTruckOwner = async (req, res) => {
  try {
    const owner = await TruckOwner.findById(req.params.id);
    if (!owner) return res.status(404).json({ success: false, message: "Truck owner not found" });

    const merged = { name: req.body.name ?? owner.name, phone: req.body.phone ?? owner.phone, email: req.body.email ?? owner.email };
    const problem = validate(merged);
    if (problem) return res.status(400).json({ success: false, message: problem });

    owner.name = String(merged.name).trim();
    owner.phone = String(merged.phone).trim();
    if (req.body.email !== undefined) {
      owner.email = req.body.email ? String(req.body.email).trim().toLowerCase() : undefined;
    }
    if (req.body.address !== undefined) owner.address = String(req.body.address).trim();
    await owner.save();

    return res.status(200).json({ success: true, message: "Owner updated", owner: await TruckOwner.findById(owner._id).select("-password") });
  } catch (error) {
    return handleError(res, error);
  }
};

const deleteTruckOwner = async (req, res) => {
  try {
    const id = req.params.id;
    const [trucks, repairs, bills] = await Promise.all([
      Truck.countDocuments({ owner: id }), Repair.countDocuments({ owner: id }), Bill.countDocuments({ owner: id }),
    ]);
    if (trucks || repairs || bills) {
      return res.status(409).json({
        success: false,
        message: "This owner still has trucks, repair records or bills. Remove those first.",
      });
    }
    const owner = await TruckOwner.findByIdAndDelete(id);
    if (!owner) return res.status(404).json({ success: false, message: "Truck owner not found" });
    return res.status(200).json({ success: true, message: "Owner deleted" });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = { getAllTruckOwners, getTruckOwnerById, createTruckOwner, updateTruckOwner, deleteTruckOwner };
