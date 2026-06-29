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

// Read — Teller, Manager & Owner (Owner butuh lihat akun untuk laporan)
router.get("/", roleMiddleware("teller", "manager", "owner"), getAllAccounts);
router.get("/hierarchy", roleMiddleware("teller", "manager", "owner"), getAccountHierarchy);
router.get("/by-type/:type", roleMiddleware("teller", "manager", "owner"), getAccountsByType);
router.get("/:id", roleMiddleware("teller", "manager", "owner"), getAccountById);

// Write — hanya Teller
router.post("/", roleMiddleware("teller"), createAccount);
router.put("/:id", roleMiddleware("teller"), updateAccount);
router.delete("/:id", roleMiddleware("teller"), deleteAccount);

export default router;
