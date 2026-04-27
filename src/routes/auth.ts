import { Router } from "express";
import { login, register, verifyToken } from "../controllers/authController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Public endpoints
router.post("/login", login);
router.post("/register", register);

// Protected endpoints
router.get("/verify", authMiddleware, verifyToken);

export default router;
