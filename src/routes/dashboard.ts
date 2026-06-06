import express from "express";
import {
  getFinancialStats,
  getRecentTransactions,
  getDashboardSummary,
} from "../controllers/dashboardController";
import {
  generateBalanceSheet,
  generateIncomeStatement,
  getFinancialReport,
  getFinancialReports,
  finalizeReport,
  updateFinancialReport,
  createFinancialReport,
  getBalanceSheetItems,
  createBalanceSheetItem,
  updateBalanceSheetItem,
  deleteBalanceSheetItem,
  deleteFinancialReport,
  getIncomeStatementItems,
  createIncomeStatementItem,
  updateIncomeStatementItem,
  deleteIncomeStatementItem,
} from "../controllers/financialReportController";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";

const router = express.Router();

// Apply auth middleware
router.use(authMiddleware);

// ==================== DASHBOARD ====================
// Dashboard stats — semua role boleh akses
router.get("/stats", getFinancialStats);
router.get("/recent-transactions", roleMiddleware("manager", "owner"), getRecentTransactions);
router.get("/summary", getDashboardSummary);

// ==================== FINANCIAL REPORTS ====================
// Read — Manager & Owner
router.get("/reports", roleMiddleware("manager", "owner"), getFinancialReports);
router.get("/reports/:id", roleMiddleware("manager", "owner"), getFinancialReport);

// Generate — Manager & Owner
router.post("/reports/balance-sheet/generate", roleMiddleware("manager", "owner"), generateBalanceSheet);
router.post("/balance-sheet", roleMiddleware("manager", "owner"), generateBalanceSheet);
router.get("/balance-sheet", roleMiddleware("manager", "owner"), generateBalanceSheet);
router.post("/reports/income-statement/generate", roleMiddleware("manager", "owner"), generateIncomeStatement);
router.post("/income-statement", roleMiddleware("manager", "owner"), generateIncomeStatement);
router.get("/income-statement", roleMiddleware("manager", "owner"), generateIncomeStatement);

// Write — hanya Manager
router.post("/reports", roleMiddleware("manager"), createFinancialReport);
router.put("/reports/:id", roleMiddleware("manager"), updateFinancialReport);
router.post("/reports/:id/finalize", roleMiddleware("manager"), finalizeReport);
router.delete("/reports/:id", roleMiddleware("manager"), deleteFinancialReport);

// ==================== BALANCE SHEET ITEMS ====================
router.get("/reports/:reportId/items", roleMiddleware("manager", "owner"), getBalanceSheetItems);
router.post("/reports/items", roleMiddleware("manager"), createBalanceSheetItem);
router.put("/reports/items/:id", roleMiddleware("manager"), updateBalanceSheetItem);
router.delete("/reports/items/:id", roleMiddleware("manager"), deleteBalanceSheetItem);

// ==================== INCOME STATEMENT ITEMS ====================
router.get("/reports/income-statement/:reportId/items", roleMiddleware("manager", "owner"), getIncomeStatementItems);
router.post("/reports/income-statement/items", roleMiddleware("manager"), createIncomeStatementItem);
router.put("/reports/income-statement/items/:id", roleMiddleware("manager"), updateIncomeStatementItem);
router.delete("/reports/income-statement/items/:id", roleMiddleware("manager"), deleteIncomeStatementItem);

export default router;
