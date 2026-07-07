import { Router } from "express";
import {
  getAllPurchaseRequests,
  getPurchaseRequestById,
  createPurchaseRequest,
  approvePurchaseRequestManager,
  approvePurchaseRequestOwner,
  rejectPurchaseRequest,
  deletePurchaseRequest,
} from "../controllers/purchaseRequestController";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";

const router = Router();

// Apply authMiddleware to all routes
router.use(authMiddleware);

// Lihat semua request — Staf, Manager & Owner
router.get("/", roleMiddleware("staf", "manager", "owner"), getAllPurchaseRequests);

// Lihat detail request — Staf, Manager & Owner
router.get("/:id", roleMiddleware("staf", "manager", "owner"), getPurchaseRequestById);

// Buat request pengadaan — hanya Staf
router.post("/", roleMiddleware("staf"), createPurchaseRequest);

// Approve level Manager — hanya Manager
router.post("/:id/approve-manager", roleMiddleware("manager"), approvePurchaseRequestManager);

// Final approval — hanya Owner
router.post("/:id/approve-owner", roleMiddleware("owner"), approvePurchaseRequestOwner);

// Tolak request — Manager atau Owner
router.post("/:id/reject", roleMiddleware("manager", "owner"), rejectPurchaseRequest);

// Hapus request — hanya Staf (pembuat request)
router.delete("/:id", roleMiddleware("staf"), deletePurchaseRequest);

export default router;
