// import express from "express";
// import dotenv from "dotenv";
// import authRoutes from "./routes/auth.route.js";
// import { connectDB } from "./lib/db.js";

// dotenv.config();

// const app = express();

// const PORT = process.env.PORT || 5000;
// app.use(express.json());

// app.use((req, res, next) => {
//   console.log("Incoming request:", req.method, req.url);
//   next();
// });


// app.use("/api/auth", authRoutes);

// app.get("/", (req, res) => {
//   res.send("Hello from server 🚀");
// });

// app.listen(PORT,() => {
//   console.log(`Server is running on port ${process.env.PORT}`);
//   connectDB()
// })


import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import analyticsRoutes from "./routes/analytics.route.js";
import { connectDB } from "./lib/db.js";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const __dirname = path.resolve();

// Middleware
app.use(express.json({ limit: "10mb" })); // to handle large payloads
app.use(cookieParser());

// ✅ test route to check if server is alive
app.get("/", (req, res) => {
  res.send("Hello from server 🚀");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/product", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupon", couponRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);

// // Start server only if DB connects
// connectDB()
//   .then(() => {
//    app.listen(PORT, "0.0.0.0", () => {
//   console.log(`✅ Server is running on http://localhost:${PORT}`);
// });
//   })
//   .catch((err) => {
//     console.error("❌ DB connection failed:", err.message);
//   });

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get('/*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../frontend/dist', 'index.html'));
});

}

app.listen(PORT, () => {
  console.log("Server is running on http://localhost:" + PORT);
  connectDB();
});