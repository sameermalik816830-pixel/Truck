const mongoose = require("mongoose");

const billItemSchema = new mongoose.Schema(
  {
    repair: { type: mongoose.Schema.Types.ObjectId, ref: "Repair" },
    truckNo: { type: String, required: true },
    date: { type: Date },
    workDone: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    billNo: { type: String, required: true, unique: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "TruckOwner", required: true, index: true },
    billDate: { type: Date, required: true },
    items: { type: [billItemSchema], validate: (v) => v.length > 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["Unpaid", "Paid"], default: "Unpaid" },
    paidAt: { type: Date, default: null },
    paymentMethod: { type: String, enum: ["Online", "Manual", null], default: null },
    paymentId: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bill", billSchema);
