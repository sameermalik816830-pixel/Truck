const Router = require("express").Router();
const { verifyToken, authorizeRoles, upload } = require("../middlewares");
const c = require("../controllers");

Router.use(verifyToken, authorizeRoles("garageOwner"));

Router.get("/truck-owners", c.getAllTruckOwners);
Router.post("/truck-owners", c.createTruckOwner);
Router.get("/truck-owners/:id", c.getTruckOwnerById);
Router.put("/truck-owners/:id", c.updateTruckOwner);
Router.delete("/truck-owners/:id", c.deleteTruckOwner);

Router.post("/trucks", c.addTruck);
Router.get("/trucks", c.getAllTrucks);
Router.get("/trucks/:id", c.getTruckById);
Router.put("/trucks/:id", c.updateTruck);
Router.delete("/trucks/:id", c.deleteTruck);

Router.post("/repairs", upload.array("photos", 5), c.createRepair);
Router.get("/repairs", c.getAllRepairs);
Router.get("/repairs/:id", c.getRepairById);
Router.put("/repairs/:id", upload.array("photos", 5), c.updateRepair);
Router.delete("/repairs/:id", c.deleteRepair);

Router.post("/bills", c.createBill);
Router.get("/bills", c.getAllBills);
Router.get("/bills/:id", c.getBillById);
Router.put("/bills/:id", c.updateBill);
Router.delete("/bills/:id", c.deleteBill);

module.exports = Router;
