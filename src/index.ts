import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import { productRoutes } from "./routes/products.js";
import { authRoutes } from "./routes/auth.js";
import { userRoutes } from "./routes/users.js";
import { uploadRoutes } from "./routes/upload.js";
import { informationRoutes } from "./routes/information.js";
import { inquiryRoutes } from "./routes/inquiries.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/information", informationRoutes);
app.use("/api/inquiries", inquiryRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

app.listen(config.port, () => {
  console.log(`iMED API running on http://localhost:${config.port}`);
});
