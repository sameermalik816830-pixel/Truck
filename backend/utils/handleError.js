module.exports = (res, error) => {
  if (error.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid id or value supplied" });
  }
  if (error.name === "ValidationError") {
    const message = Object.values(error.errors).map((e) => e.message).join(", ");
    return res.status(400).json({ success: false, message });
  }
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {}).join(", ") || "value";
    return res.status(409).json({ success: false, message: `A record with this ${field} already exists` });
  }
  console.error(error);
  return res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
};
