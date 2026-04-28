import { Request, Response } from "express";
import prisma from "../utils/database";
import { logActivity, createActivityDetails } from "../utils/activityLogger";

// Get all units
export const getAllUnits = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const total = await prisma.unit.count({ where });

    const units = await prisma.unit.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      message: "Units retrieved successfully",
      data: units,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get all units error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch units",
    });
  }
};

// Get unit by ID
export const getUnitById = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? parseInt(idParam[0]) : parseInt(idParam);
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            status: "approved",
          },
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: "Unit tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Unit retrieved successfully",
      data: unit,
    });
  } catch (error) {
    console.error("Get unit by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unit",
    });
  }
};

// Create unit
export const createUnit = async (req: Request, res: Response) => {
  try {
    const { name, location, price, status } = req.body;
    const userId = req.user?.id || 0;

    if (!name || !location || !price) {
      return res.status(400).json({
        success: false,
        message: "Name, location, dan price harus diisi",
      });
    }

    // Validate status if provided
    const validStatus = ["available", "sold", "rented", "reserved"];
    if (status && !validStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status harus salah satu dari: ${validStatus.join(", ")}`,
      });
    }

    const unit = await prisma.unit.create({
      data: {
        name,
        location,
        price: parseFloat(price),
        status: status || "available",
      },
    });

    // Log activity
    const activityDetails = createActivityDetails("CREATE_UNIT", {
      name,
      location,
      price: parseFloat(price),
    });
    await logActivity(userId, "CREATE_UNIT", activityDetails);

    res.status(201).json({
      success: true,
      message: "Unit created successfully",
      data: unit,
    });
  } catch (error) {
    console.error("Create unit error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create unit",
    });
  }
};

// Update unit
export const updateUnit = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? parseInt(idParam[0]) : parseInt(idParam);
    const { name, location, price, status } = req.body;
    const userId = req.user?.id || 0;

    if (!name && !location && !price && !status) {
      return res.status(400).json({
        success: false,
        message: "Minimal harus update name, location, price, atau status",
      });
    }

    // Validate status if provided
    const validStatus = ["available", "sold", "rented", "reserved"];
    if (status && !validStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status harus salah satu dari: ${validStatus.join(", ")}`,
      });
    }

    const unit = await prisma.unit.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(location && { location }),
        ...(price && { price: parseFloat(price) }),
        ...(status && { status }),
      },
    });

    // Log activity
    const activityDetails = createActivityDetails("UPDATE_UNIT", {
      unitId: id,
      name,
      status,
    });
    await logActivity(userId, "UPDATE_UNIT", activityDetails);

    res.json({
      success: true,
      message: "Unit updated successfully",
      data: unit,
    });
  } catch (error) {
    console.error("Update unit error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update unit",
    });
  }
};

// Delete unit
export const deleteUnit = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? parseInt(idParam[0]) : parseInt(idParam);
    const userId = req.user?.id || 0;

    // Check if unit has approved bookings
    const bookings = await prisma.booking.findFirst({
      where: {
        unitId: id,
        status: "approved",
      },
    });

    if (bookings) {
      return res.status(400).json({
        success: false,
        message: "Unit tidak bisa dihapus karena memiliki approved booking",
      });
    }

    const unit = await prisma.unit.delete({
      where: { id },
    });

    // Log activity
    const activityDetails = createActivityDetails("DELETE_UNIT", {
      unitId: id,
    });
    await logActivity(userId, "DELETE_UNIT", activityDetails);

    res.json({
      success: true,
      message: "Unit deleted successfully",
      data: {
        id: unit.id,
        name: unit.name,
        location: unit.location,
      },
    });
  } catch (error) {
    console.error("Delete unit error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete unit",
    });
  }
};
