const Router = require("express").Router();
const c = require("../controllers");
const { signupMiddleware, truckOwnerSignupMiddleware, verifyToken, avatarUpload, captchaMiddleware } = require("../middlewares");

Router.get("/captcha", c.getCaptcha);

Router.post("/signup-garage-owner", signupMiddleware, captchaMiddleware, c.saveGarageOwner);
Router.post("/signup", truckOwnerSignupMiddleware, captchaMiddleware, c.signup);
Router.post("/login-garage-owner", captchaMiddleware, c.loginGarageOwner);
Router.post("/login", captchaMiddleware, c.login);
Router.post("/logout", c.logout);
Router.post("/forgot-password", captchaMiddleware, c.forgotPassword);
Router.post("/reset-password", c.resetPassword);

Router.get("/me", verifyToken, c.me);
Router.put("/me", verifyToken, c.updateProfile);
Router.put("/me/password", verifyToken, c.changePassword);
Router.put("/me/avatar", verifyToken, avatarUpload.single("avatar"), c.uploadAvatar);
Router.delete("/me/avatar", verifyToken, c.removeAvatar);

module.exports = Router;
