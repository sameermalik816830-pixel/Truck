const { Truck, TruckOwner, Repair } = require("../models");
const handleError = require("../utils/handleError");

const clean = (v) => String(v || "").trim().toUpperCase();

const addTruck = async (req, res) => {
  try {
    const { owner, model, status } = req.body;
    const truckNo = clean(req.body.truckNo);
    if (!truckNo || !owner) {
      return res.status(400).json({ success: false, message: "Truck number and owner are required" });
    }
    if (!(await TruckOwner.exists({ _id: owner }))) {
      return res.status(404).json({ success: false, message: "Owner not found" });
    }
    if (await Truck.findOne({ truckNo })) {
      return res.status(409).json({ success: false, message: "A truck with this number already exists" });
    }
    const truck = await Truck.create({ truckNo, model, owner, status });
    return res.status(201).json({ success: true, message: "Truck added", truck });
  } catch (error) {
    return handleError(res, error);
  }
};

const getAllTrucks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.ownerId) filter.owner = req.query.ownerId;
    const trucks = await Truck.find(filter).populate("owner", "name email phone").sort({ truckNo: 1 });
    return res.status(200).json({ success: true, trucks });
  } catch (error) {
    return handleError(res, error);
  }
};

const getTruckById = async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id).populate("owner", "name email phone");
    if (!truck) return res.status(404).json({ success: false, message: "Truck not found" });
    return res.status(200).json({ success: true, truck });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateTruck = async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id);
    if (!truck) return res.status(404).json({ success: false, message: "Truck not found" });

    const { owner, model, status } = req.body;
    let renamedTo = null;

    if (req.body.truckNo !== undefined) {
      const no = clean(req.body.truckNo);
      if (!no) return res.status(400).json({ success: false, message: "Truck number is required" });
      if (no !== truck.truckNo) {
        if (await Truck.findOne({ truckNo: no, _id: { $ne: truck._id } })) {
          return res.status(409).json({ success: false, message: "A truck with this number already exists" });
        }
        truck.truckNo = no;
        renamedTo = no;
      }
    }

    if (owner !== undefined && String(owner) !== String(truck.owner)) {
      if (await Repair.exists({ truck: truck._id })) {
        return res.status(409).json({ success: false, message: "Cannot change the owner of a truck that has repair records" });
      }
      if (!(await TruckOwner.exists({ _id: owner }))) {
        return res.status(404).json({ success: false, message: "Owner not found" });
      }
      truck.owner = owner;
    }

    if (model !== undefined) truck.model = String(model).trim();
    if (status !== undefined) truck.status = status;

    await truck.save();
    if (renamedTo) await Repair.updateMany({ truck: truck._id }, { truckNo: renamedTo });
    return res.status(200).json({ success: true, message: "Truck updated", truck });
  } catch (error) {
    return handleError(res, error);
  }
};

const deleteTruck = async (req, res) => {
  try {
    if (await Repair.exists({ truck: req.params.id })) {
      return res.status(409).json({ success: false, message: "This truck has repair records, so it cannot be deleted. Set it to Inactive instead." });
    }
    const truck = await Truck.findByIdAndDelete(req.params.id);
    if (!truck) return res.status(404).json({ success: false, message: "Truck not found" });
    return res.status(200).json({ success: true, message: "Truck deleted" });
  } catch (error) {
    return handleError(res, error);
  }
};

const getMyTrucks = async (req, res) => {
  try {
    const trucks = await Truck.find({ owner: req.user.id }).sort({ truckNo: 1 });
    return res.status(200).json({ success: true, trucks });
  } catch (error) {
    return handleError(res, error);
  }
};

const getMyTruckById = async (req, res) => {
  try {
    const truck = await Truck.findOne({ _id: req.params.id, owner: req.user.id });
    if (!truck) return res.status(404).json({ success: false, message: "Truck not found" });
    return res.status(200).json({ success: true, truck });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = { addTruck, getAllTrucks, getTruckById, updateTruck, deleteTruck, getMyTrucks, getMyTruckById };
