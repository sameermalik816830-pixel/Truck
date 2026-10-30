const mongoose = require("mongoose");

const truckSchema = new mongoose.Schema(
  {
    truckNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    model: { type: String, trim: true, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "TruckOwner", required: true, index: true },
    lastServiceDate: { type: Date, default: null },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Truck", truckSchema);
