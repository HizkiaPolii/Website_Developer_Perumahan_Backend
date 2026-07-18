import { Request, Response } from "express";
import prisma from "../utils/database";
import bcrypt from "bcrypt";
import { logActivity, createActivityDetails } from "../utils/activityLogger";

// Get all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ 
      success: true, 
      message: "Users retrieved successfully",
      data: users 
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch users" 
    });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id as string) },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    res.json({ 
      success: true, 
      message: "User retrieved successfully",
      data: user 
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch user" 
    });
  }
};

// Create user
export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, name, password, phone, role, isActive } = req.body;
    
    if (!email || !name || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email, name, dan password harus diisi" 
      });
    }

    // Validate role if provided
    const validRoles = ["admin", "manager", "owner", "staf", "teller"];
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
        isActive: isActive !== undefined ? (isActive === true || isActive === "true") : true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log activity - admin/user creating new user
    const currentUserId = req.user?.id || 0;
    const activityDetails = createActivityDetails("CREATE_USER", { 
      email, 
      name, 
      role: role || "user" 
    });
    await logActivity(currentUserId, "CREATE_USER", activityDetails);

    res.status(201).json({ 
      success: true, 
      message: "User created successfully",
      data: user 
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create user" 
    });
  }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, password, isActive } = req.body;
    
    if (!name && !email && !phone && !role && !password && isActive === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: "Minimal harus update name, email, phone, role, password, atau isActive" 
      });
    }

    // Validate role if provided
    const validRoles = ["admin", "manager", "owner", "staf", "teller"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Role harus salah satu dari: ${validRoles.join(", ")}`
      });
    }

    // Cegah admin menonaktifkan atau menurunkan role akun sendiri yang
    // sedang login — kalau ini satu-satunya admin, itu akan mengunci
    // semua orang dari fitur admin tanpa cara masuk lagi.
    if (req.user?.id === parseInt(id as string)) {
      if (isActive === false || isActive === "false") {
        return res.status(400).json({
          success: false,
          message: "Tidak dapat menonaktifkan akun sendiri yang sedang login",
        });
      }
      if (role && role !== req.user?.role) {
        return res.status(400).json({
          success: false,
          message: "Tidak dapat mengubah role akun sendiri yang sedang login",
        });
      }
    }

    // Hash password jika di-update
    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id as string) },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(role && { role }),
        ...(hashedPassword && { password: hashedPassword }),
        ...(isActive !== undefined && { isActive: isActive === true || isActive === "true" }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log activity - updating user
    const currentUserId = req.user?.id || 0;
    const activityDetails = createActivityDetails("UPDATE_USER", { 
      userId: user.id,
      email: user.email,
      name: user.name,
      updatedFields: {
        name: !!name,
        email: !!email,
        phone: !!phone,
        role: !!role,
        password: !!password,
        isActive: isActive !== undefined
      }
    });
    await logActivity(currentUserId, "UPDATE_USER", activityDetails);

    res.json({ 
      success: true, 
      message: "User updated successfully",
      data: user 
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update user" 
    });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id as string);

    if (req.user?.id === userId) {
      return res.status(400).json({
        success: false,
        message: "Tidak dapat menghapus akun sendiri yang sedang login",
      });
    }

    // User yang sudah punya riwayat transaksi/jurnal/laporan tidak boleh
    // dihapus permanen (akan gagal karena foreign key) — arahkan ke
    // nonaktifkan (isActive: false) supaya riwayatnya tetap utuh.
    const [trxCount, journalCount, reportCount] = await Promise.all([
      prisma.transaction.count({ where: { OR: [{ userId }, { approvedBy: userId }] } }),
      prisma.journalEntry.count({ where: { OR: [{ userId }, { approvedBy: userId }] } }),
      prisma.financialReport.count({ where: { OR: [{ createdBy: userId }, { finalizedBy: userId }] } }),
    ]);

    if (trxCount > 0 || journalCount > 0 || reportCount > 0) {
      return res.status(400).json({
        success: false,
        message: "User ini sudah memiliki riwayat transaksi/jurnal/laporan dan tidak dapat dihapus permanen. Nonaktifkan user ini saja (toggle status) untuk mencabut aksesnya.",
      });
    }

    const user = await prisma.user.delete({
      where: { id: userId },
    });

    // Log activity - deleting user
    const currentUserId = req.user?.id || 0;
    const activityDetails = createActivityDetails("DELETE_USER", { 
      userId: parseInt(id as string)
    });
    await logActivity(currentUserId, "DELETE_USER", activityDetails);

    res.json({ 
      success: true, 
      message: "User deleted successfully",
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete user" 
    });
  }
};

