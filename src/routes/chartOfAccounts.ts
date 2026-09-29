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

// Read — Teller, Manager & Owner
// (Teller butuh daftar akun untuk input transaksi, Owner untuk laporan)
router.get("/", roleMiddleware("teller", "manager", "owner"), getAllAccounts);
router.get("/hierarchy", roleMiddleware("teller", "manager", "owner"), getAccountHierarchy);
router.get("/by-type/:type", roleMiddleware("teller", "manager", "owner"), getAccountsByType);
router.get("/:id", roleMiddleware("teller", "manager", "owner"), getAccountById);

// Write — hanya Manager (pengelolaan Master Akun dipindahkan dari Teller ke Manager)
router.post("/", roleMiddleware("manager"), createAccount);
router.put("/:id", roleMiddleware("manager"), updateAccount);
router.delete("/:id", roleMiddleware("manager"), deleteAccount);

export default router;
