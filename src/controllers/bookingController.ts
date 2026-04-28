import { Request, Response } from "express";
import prisma from "../utils/database";
import { logActivity, createActivityDetails } from "../utils/activityLogger";

// Get all bookings
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, userId } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (userId) {
      where.userId = parseInt(userId as string);
    }

    const total = await prisma.booking.count({ where });

    const bookings = await prisma.booking.findMany({
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
            phone: true,
          },
        },
        unit: {
          select: {
            id: true,
            name: true,
            location: true,
            price: true,
            status: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Bookings retrieved successfully",
      data: bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get all bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
    });
  }
};

// Get booking by ID
export const getBookingById = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? parseInt(idParam[0]) : parseInt(idParam);
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        unit: {
          select: {
            id: true,
            name: true,
            location: true,
            price: true,
            status: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.json({
      success: true,
      message: "Booking retrieved successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Get booking by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
    });
  }
};

// Create booking (Ajukan Booking)
export const createBooking = async (req: Request, res: Response) => {
  try {
    const { unitId } = req.body;
    const userId = req.user?.id || 0;

    if (!unitId) {
      return res.status(400).json({
        success: false,
        message: "Unit ID harus diisi",
      });
    }

    // Check if unit exists
    const unit = await prisma.unit.findUnique({
      where: { id: parseInt(unitId) },
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: "Unit tidak ditemukan",
      });
    }

    // Check if user already has pending booking for this unit
    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId,
        unitId: parseInt(unitId),
        status: {
          in: ["pending", "approved"],
        },
      },
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: "Anda sudah memiliki booking untuk unit ini",
      });
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId,
        unitId: parseInt(unitId),
        status: "pending",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        unit: {
          select: {
            id: true,
            name: true,
            location: true,
            price: true,
            status: true,
          },
        },
      },
    });

    // Log activity
    const activityDetails = createActivityDetails("CREATE_BOOKING", {
      unitId: parseInt(unitId),
      userId,
    });
    await logActivity(userId, "CREATE_BOOKING", activityDetails);

    res.status(201).json({
      success: true,
      message: "Booking dibuat successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create booking",
    });
  }
};

// Approve booking
export const approveBooking = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? parseInt(idParam[0]) : parseInt(idParam);
    const approverUserId = req.user?.id || 0;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking tidak ditemukan",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Booking tidak bisa di-approve karena status: ${booking.status}`,
      });
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: "approved" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        unit: {
          select: {
            id: true,
            name: true,
            location: true,
            price: true,
            status: true,
          },
        },
      },
    });

    // Log activity
    const activityDetails = createActivityDetails("APPROVE_BOOKING", {
      bookingId: id,
    });
    await logActivity(approverUserId, "APPROVE_BOOKING", activityDetails);

    res.json({
      success: true,
      message: "Booking approved successfully",
      data: updatedBooking,
    });
  } catch (error) {
    console.error("Approve booking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve booking",
    });
  }
};

// Reject booking
export const rejectBooking = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? parseInt(idParam[0]) : parseInt(idParam);
    const rejectedByUserId = req.user?.id || 0;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking tidak ditemukan",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Booking tidak bisa di-reject karena status: ${booking.status}`,
      });
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: "rejected" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        unit: {
          select: {
            id: true,
            name: true,
            location: true,
            price: true,
            status: true,
          },
        },
      },
    });

    // Log activity
    const activityDetails = createActivityDetails("REJECT_BOOKING", {
      bookingId: id,
    });
    await logActivity(rejectedByUserId, "REJECT_BOOKING", activityDetails);

    res.json({
      success: true,
      message: "Booking rejected successfully",
      data: updatedBooking,
    });
  } catch (error) {
    console.error("Reject booking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject booking",
    });
  }
};

// Cancel booking
export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? parseInt(idParam[0]) : parseInt(idParam);
    const cancelledByUserId = req.user?.id || 0;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking tidak ditemukan",
      });
    }

    if (booking.status === "completed" || booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: `Booking tidak bisa di-cancel karena status: ${booking.status}`,
      });
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: "cancelled" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        unit: {
          select: {
            id: true,
            name: true,
            location: true,
            price: true,
            status: true,
          },
        },
      },
    });

    // Log activity
    const activityDetails = createActivityDetails("CANCEL_BOOKING", {
      bookingId: id,
    });
    await logActivity(cancelledByUserId, "CANCEL_BOOKING", activityDetails);

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      data: updatedBooking,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel booking",
    });
  }
};
