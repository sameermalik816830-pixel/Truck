const Router = require("express").Router();
const { verifyToken, authorizeRoles } = require("../middlewares");
const c = require("../controllers");

Router.use(verifyToken, authorizeRoles("truckOwner"));

Router.get("/trucks", c.getMyTrucks);
Router.get("/trucks/:id", c.getMyTruckById);
Router.get("/repairs", c.getMyRepairs);
Router.get("/bills", c.getMyBills);
Router.get("/bills/:id", c.getMyBillById);
Router.post("/bills/:id/pay/order", c.createOrder);
Router.post("/bills/:id/pay/verify", c.verifyPayment);

module.exports = Router;
