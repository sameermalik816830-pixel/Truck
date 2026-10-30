const { Bill, Repair } = require("../models");
const handleError = require("../utils/handleError");

const OWNER_FIELDS = "name email phone address";

const nextBillNo = async (date) => {
  const year = new Date(date).getFullYear();
  const bills = await Bill.find({ billNo: new RegExp(`/${year}$`) }).select("billNo");
  const max = bills.reduce((m, b) => Math.max(m, parseInt(b.billNo, 10) || 0), 0);
  return `${String(max + 1).padStart(3, "0")}/${year}`;
};

const createBill = async (req, res) => {
  try {
    const ownerRef = req.body.owner || req.body.ownerId;
    const { repairIds } = req.body;
    if (!ownerRef) return res.status(400).json({ success: false, message: "Owner is required" });
    if (!Array.isArray(repairIds) || !repairIds.length) {
      return res.status(400).json({ success: false, message: "Select at least one repair record" });
    }

    const billDate = req.body.billDate ? new Date(req.body.billDate) : new Date();
    if (isNaN(billDate)) return res.status(400).json({ success: false, message: "Enter a valid bill date" });

    const repairs = await Repair.find({ _id: { $in: repairIds }, owner: ownerRef, billed: false }).sort({ truckNo: 1, date: 1 });
    if (repairs.length !== new Set(repairIds.map(String)).size) {
      return res.status(400).json({
        success: false,
        message: "Some selected records are missing, belong to another owner, or are already billed",
      });
    }

    const items = repairs.flatMap((r) => {
      const lines = r.items && r.items.length ? r.items : [{ description: r.workDone, amount: r.cost }];
      return lines.map((line) => ({ repair: r._id, truckNo: r.truckNo, date: r.date, workDone: line.description, amount: line.amount }));
    });
    const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);
    const bill = await Bill.create({ billNo: await nextBillNo(billDate), owner: ownerRef, billDate, items, totalAmount });

    await Repair.updateMany({ _id: { $in: repairs.map((r) => r._id) } }, { billed: true, bill: bill._id });
    await bill.populate("owner", OWNER_FIELDS);
    return res.status(201).json({ success: true, message: "Bill created", bill });
  } catch (error) {
    return handleError(res, error);
  }
};

const getAllBills = async (req, res) => {
  try {
    const filter = {};
    if (req.query.ownerId) filter.owner = req.query.ownerId;
    const bills = await Bill.find(filter).populate("owner", OWNER_FIELDS).sort({ billDate: -1, createdAt: -1 });
    return res.status(200).json({ success: true, bills });
  } catch (error) {
    return handleError(res, error);
  }
};

const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id).populate("owner", OWNER_FIELDS);
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });
    return res.status(200).json({ success: true, bill });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateBill = async (req, res) => {
  try {
    const updates = {};
    if (req.body.status !== undefined) {
      if (!["Paid", "Unpaid"].includes(req.body.status)) {
        return res.status(400).json({ success: false, message: "Status must be Paid or Unpaid" });
      }
      const existing = await Bill.findById(req.params.id).select("status paymentId");
      if (!existing) return res.status(404).json({ success: false, message: "Bill not found" });
      if (existing.paymentId && req.body.status === "Unpaid") {
        return res.status(400).json({ success: false, message: "This bill was paid online and cannot be marked unpaid. Refund it from the Razorpay dashboard instead." });
      }
      updates.status = req.body.status;
      if (req.body.status === "Paid" && existing.status !== "Paid") {
        updates.paidAt = new Date();
        updates.paymentMethod = "Manual";
      }
      if (req.body.status === "Unpaid") {
        updates.paidAt = null;
        updates.paymentMethod = null;
      }
    }
    if (req.body.billDate) updates.billDate = req.body.billDate;

    const bill = await Bill.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate("owner", OWNER_FIELDS);
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });
    return res.status(200).json({ success: true, message: "Bill updated", bill });
  } catch (error) {
    return handleError(res, error);
  }
};

const deleteBill = async (req, res) => {
  try {
    const existing = await Bill.findById(req.params.id).select("paymentId");
    if (existing && existing.paymentId) {
      return res.status(400).json({ success: false, message: "This bill was paid online, so it cannot be deleted." });
    }
    const bill = await Bill.findByIdAndDelete(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });
    await Repair.updateMany({ bill: bill._id }, { billed: false, bill: null });
    return res.status(200).json({ success: true, message: "Bill deleted" });
  } catch (error) {
    return handleError(res, error);
  }
};

const getMyBills = async (req, res) => {
  try {
    const bills = await Bill.find({ owner: req.user.id }).sort({ billDate: -1, createdAt: -1 });
    return res.status(200).json({ success: true, bills });
  } catch (error) {
    return handleError(res, error);
  }
};

const getMyBillById = async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, owner: req.user.id });
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });
    return res.status(200).json({ success: true, bill });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = { createBill, getAllBills, getBillById, updateBill, deleteBill, getMyBills, getMyBillById };
