import { Router } from "express";

const router = Router();

// Import routes dari file-file lain
// import userRoutes from "./users";
// import unitRoutes from "./units";
// import bookingRoutes from "./bookings";

// app.use("/api/users", userRoutes);
// app.use("/api/units", unitRoutes);
// app.use("/api/bookings", bookingRoutes);

router.get("/", (req, res) => {
  res.json({ message: "API Routes" });
});

export default router;
