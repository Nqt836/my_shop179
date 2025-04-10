const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const authRoute = require("./routes/auth");
const userRoute = require("./routes/user");
const productRoute = require("./routes/product");

dotenv.config();
const app = express();

// Kết nối tới MongoDB
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("MongoDB đã kết nối");
  } catch (err) {
    console.error("Lỗi khi kết nối tới MongoDB:", err);
    process.exit(1);
  }
})();

// CẤU HÌNH CORS
app.use(
  cors({
    origin: "http://127.0.0.1:5500",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cookieParser());
app.use(express.json());

// PHỤC VỤ TỆP TĨNH TỪ THƯ MỤC frontend/img
app.use(
  "/frontend/img",
  express.static(path.join(__dirname, "../frontend/img"))
);

// ROUTES
app.use("/v1/auth", authRoute);
app.use("/v1/user", userRoute);
app.use("/v1/product", productRoute);

app.listen(8000, () => {
  console.log("Server đang chạy trên cổng 8000");
});
