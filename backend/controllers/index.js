const auth = require("./authController");
const owners = require("./truckOwnerController");
const trucks = require("./truckController");
const repairs = require("./repairController");
const bills = require("./billController");
const payments = require("./paymentController");
const captcha = require("./captchaController");

module.exports = { ...auth, ...owners, ...trucks, ...repairs, ...bills, ...payments, ...captcha };
