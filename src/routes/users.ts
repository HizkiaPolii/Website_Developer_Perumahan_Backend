import { Router } from "express";
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from "../controllers/userController";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";

const router = Router();

// User routes — hanya Admin yang boleh mengelola user
router.get("/", authMiddleware, roleMiddleware("admin"), getAllUsers);
router.get("/:id", authMiddleware, roleMiddleware("admin"), getUserById);
router.post("/", authMiddleware, roleMiddleware("admin"), createUser);
router.put("/:id", authMiddleware, roleMiddleware("admin"), updateUser);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteUser);

export default router;
