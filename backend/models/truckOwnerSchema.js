const mongoose = require("mongoose");

const truckOwnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
    password: { type: String },
    phone: { type: String, required: [true, "Phone number is required"], unique: true, trim: true },
    address: { type: String, trim: true, default: "" },
    avatar: { type: String, default: "" },
    aadhaarHash: { type: String, unique: true, sparse: true, select: false },
    aadhaarEnc: { type: String, select: false },
    aadhaarLast4: { type: String, default: "" },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    resetPasswordAttempts: { type: Number, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TruckOwner", truckOwnerSchema);
