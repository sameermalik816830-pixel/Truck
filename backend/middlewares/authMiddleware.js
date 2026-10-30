const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const header = req.headers.authorization;
  const token = header && header.startsWith("Bearer ") ? header.split(" ")[1] : req.cookies && req.cookies.token;

  if (!token) {
    return res.status(401).json({ success: false, message: "Please log in to continue" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Session expired. Please log in again" });
  }
};

module.exports = verifyToken;
