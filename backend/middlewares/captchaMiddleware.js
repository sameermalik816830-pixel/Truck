const { verifyCaptcha } = require("../utils/captcha");

const captchaMiddleware = (req, res, next) => {
  const { captchaId, captchaText } = req.body || {};
  if (!captchaText || !String(captchaText).trim()) {
    return res.status(400).json({ success: false, message: "Please enter the captcha" });
  }
  if (!verifyCaptcha(captchaId, String(captchaText))) {
    return res.status(400).json({ success: false, captchaError: true, message: "Captcha is incorrect or expired. Please try the new one." });
  }
  next();
};

module.exports = captchaMiddleware;
