import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../utils/database";

// Extend Express Request type untuk menambah user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Token tidak ditemukan" 
      });
    }

    const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Check user active status in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { isActive: true }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "User tidak ditemukan" 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: "Akun Anda dinonaktifkan. Silakan hubungi Administrator." 
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ 
      success: false, 
      message: "Token tidak valid" 
    });
  }
};
