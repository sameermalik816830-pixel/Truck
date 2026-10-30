const crypto = require("crypto");
const Razorpay = require("razorpay");
const { Bill, Payment, TruckOwner } = require("../models");
const handleError = require("../utils/handleError");

const getClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
};

const hmac = (secret, data) => crypto.createHmac("sha256", secret).update(data).digest("hex");
const safeEqual = (a, b) => {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

const razorpayMessage = (e) => (e && e.error && e.error.description) || e.message || "Payment gateway error";

const settle = async (orderId, paymentId, extra = {}) => {
  const payment = await Payment.findOneAndUpdate(
    { orderId, status: { $ne: "paid" } },
    { status: "paid", paymentId, paidAt: new Date(), failureReason: null, ...extra },
    { new: true }
  );
  if (!payment) return Payment.findOne({ orderId });
  await Bill.updateOne(
    { _id: payment.bill, status: "Unpaid" },
    { status: "Paid", paidAt: payment.paidAt, paymentMethod: "Online", paymentId }
  );
  return payment;
};

const createOrder = async (req, res) => {
  try {
    const client = getClient();
    if (!client) {
      return res.status(503).json({ success: false, message: "Online payment is not available right now. Please pay the garage directly." });
    }
    const bill = await Bill.findOne({ _id: req.params.id, owner: req.user.id });
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });
    if (bill.status === "Paid") return res.status(400).json({ success: false, message: "This bill is already paid" });

    const amount = Math.round(bill.totalAmount * 100);
    if (amount < 100) return res.status(400).json({ success: false, message: "Bill amount is too small for online payment" });

    let order;
    try {
      order = await client.orders.create({
        amount,
        currency: "INR",
        receipt: `bill_${bill._id}`,
        notes: { billId: String(bill._id), billNo: bill.billNo },
      });
    } catch (e) {
      console.error("Razorpay order error:", e);
      return res.status(502).json({ success: false, message: `Could not start payment: ${razorpayMessage(e)}` });
    }

    await Payment.create({ bill: bill._id, owner: req.user.id, orderId: order.id, amount, currency: order.currency });
    const owner = await TruckOwner.findById(req.user.id).select("name email phone");
    return res.status(201).json({
      success: true,
      order: {
        id: order.id,
        amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        billNo: bill.billNo,
        prefill: { name: owner?.name || "", email: owner?.email || "", contact: owner?.phone || "" },
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const verifyPayment = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ success: false, message: "Online payment is not configured" });
    }
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ success: false, message: "Payment details are missing" });
    }
    const bill = await Bill.findOne({ _id: req.params.id, owner: req.user.id });
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });

    const payment = await Payment.findOne({ orderId: String(orderId), bill: bill._id, owner: req.user.id });
    if (!payment) return res.status(404).json({ success: false, message: "Payment order not found for this bill" });

    const expected = hmac(process.env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`);
    if (!safeEqual(expected, signature)) {
      return res.status(400).json({ success: false, message: "Payment verification failed. If money was deducted, it will be confirmed shortly or refunded by your bank." });
    }

    await settle(String(orderId), String(paymentId));
    const updated = await Bill.findById(bill._id);
    return res.status(200).json({ success: true, message: "Payment successful", bill: updated });
  } catch (error) {
    return handleError(res, error);
  }
};

const webhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return res.status(503).json({ success: false, message: "Webhook not configured" });

    const signature = req.headers["x-razorpay-signature"];
    if (!req.rawBody || !safeEqual(hmac(secret, req.rawBody), signature)) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const { event, payload } = req.body || {};
    const entity = payload && payload.payment && payload.payment.entity;
    if (!entity || !entity.order_id) return res.status(200).json({ success: true });

    const payment = await Payment.findOne({ orderId: entity.order_id });
    if (!payment) return res.status(200).json({ success: true });

    if (event === "payment.captured" || event === "order.paid") {
      if (entity.amount !== payment.amount) {
        console.error(`Webhook amount mismatch for ${entity.order_id}: got ${entity.amount}, expected ${payment.amount}`);
        return res.status(200).json({ success: true });
      }
      await settle(entity.order_id, entity.id, { method: entity.method || null });
    } else if (event === "payment.failed" && payment.status !== "paid") {
      payment.status = "failed";
      payment.failureReason = (entity.error_description || "").slice(0, 200) || null;
      await payment.save();
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ success: false });
  }
};

module.exports = { createOrder, verifyPayment, webhook };
