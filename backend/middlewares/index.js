const signupMiddleware = require("./signupMiddleware");
const { truckOwnerSignupMiddleware } = signupMiddleware;
const verifyToken = require("./authMiddleware");
const authorizeRoles = require("./authorize");
const upload = require("./upload");
const { avatarUpload } = upload;
const captchaMiddleware = require("./captchaMiddleware");

module.exports = { signupMiddleware, truckOwnerSignupMiddleware, verifyToken, authorizeRoles, upload, avatarUpload, captchaMiddleware };
