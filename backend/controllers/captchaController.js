const { createCaptcha } = require("../utils/captcha");

const getCaptcha = (req, res) => {
  const { id, svg } = createCaptcha();
  res.set("Cache-Control", "no-store");
  return res.status(200).json({ success: true, captchaId: id, image: svg });
};

module.exports = { getCaptcha };
