import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import { getAnalisisKinerja } from "../controllers/spkController";

const router = Router();

router.use(authMiddleware);

router.get("/analisis-kinerja", roleMiddleware("manager", "owner"), getAnalisisKinerja);

export default router;
