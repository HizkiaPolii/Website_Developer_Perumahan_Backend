import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "Server is running", timestamp: new Date() });
});

console.log("🔧 Mounting auth routes...");

// Auth routes
app.use("/api/auth", authRoutes);

console.log("🔧 Auth routes mounted");
console.log("🔧 Mounting user routes...");

// User routes
app.use("/api/users", userRoutes);

console.log("🔧 User routes mounted");

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error("❌ Error:", err);
  res.status(500).json({ error: "Something went wrong!" });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`⚡️ Server is running on http://localhost:${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV}`);
});
