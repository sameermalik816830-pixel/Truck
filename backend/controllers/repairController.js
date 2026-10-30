const fs = require("fs");
const path = require("path");
const { Repair, Truck } = require("../models");
const handleError = require("../utils/handleError");

const uploadsDir = path.join(__dirname, "..", "uploads");
const photoPaths = (files) => (files || []).map((f) => `/uploads/${f.filename}`);
const cleanupFiles = (files) => (files || []).forEach((f) => fs.unlink(f.path, () => {}));
const removePhotos = (paths) => (paths || []).forEach((p) => fs.unlink(path.join(uploadsDir, path.basename(p)), () => {}));

const syncLastService = async (truckId) => {
  const latest = await Repair.findOne({ truck: truckId }).sort({ date: -1 }).select("date");
  await Truck.findByIdAndUpdate(truckId, { lastServiceDate: latest ? latest.date : null });
};

const parseItems = (raw) => {
  let list = raw;
  if (typeof raw === "string") {
    try {
      list = JSON.parse(raw);
    } catch {
      return { error: "Work items are invalid" };
    }
  }
  if (!Array.isArray(list) || list.length === 0) return { error: "Add at least one work item with its price" };
  if (list.length > 30) return { error: "A record can have at most 30 work items" };
  const items = [];
  for (const entry of list) {
    const description = String((entry && entry.description) || "").trim();
    const rawAmount = entry ? entry.amount : undefined;
    const amount = Number(rawAmount);
    if (!description) return { error: "Describe each work item" };
    if (rawAmount === undefined || rawAmount === null || rawAmount === "" || !Number.isFinite(amount) || amount < 0) {
      return { error: `Enter a valid price for "${description}"` };
    }
    items.push({ description, amount });
  }
  return { items };
};

const summarize = (items) => ({
  items,
  workDone: items.map((i) => i.description).join(", "),
  cost: items.reduce((total, i) => total + i.amount, 0),
});

const fail = (req, res, status, message) => {
  cleanupFiles(req.files);
  return res.status(status).json({ success: false, message });
};

const createRepair = async (req, res) => {
  try {
    const ownerRef = req.body.owner || req.body.ownerId;
    const truckNo = String(req.body.truckNo || "").trim().toUpperCase();

    if (!ownerRef || !truckNo) return fail(req, res, 400, "Owner and truck are required");
    const parsed = parseItems(req.body.items);
    if (parsed.error) return fail(req, res, 400, parsed.error);
    const summary = summarize(parsed.items);

    const truck = await Truck.findOne({ truckNo, owner: ownerRef });
    if (!truck) return fail(req, res, 404, "This truck is not registered under the selected owner");

    const repair = await Repair.create({
      owner: ownerRef,
      truck: truck._id,
      truckNo,
      date: req.body.date || undefined,
      ...summary,
      status: ["Pending", "Completed"].includes(req.body.status) ? req.body.status : undefined,
      photos: photoPaths(req.files),
    });
    await syncLastService(truck._id);
    return res.status(201).json({ success: true, message: "Repair record added", repair });
  } catch (error) {
    cleanupFiles(req.files);
    return handleError(res, error);
  }
};

const getAllRepairs = async (req, res) => {
  try {
    const filter = {};
    if (req.query.ownerId) filter.owner = req.query.ownerId;
    if (req.query.billed !== undefined) filter.billed = req.query.billed === "true";
    const repairs = await Repair.find(filter).sort({ date: -1, createdAt: -1 });
    return res.status(200).json({ success: true, repairs });
  } catch (error) {
    return handleError(res, error);
  }
};

const getRepairById = async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id);
    if (!repair) return res.status(404).json({ success: false, message: "Repair record not found" });
    return res.status(200).json({ success: true, repair });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateRepair = async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id);
    if (!repair) return fail(req, res, 404, "Repair record not found");
    if (repair.billed) return fail(req, res, 400, "This record is already on a bill. Delete the bill to edit it.");

    const oldTruckId = repair.truck;
    const ownerRef = req.body.owner || req.body.ownerId || repair.owner;
    const truckNo = String(req.body.truckNo || repair.truckNo).trim().toUpperCase();

    if (String(ownerRef) !== String(repair.owner) || truckNo !== repair.truckNo) {
      const truck = await Truck.findOne({ truckNo, owner: ownerRef });
      if (!truck) return fail(req, res, 404, "This truck is not registered under the selected owner");
      repair.owner = ownerRef;
      repair.truck = truck._id;
      repair.truckNo = truckNo;
    }

    if (req.body.items !== undefined) {
      const parsed = parseItems(req.body.items);
      if (parsed.error) return fail(req, res, 400, parsed.error);
      Object.assign(repair, summarize(parsed.items));
    }
    if (req.body.date) repair.date = req.body.date;
    if (["Pending", "Completed"].includes(req.body.status)) repair.status = req.body.status;
    if (req.files && req.files.length) repair.photos = [...repair.photos, ...photoPaths(req.files)];

    await repair.save();
    await syncLastService(repair.truck);
    if (String(oldTruckId) !== String(repair.truck)) await syncLastService(oldTruckId);
    return res.status(200).json({ success: true, message: "Repair record updated", repair });
  } catch (error) {
    cleanupFiles(req.files);
    return handleError(res, error);
  }
};

const deleteRepair = async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id);
    if (!repair) return res.status(404).json({ success: false, message: "Repair record not found" });
    if (repair.billed) {
      return res.status(409).json({ success: false, message: "This record is already on a bill. Delete the bill first." });
    }
    await repair.deleteOne();
    removePhotos(repair.photos);
    await syncLastService(repair.truck);
    return res.status(200).json({ success: true, message: "Repair record deleted" });
  } catch (error) {
    return handleError(res, error);
  }
};

const getMyRepairs = async (req, res) => {
  try {
    const repairs = await Repair.find({ owner: req.user.id }).sort({ date: -1, createdAt: -1 });
    return res.status(200).json({ success: true, repairs });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = { createRepair, getAllRepairs, getRepairById, updateRepair, deleteRepair, getMyRepairs };
