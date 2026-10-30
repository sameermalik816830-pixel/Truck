const mongoose = require("mongoose");

const workItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: [true, "Describe each work item"], trim: true },
    amount: { type: Number, required: [true, "Enter a price for each work item"], min: [0, "Price cannot be negative"] },
  },
  { _id: false }
);

const repairSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "TruckOwner", required: true, index: true },
    truck: { type: mongoose.Schema.Types.ObjectId, ref: "Truck", required: true, index: true },
    truckNo: { type: String, required: true, uppercase: true, trim: true },
    date: { type: Date, required: true, default: Date.now },
    items: { type: [workItemSchema], default: [] },
    workDone: { type: String, required: [true, "Please describe the work done"], trim: true },
    cost: { type: Number, required: [true, "Cost is required"], min: [0, "Cost cannot be negative"] },
    status: { type: String, enum: ["Pending", "Completed"], default: "Completed" },
    photos: { type: [String], default: [] },
    billed: { type: Boolean, default: false, index: true },
    bill: { type: mongoose.Schema.Types.ObjectId, ref: "Bill", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Repair", repairSchema);
