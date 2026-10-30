const { isValidAadhaar } = require("../utils/aadhaar");

const baseCheck = (body) => {
  const { name, email, password, phone } = body;

  if (!name || !email || !password || !phone) return "All fields are required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) return "Enter a valid email address";
  if (String(password).length < 6) return "Password must be at least 6 characters";
  if (!/^[6-9]\d{9}$/.test(String(phone).trim())) return "Enter a valid 10-digit mobile number";
  return null;
};

const signupMiddleware = (req, res, next) => {
  const problem = baseCheck(req.body);
  if (problem) return res.status(400).json({ success: false, message: problem });
  next();
};

const truckOwnerSignupMiddleware = (req, res, next) => {
  const problem = baseCheck(req.body);
  if (problem) return res.status(400).json({ success: false, message: problem });
  if (!req.body.aadhaar || !String(req.body.aadhaar).trim()) {
    return res.status(400).json({ success: false, message: "Aadhaar number is required" });
  }
  if (!isValidAadhaar(req.body.aadhaar)) {
    return res.status(400).json({ success: false, message: "Enter a valid 12-digit Aadhaar number" });
  }
  next();
};

module.exports = signupMiddleware;
module.exports.truckOwnerSignupMiddleware = truckOwnerSignupMiddleware;
