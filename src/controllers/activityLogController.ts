import { Request, Response } from "express";
import prisma from "../utils/database";

// Get all activity logs dengan pagination
export const getAllActivityLogs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, userId, action } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    const where: any = {};
    if (userId) {
      where.userId = parseInt(userId as string);
    }
    if (action) {
      where.action = {
        contains: action as string,
        mode: "insensitive",
      };
    }

    // Get total count
    const total = await prisma.activityLog.count({ where });

    // Get activity logs
    const activityLogs = await prisma.activityLog.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Activity logs retrieved successfully",
      data: activityLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get all activity logs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activity logs",
    });
  }
};

// Get activity logs by user ID
export const getActivityLogsByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;
    const userIdNum = parseInt(userId as string);

    if (!userIdNum) {
      return res.status(400).json({
        success: false,
        message: "User ID harus diisi",
      });
    }

    // Get total count
    const total = await prisma.activityLog.count({
      where: { userId: userIdNum },
    });

    // Get activity logs
    const activityLogs = await prisma.activityLog.findMany({
      where: { userId: userIdNum },
      skip,
      take: limitNum,
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      message: "Activity logs retrieved successfully",
      data: activityLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get activity logs by user ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activity logs",
    });
  }
};

// Get activity logs by action type
export const getActivityLogsByAction = async (req: Request, res: Response) => {
  try {
    const actionParam = req.params.action;
    const action = Array.isArray(actionParam) ? actionParam[0] : actionParam;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: "Action type harus diisi",
      });
    }

    // Get total count
    const total = await prisma.activityLog.count({
      where: {
        action: {
          contains: action,
          mode: "insensitive",
        },
      },
    });

    // Get activity logs
    const activityLogs = await prisma.activityLog.findMany({
      where: {
        action: {
          contains: action,
          mode: "insensitive",
        },
      },
      skip,
      take: limitNum,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Activity logs retrieved successfully",
      data: activityLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get activity logs by action error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activity logs",
    });
  }
};

// Get activity logs grouped by role
export const getActivityLogsByRole = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Get activity logs with user role information
    const activityLogs = await prisma.activityLog.findMany({
      skip,
      take: limitNum,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Group by role
    const groupedByRole = activityLogs.reduce((acc: any, log: any) => {
      const role = log.user.role;
      if (!acc[role]) {
        acc[role] = [];
      }
      acc[role].push(log);
      return acc;
    }, {});

    // Get total count
    const total = await prisma.activityLog.count();

    res.json({
      success: true,
      message: "Activity logs retrieved successfully",
      data: {
        all: activityLogs,
        groupedByRole,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get activity logs by role error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activity logs",
    });
  }
};

// Create activity log
export const createActivityLog = async (req: Request, res: Response) => {
  try {
    const { userId, action, details } = req.body;

    if (!userId || !action) {
      return res.status(400).json({
        success: false,
        message: "userId dan action harus diisi",
      });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    // Create activity log
    const activityLog = await prisma.activityLog.create({
      data: {
        userId: parseInt(userId),
        action,
        details: details || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Activity log created successfully",
      data: activityLog,
    });
  } catch (error) {
    console.error("Create activity log error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create activity log",
    });
  }
};

// Get activity log by ID
export const getActivityLogById = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? parseInt(idParam[0]) : parseInt(idParam);
    const activityLog = await prisma.activityLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!activityLog) {
      return res.status(404).json({
        success: false,
        message: "Activity log tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Activity log retrieved successfully",
      data: activityLog,
    });
  } catch (error) {
    console.error("Get activity log by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activity log",
    });
  }
};

// Get activity logs for dashboard (recent activities)
export const getRecentActivityLogs = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit as string) || 10;

    const activityLogs = await prisma.activityLog.findMany({
      take: limitNum,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Recent activity logs retrieved successfully",
      data: activityLogs,
    });
  } catch (error) {
    console.error("Get recent activity logs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent activity logs",
    });
  }
};
