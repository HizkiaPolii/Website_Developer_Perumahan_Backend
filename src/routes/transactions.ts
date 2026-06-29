import express from "express";
import {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  approveTransaction,
  rejectTransaction,
  postTransaction,
} from "../controllers/transactionController";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all transactions — Teller, Manager & Owner
router.get("/", roleMiddleware("teller", "manager", "owner"), getAllTransactions);

// Get transaction by ID — Teller, Manager & Owner
router.get("/:id", roleMiddleware("teller", "manager", "owner"), getTransactionById);

// Create new transaction — hanya Teller
router.post("/", roleMiddleware("teller"), createTransaction);

// Update transaction — hanya Teller (hanya DRAFT atau REJECTED)
router.put("/:id", roleMiddleware("teller"), updateTransaction);

// Delete transaction — hanya Teller (hanya DRAFT atau REJECTED)
router.delete("/:id", roleMiddleware("teller"), deleteTransaction);

// Approve transaction — hanya Manager
router.post("/:id/approve", roleMiddleware("manager"), approveTransaction);

// Reject transaction — hanya Manager
router.post("/:id/reject", roleMiddleware("manager"), rejectTransaction);

// Post transaction to journal — hanya Manager (legacy, auto-run on approve)
router.post("/:id/post", roleMiddleware("manager"), postTransaction);

export default router;
