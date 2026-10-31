const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const connectDB = require("./connectDB/connectDB");
const { authRoutes, garageOwnerRoutes, truckOwnerRoutes, paymentRoutes } = require("./routes");

const app = express();

app.use(
  cors({
    // origin: (process.env.CLIENT_URL || "http://localhost:5173").split(",").map((s) => s.trim()),
    origin:"https://truck-delta-three.vercel.app/",
    credentials: true,
  })
);
app.use(
  express.json({
    verify: (req, res, buf) => {
      if (req.originalUrl.startsWith("/api/payments/webhook")) req.rawBody = buf;
    },
  })
);
app.use(cookieParser());
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res) => res.set("X-Content-Type-Options", "nosniff"),
  })
);

app.get("/", (req, res) => res.send("API is running..."));

app.use("/api", authRoutes);
app.use("/api/garage", garageOwnerRoutes);
app.use("/api/owner", truckOwnerRoutes);
app.use("/api/payments", paymentRoutes);

app.use("/api", (req, res) => res.status(404).json({ success: false, message: "Route not found" }));

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.userFacing || err.message === "Only image files are allowed") {
    return res.status(400).json({ success: false, message: err.message });
  }
  console.error(err);
  return res.status(500).json({ success: false, message: "Something went wrong" });
});

const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
});


module.exports = app;
