import express from "express";
import {
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountHierarchy,
  getAccountsByType,
} from "../controllers/chartOfAccountsController";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Read — Manager & Owner (Owner butuh lihat akun untuk laporan)
router.get("/", roleMiddleware("manager", "owner"), getAllAccounts);
router.get("/hierarchy", roleMiddleware("manager", "owner"), getAccountHierarchy);
router.get("/by-type/:type", roleMiddleware("manager", "owner"), getAccountsByType);
router.get("/:id", roleMiddleware("manager", "owner"), getAccountById);

// Write — hanya Manager
router.post("/", roleMiddleware("manager"), createAccount);
router.put("/:id", roleMiddleware("manager"), updateAccount);
router.delete("/:id", roleMiddleware("manager"), deleteAccount);

export default router;
