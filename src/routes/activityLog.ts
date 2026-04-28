import { Router } from "express";
import {
  getAllActivityLogs,
  getActivityLogsByUserId,
  getActivityLogsByAction,
  getActivityLogsByRole,
  getActivityLogById,
  createActivityLog,
  getRecentActivityLogs,
} from "../controllers/activityLogController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Protected routes - require authentication
router.get("/", authMiddleware, getAllActivityLogs);
router.get("/recent", authMiddleware, getRecentActivityLogs);
router.get("/role", authMiddleware, getActivityLogsByRole);
router.get("/action/:action", authMiddleware, getActivityLogsByAction);
router.get("/user/:userId", authMiddleware, getActivityLogsByUserId);
router.get("/:id", authMiddleware, getActivityLogById);
router.post("/", authMiddleware, createActivityLog);

export default router;
