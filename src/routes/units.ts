import { Router } from "express";
import {
  getAllUnits,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit,
} from "../controllers/unitController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Public endpoints (get units)
router.get("/", getAllUnits);
router.get("/:id", getUnitById);

// Protected routes - require authentication (create, update, delete)
router.post("/", authMiddleware, createUnit);
router.put("/:id", authMiddleware, updateUnit);
router.delete("/:id", authMiddleware, deleteUnit);

export default router;
