const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const dir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${path.extname(file.originalname).toLowerCase()}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("Only image files are allowed")),
});

const avatarDir = path.join(dir, "avatars");
fs.mkdirSync(avatarDir, { recursive: true });

const AVATAR_TYPES = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

upload.avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, avatarDir),
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${AVATAR_TYPES[file.mimetype] || ".jpg"}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (AVATAR_TYPES[file.mimetype]) return cb(null, true);
    const err = new Error("Profile picture must be a JPG, PNG or WebP image");
    err.userFacing = true;
    return cb(err);
  },
});

module.exports = upload;
