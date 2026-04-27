import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request type untuk menambah user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = (
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
    const decoded = jwt.verify(token, jwtSecret);
    
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
