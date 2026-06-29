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

// Retrieve all purchase requests (accessible by any logged-in user)
router.get("/", getAllPurchaseRequests);

// Retrieve single purchase request details
router.get("/:id", getPurchaseRequestById);

// Create a new purchase request (accessible by staf, teller, admin, manager, owner)
router.post("/", roleMiddleware("staf", "teller", "admin", "manager", "owner"), createPurchaseRequest);

// Validate/Approve at Manager level (accessible by manager, owner, admin)
router.post("/:id/approve-manager", roleMiddleware("manager", "owner", "admin"), approvePurchaseRequestManager);

// Final approve at Owner level (accessible by owner, admin)
router.post("/:id/approve-owner", roleMiddleware("owner", "admin"), approvePurchaseRequestOwner);

// Reject request (accessible by manager, owner, admin)
router.post("/:id/reject", roleMiddleware("manager", "owner", "admin"), rejectPurchaseRequest);

// Delete request (accessible by creator/admin)
router.delete("/:id", deletePurchaseRequest);

export default router;
