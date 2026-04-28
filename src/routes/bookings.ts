import { Router } from "express";
import {
  getAllBookings,
  getBookingById,
  createBooking,
  approveBooking,
  rejectBooking,
  cancelBooking,
} from "../controllers/bookingController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Protected routes - require authentication
router.get("/", authMiddleware, getAllBookings);
router.get("/:id", authMiddleware, getBookingById);
router.post("/", authMiddleware, createBooking);
router.put("/:id/approve", authMiddleware, approveBooking);
router.put("/:id/reject", authMiddleware, rejectBooking);
router.put("/:id/cancel", authMiddleware, cancelBooking);

export default router;
