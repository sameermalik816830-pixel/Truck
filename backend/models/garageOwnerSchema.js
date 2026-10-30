const mongoose = require("mongoose");

const garageOwnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    phone: { type: String, required: [true, "Phone number is required"], unique: true, trim: true },
    email: { type: String, required: [true, "Email is required"], unique: true, lowercase: true, trim: true },
    password: { type: String, required: [true, "Password is required"] },
    address: { type: String, trim: true, default: "" },
    avatar: { type: String, default: "" },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    resetPasswordAttempts: { type: Number, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("garageOwner", garageOwnerSchema);
