import express from "express";
import {
  getAllJournalEntries,
  getJournalEntryById,
} from "../controllers/journalEntryController";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all journal entries — Teller, Manager & Owner
router.get("/", roleMiddleware("teller", "manager", "owner"), getAllJournalEntries);

// Get journal entry by ID — Teller, Manager & Owner
router.get("/:id", roleMiddleware("teller", "manager", "owner"), getJournalEntryById);

export default router;
