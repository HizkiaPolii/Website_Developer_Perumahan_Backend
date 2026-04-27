import { Router } from "express";
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from "../controllers/userController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// User routes (memerlukan autentikasi)
router.get("/", authMiddleware, getAllUsers);
router.get("/:id", authMiddleware, getUserById);
router.post("/", authMiddleware, createUser);
router.put("/:id", authMiddleware, updateUser);
router.delete("/:id", authMiddleware, deleteUser);

export default router;
