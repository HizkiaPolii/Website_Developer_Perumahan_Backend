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
import { roleMiddleware } from "../middleware/role";

const router = Router();

// Activity log — hanya Admin & Owner boleh baca
router.get("/", authMiddleware, roleMiddleware("admin", "owner"), getAllActivityLogs);
router.get("/recent", authMiddleware, roleMiddleware("admin", "owner"), getRecentActivityLogs);
router.get("/role", authMiddleware, roleMiddleware("admin", "owner"), getActivityLogsByRole);
router.get("/action/:action", authMiddleware, roleMiddleware("admin", "owner"), getActivityLogsByAction);
router.get("/user/:userId", authMiddleware, roleMiddleware("admin", "owner"), getActivityLogsByUserId);
router.get("/:id", authMiddleware, roleMiddleware("admin", "owner"), getActivityLogById);

// Create log — hanya Admin (atau sistem internal)
router.post("/", authMiddleware, roleMiddleware("admin"), createActivityLog);

export default router;
