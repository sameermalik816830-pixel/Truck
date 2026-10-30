const Router = require("express").Router();
const c = require("../controllers");

Router.post("/webhook", c.webhook);

module.exports = Router;
