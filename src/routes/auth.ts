import { Router } from "express";
import { login, register, verifyToken } from "../controllers/authController";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";

const router = Router();

// Public endpoints
router.post("/login", login);

// Sistem ini tidak punya self-signup — semua user dibuat Admin lewat
// "Kelola User" (POST /api/users). Endpoint /register tetap ada untuk
// kompatibilitas tapi dikunci ke Admin saja, supaya siapa pun tidak bisa
// mendaftar sendiri dengan role bebas (termasuk "admin") tanpa login.
router.post("/register", authMiddleware, roleMiddleware("admin"), register);

// Protected endpoints
router.get("/verify", authMiddleware, verifyToken);

export default router;
