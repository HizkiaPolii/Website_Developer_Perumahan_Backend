import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import activityLogRoutes from "./routes/activityLog";
import chartOfAccountsRoutes from "./routes/chartOfAccounts";
import transactionRoutes from "./routes/transactions";
import dashboardRoutes from "./routes/dashboard";
import journalEntryRoutes from "./routes/journalEntries";
import purchaseRequestRoutes from "./routes/purchaseRequests";
import spkRoutes from "./routes/spk";
import { startEODScheduler } from "./services/eodService";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map(o => o.trim())
  : ["http://localhost:3000"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "Server is running", timestamp: new Date() });
});

// Auth routes
app.use("/api/auth", authRoutes);

// User routes
app.use("/api/users", userRoutes);

// Activity Log routes
app.use("/api/activity-logs", activityLogRoutes);

// Chart of Accounts routes
app.use("/api/chart-of-accounts", chartOfAccountsRoutes);

// Transaction routes
app.use("/api/transactions", transactionRoutes);

// Journal Entry routes
app.use("/api/journal-entries", journalEntryRoutes);

// Dashboard & Financial Reports routes
app.use("/api/dashboard", dashboardRoutes);

// Purchase Request routes
app.use("/api/purchase-requests", purchaseRequestRoutes);

// SPK (Sistem Pendukung Keputusan) routes
app.use("/api/spk", spkRoutes);

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
