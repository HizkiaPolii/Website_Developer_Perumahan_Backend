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

// Get all transactions — Manager & Owner (Owner boleh lihat untuk keperluan approval)
router.get("/", roleMiddleware("manager", "owner"), getAllTransactions);

// Get transaction by ID — Manager & Owner
router.get("/:id", roleMiddleware("manager", "owner"), getTransactionById);

// Create new transaction — hanya Manager
router.post("/", roleMiddleware("manager"), createTransaction);

// Update transaction (DRAFT only) — hanya Manager
router.put("/:id", roleMiddleware("manager"), updateTransaction);

// Delete transaction (DRAFT only) — hanya Manager
router.delete("/:id", roleMiddleware("manager"), deleteTransaction);

// Approve transaction — Manager & Owner (workflow approval)
router.post("/:id/approve", roleMiddleware("manager", "owner"), approveTransaction);

// Reject transaction — Manager & Owner
router.post("/:id/reject", roleMiddleware("manager", "owner"), rejectTransaction);

// Post transaction to journal — hanya Manager
router.post("/:id/post", roleMiddleware("manager"), postTransaction);

export default router;
