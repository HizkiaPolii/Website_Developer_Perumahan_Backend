import { Request, Response } from "express";
import prisma from "../utils/database";
import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";

// Login user
export const login = async (req: Request, res: Response) => {
  console.log("🔓 LOGIN FUNCTION CALLED");
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email dan password harus diisi" 
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Email atau password salah" 
      });
    }

    // Compare password dengan hash yang tersimpan
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Email atau password salah" 
      });
    }

    // Generate JWT token
    try {
      const jwtSecret = (process.env.JWT_SECRET || "your-secret-key") as string;
      const jwtExpire = process.env.JWT_EXPIRE || "7d";
      
      console.log("🔐 JWT Secret:", jwtSecret);
      console.log("🔐 JWT Expire:", jwtExpire);
      
      const options: SignOptions = {
        expiresIn: jwtExpire as any,
      };
      
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        jwtSecret,
        options
      );
      
      console.log("✅ Token generated:", token);

      res.json({ 
        success: true, 
        message: "Login berhasil",
        token,
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name,
          phone: user.phone,
          role: user.role
        } 
      });
    } catch (tokenError) {
      console.error("❌ Token generation error:", tokenError);
      res.json({ 
        success: true, 
        message: "Login berhasil (token error)",
        token: null,
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name,
          phone: user.phone,
          role: user.role
        } 
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Gagal login" });
  }
};

// Register user
export const register = async (req: Request, res: Response) => {
  try {
    const { email, name, password, passwordConfirm, phone, role } = req.body;

    if (!email || !name || !password || !passwordConfirm) {
      return res.status(400).json({ 
        success: false, 
        message: "Semua field harus diisi" 
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ 
        success: false, 
        message: "Password tidak cocok" 
      });
    }

    // Validate role if provided
    const validRoles = ["admin", "marketing", "manager", "owner", "user"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: `Role harus salah satu dari: ${validRoles.join(", ")}` 
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "Email sudah terdaftar" 
      });
    }

    // Hash password sebelum menyimpan
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { 
        email, 
        name, 
        password: hashedPassword,
        ...(phone && { phone }),
        ...(role && { role }),
      },
    });

    res.status(201).json({ 
      success: true, 
      message: "Registrasi berhasil",
      data: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        phone: user.phone,
        role: user.role 
      } 
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Gagal registrasi" });
  }
};

// Verify token & return user info
export const verifyToken = async (req: Request, res: Response) => {
  try {
    // User info sudah di-extract di auth middleware
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "User tidak ditemukan" 
      });
    }

    res.json({ 
      success: true, 
      message: "Token valid",
      user 
    });
  } catch (error) {
    console.error("Verify token error:", error);
    res.status(500).json({ success: false, message: "Failed to verify token" });
  }
};
