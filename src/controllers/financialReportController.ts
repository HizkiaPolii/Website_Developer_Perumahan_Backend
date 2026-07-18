import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { runEODForCompany } from "../services/eodService";
import { buildFinancialReportsForDate } from "../utils/reportBuilder";
import { logActivity } from "../utils/activityLogger";

const prisma = new PrismaClient();

// ==================== REAL-TIME BALANCE SHEET GENERATION ====================
// Calculates actual balances from posted transactions in the database.
// Delegates to buildFinancialReportsForDate (utils/reportBuilder.ts) — the
// same rollup logic used by the EOD/"Kunci & Arsipkan" flow — so this
// endpoint can't drift into its own, separately-buggy balance calculation.
export const generateBalanceSheet = async (req: Request, res: Response) => {
  try {
    // Accept from body OR query for flexibility
    const companyId = req.body.companyId || req.query.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "companyId diperlukan" });
    }
    const periodEnd = req.body.periodEnd || req.body.periodStart || req.query.periodEnd || new Date().toISOString();

    const periodEndDate = new Date(periodEnd);
    const parsedCompanyId = parseInt(companyId as string);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Cek apakah laporan yang sudah difinalisasi (dikunci) sudah ada di database
    const existingReport = await prisma.financialReport.findUnique({
      where: {
        companyId_reportType_periodEnd: {
          companyId: parsedCompanyId,
          reportType: "NERACA",
          periodEnd: periodEndDate,
        }
      },
      include: {
        creator: { select: { id: true, name: true } },
        finalizer: { select: { id: true, name: true } },
      }
    });

    if (existingReport && existingReport.status === "FINALIZED") {
      return res.json({
        success: true,
        message: "Laporan Neraca (FINALIZED/Locked) berhasil dimuat dari database",
        data: {
          id: existingReport.id,
          reportType: "NERACA",
          periodEnd: periodEndDate,
          status: "FINALIZED",
          reportData: existingReport.reportData,
          creator: existingReport.creator,
          finalizer: existingReport.finalizer,
          finalizedAt: existingReport.finalizedAt,
          notes: existingReport.notes,
        },
      });
    }

    const { balanceSheet } = await buildFinancialReportsForDate(parsedCompanyId, periodEndDate);

    // Simpan atau update DRAFT di database
    const savedReport = await prisma.financialReport.upsert({
      where: {
        companyId_reportType_periodEnd: {
          companyId: parsedCompanyId,
          reportType: "NERACA",
          periodEnd: periodEndDate,
        }
      },
      update: {
        reportData: balanceSheet as any,
        updatedAt: new Date(),
      },
      create: {
        companyId: parsedCompanyId,
        reportType: "NERACA",
        reportDate: new Date(),
        periodStart: new Date(periodEndDate.getFullYear(), 0, 1),
        periodEnd: periodEndDate,
        status: "DRAFT",
        reportData: balanceSheet as any,
        createdBy: userId,
      },
      include: {
        creator: { select: { id: true, name: true } },
      }
    });

    res.json({
      success: true,
      message: "Laporan Neraca berhasil digenerate dari database",
      data: {
        id: savedReport.id,
        reportType: "NERACA",
        periodEnd: periodEndDate,
        status: "DRAFT",
        reportData: balanceSheet,
        creator: savedReport.creator,
      },
    });
  } catch (error: any) {
    console.error("Error in generateBalanceSheet:", error);
    res.status(500).json({
      success: false,
      message: "Gagal membuat laporan neraca",
      error: error.message,
    });
  }
};

// ==================== REAL-TIME INCOME STATEMENT GENERATION ====================
export const generateIncomeStatement = async (req: Request, res: Response) => {
  try {
    const companyId = req.body.companyId || req.query.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "companyId diperlukan" });
    }
    const periodStart = req.body.periodStart || req.query.periodStart;
    const periodEnd = req.body.periodEnd || req.query.periodEnd;

    const start = periodStart ? new Date(periodStart) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = periodEnd ? new Date(periodEnd) : new Date();
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Cek apakah laporan yang sudah difinalisasi sudah ada di database
    const existingReport = await prisma.financialReport.findUnique({
      where: {
        companyId_reportType_periodEnd: {
          companyId: parseInt(companyId as string),
          reportType: "INCOME_STATEMENT",
          periodEnd: end,
        }
      },
      include: {
        creator: { select: { id: true, name: true } },
        finalizer: { select: { id: true, name: true } },
      }
    });

    if (existingReport && existingReport.status === "FINALIZED") {
      return res.json({
        success: true,
        message: "Laporan Laba Rugi (FINALIZED/Locked) berhasil dimuat dari database",
        data: {
          id: existingReport.id,
          reportType: "INCOME_STATEMENT",
          periodStart: start,
          periodEnd: end,
          status: "FINALIZED",
          reportData: existingReport.reportData,
          creator: existingReport.creator,
          finalizer: existingReport.finalizer,
          finalizedAt: existingReport.finalizedAt,
          notes: existingReport.notes,
        },
      });
    }

    // Get Revenue and Expense accounts
    const accounts = await prisma.chartOfAccounts.findMany({
      where: {
        companyId: parseInt(companyId as string),
        accountType: { in: ["REVENUE", "EXPENSE"] },
        isActive: true,
      },
      orderBy: { accountCode: "asc" },
    });

    // Get transactions for the period
    const transactions = await prisma.transaction.findMany({
      where: {
        companyId: parseInt(companyId as string),
        status: { in: ["POSTED", "APPROVED"] },
        transactionDate: { gte: start, lte: end },
      },
      select: {
        amount: true,
        debitAccountId: true,
        creditAccountId: true,
      },
    });

    // Calculate balance for each account
    const accountBalances = new Map<number, number>();

    for (const tx of transactions) {
      const amount = parseFloat(tx.amount.toString());

      // For REVENUE: Credit increases, Debit decreases
      // For EXPENSE: Debit increases, Credit decreases
      const currentDebit = accountBalances.get(tx.debitAccountId) || 0;
      const currentCredit = accountBalances.get(tx.creditAccountId) || 0;

      // Check if accounts are in our list
      const debitAcc = accounts.find(a => a.id === tx.debitAccountId);
      const creditAcc = accounts.find(a => a.id === tx.creditAccountId);

      if (debitAcc) {
        if (debitAcc.accountType === "EXPENSE") {
          accountBalances.set(tx.debitAccountId, currentDebit + amount);
        } else if (debitAcc.accountType === "REVENUE") {
          accountBalances.set(tx.debitAccountId, currentDebit - amount);
        }
      }

      if (creditAcc) {
        if (creditAcc.accountType === "REVENUE") {
          accountBalances.set(tx.creditAccountId, currentCredit + amount);
        } else if (creditAcc.accountType === "EXPENSE") {
          accountBalances.set(tx.creditAccountId, currentCredit - amount);
        }
      }
    }

    // Map account types to Indonesian naming
    const typeMap: Record<string, string> = {
      REVENUE: "PENDAPATAN",
      EXPENSE: "BEBAN",
    };

    const items = accounts
      .filter((acc) => acc.level === 4 || acc.level === 3) // Only leaf accounts
      .map((acc) => ({
        id: acc.id,
        code: acc.accountCode,
        name: acc.accountName,
        type: typeMap[acc.accountType] || acc.accountType,
        amount: accountBalances.get(acc.id) || 0,
      }));

    // Simpan atau update DRAFT di database
    const savedReport = await prisma.financialReport.upsert({
      where: {
        companyId_reportType_periodEnd: {
          companyId: parseInt(companyId as string),
          reportType: "INCOME_STATEMENT",
          periodEnd: end,
        }
      },
      update: {
        reportData: { items } as any,
        updatedAt: new Date(),
      },
      create: {
        companyId: parseInt(companyId as string),
        reportType: "INCOME_STATEMENT",
        reportDate: new Date(),
        periodStart: start,
        periodEnd: end,
        status: "DRAFT",
        reportData: { items } as any,
        createdBy: userId,
      },
      include: {
        creator: { select: { id: true, name: true } },
      }
    });

    res.json({
      success: true,
      message: "Laporan Laba Rugi berhasil digenerate dari database",
      data: {
        id: savedReport.id,
        reportType: "INCOME_STATEMENT",
        periodStart: start,
        periodEnd: end,
        status: "DRAFT",
        reportData: {
          items,
        },
        creator: savedReport.creator,
      },
    });
  } catch (error: any) {
    console.error("Error in generateIncomeStatement:", error);
    res.status(500).json({
      success: false,
      message: "Gagal membuat laporan laba rugi",
      error: error.message,
    });
  }
};

// ==================== INCOME STATEMENT ITEM CRUD ====================

export const getIncomeStatementItems = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params as { reportId: string };
    const items = await prisma.incomeStatementItem.findMany({
      where: { reportId: parseInt(reportId) },
      orderBy: { accountCode: 'asc' }
    });

    res.json({
      success: true,
      data: items
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch income statement items",
      error: error.message
    });
  }
};

export const createIncomeStatementItem = async (req: Request, res: Response) => {
  try {
    const { reportId, accountCode, accountName, balance, level, parentId } = req.body;

    const newItem = await prisma.incomeStatementItem.create({
      data: {
        reportId: parseInt(reportId),
        accountCode,
        accountName,
        balance: balance || 0,
        level: parseInt(level),
        parentId: parentId ? parseInt(parentId) : null,
        isParent: false
      }
    });

    if (parentId) {
      await prisma.incomeStatementItem.update({
        where: { id: parseInt(parentId) },
        data: { isParent: true }
      });
    }

    res.status(201).json({
      success: true,
      data: newItem
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to create income statement item",
      error: error.message
    });
  }
};

export const updateIncomeStatementItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { accountName, balance, accountCode } = req.body;

    const updatedItem = await prisma.incomeStatementItem.update({
      where: { id: parseInt(id) },
      data: {
        ...(accountName && { accountName }),
        ...(accountCode && { accountCode }),
        ...(balance !== undefined && { balance: parseFloat(balance) }),
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: updatedItem
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update income statement item",
      error: error.message
    });
  }
};

export const deleteIncomeStatementItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const children = await prisma.incomeStatementItem.findMany({
      where: { parentId: parseInt(id) }
    });

    if (children.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete item that has sub-points. Delete sub-points first."
      });
    }

    await prisma.incomeStatementItem.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: "Item deleted successfully"
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to delete income statement item",
      error: error.message
    });
  }
};

// ==================== REPORT CRUD ====================

export const getFinancialReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const report = await prisma.financialReport.findUnique({
      where: { id: parseInt(id) },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        finalizer: { select: { id: true, name: true, email: true } },
      },
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch report",
      error: error.message,
    });
  }
};

export const getFinancialReports = async (req: Request, res: Response) => {
  try {
    const { companyId, reportType, status, startDate, endDate } = req.query;

    const filters: any = {};

    if (companyId) filters.companyId = parseInt(companyId as string);
    if (reportType) filters.reportType = reportType;
    if (status) filters.status = status;

    if (startDate || endDate) {
      filters.periodEnd = {};
      if (startDate) filters.periodEnd.gte = new Date(startDate as string);
      if (endDate) filters.periodEnd.lte = new Date(endDate as string);
    }

    const reports = await prisma.financialReport.findMany({
      where: filters,
      include: {
        creator: { select: { id: true, name: true } },
        finalizer: { select: { id: true, name: true } },
      },
      orderBy: { periodEnd: "desc" },
    });

    res.json({
      success: true,
      data: reports,
      count: reports.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reports",
      error: error.message,
    });
  }
};

export const finalizeReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { finalizedBy, notes } = req.body;

    if (!finalizedBy) {
      return res.status(400).json({
        success: false,
        message: "finalizedBy is required",
      });
    }

    const report = await prisma.financialReport.update({
      where: { id: parseInt(id) },
      data: {
        status: "FINALIZED",
        finalizedBy: parseInt(finalizedBy),
        finalizedAt: new Date(),
        ...(notes && { notes }),
      },
      include: {
        creator: { select: { id: true, name: true } },
        finalizer: { select: { id: true, name: true } },
      },
    });

    res.json({
      success: true,
      message: "Report finalized successfully",
      data: report,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to finalize report",
      error: error.message,
    });
  }
};

export const updateFinancialReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { reportData, notes } = req.body;

    if (!reportData) {
      return res.status(400).json({
        success: false,
        message: "reportData is required",
      });
    }

    const currentReport = await prisma.financialReport.findUnique({
      where: { id: parseInt(id) },
    });

    if (!currentReport) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    if (currentReport.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message: `Cannot edit ${currentReport.status} report. Only DRAFT reports can be edited.`,
      });
    }

    const updatedReport = await prisma.financialReport.update({
      where: { id: parseInt(id) },
      data: {
        reportData,
        ...(notes && { notes }),
        updatedAt: new Date(),
      },
      include: {
        creator: { select: { id: true, name: true } },
        finalizer: { select: { id: true, name: true } },
      },
    });

    res.json({
      success: true,
      message: "Report updated successfully",
      data: updatedReport,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update report",
      error: error.message,
    });
  }
};

// ==================== BALANCE SHEET ITEM CRUD ====================

export const getBalanceSheetItems = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params as { reportId: string };
    const items = await prisma.balanceSheetItem.findMany({
      where: { reportId: parseInt(reportId) },
      orderBy: { accountCode: 'asc' }
    });

    res.json({
      success: true,
      data: items
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch balance sheet items",
      error: error.message
    });
  }
};

export const createBalanceSheetItem = async (req: Request, res: Response) => {
  try {
    const { reportId, accountCode, accountName, balance, level, parentId } = req.body;

    const newItem = await prisma.balanceSheetItem.create({
      data: {
        reportId: parseInt(reportId),
        accountCode,
        accountName,
        balance: balance || 0,
        level: parseInt(level),
        parentId: parentId ? parseInt(parentId) : null,
        isParent: false
      }
    });

    if (parentId) {
      await prisma.balanceSheetItem.update({
        where: { id: parseInt(parentId) },
        data: { isParent: true }
      });
    }

    res.status(201).json({
      success: true,
      data: newItem
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to create balance sheet item",
      error: error.message
    });
  }
};

export const updateBalanceSheetItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { accountName, balance, accountCode } = req.body;

    const updatedItem = await prisma.balanceSheetItem.update({
      where: { id: parseInt(id) },
      data: {
        ...(accountName && { accountName }),
        ...(accountCode && { accountCode }),
        ...(balance !== undefined && { balance: parseFloat(balance) }),
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: updatedItem
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update balance sheet item",
      error: error.message
    });
  }
};

export const deleteBalanceSheetItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const children = await prisma.balanceSheetItem.findMany({
      where: { parentId: parseInt(id) }
    });

    if (children.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete item that has sub-points. Delete sub-points first."
      });
    }

    await prisma.balanceSheetItem.delete({
      where: { id: parseInt(id as string) }
    });

    res.json({
      success: true,
      message: "Item deleted successfully"
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to delete balance sheet item",
      error: error.message
    });
  }
};

export const deleteFinancialReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const report = await prisma.financialReport.findUnique({
      where: { id: parseInt(id) }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    await prisma.financialReport.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: "Report and associated data deleted successfully"
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to delete report",
      error: error.message
    });
  }
};

export const createFinancialReport = async (req: Request, res: Response) => {
  try {
    const { companyId, reportType, periodStart, periodEnd, reportData, notes } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!companyId || !reportType || !periodStart || !periodEnd || !reportData) {
      return res.status(400).json({
        success: false,
        message: "companyId, reportType, periodStart, periodEnd, dan reportData harus diisi",
      });
    }

    const periodEndDate = new Date(periodEnd);

    // Cek apakah laporan yang sudah difinalisasi sudah ada
    const existingReport = await prisma.financialReport.findUnique({
      where: {
        companyId_reportType_periodEnd: {
          companyId: parseInt(companyId),
          reportType,
          periodEnd: periodEndDate,
        }
      }
    });

    if (existingReport && existingReport.status === "FINALIZED") {
      return res.status(400).json({
        success: false,
        message: "Laporan untuk periode ini telah difinalisasi dan tidak dapat diubah.",
      });
    }

    let report;
    if (existingReport) {
      report = await prisma.financialReport.update({
        where: { id: existingReport.id },
        data: {
          reportData,
          ...(notes && { notes }),
          updatedAt: new Date(),
        },
        include: {
          creator: { select: { id: true, name: true } },
          finalizer: { select: { id: true, name: true } },
        }
      });
    } else {
      report = await prisma.financialReport.create({
        data: {
          companyId: parseInt(companyId),
          reportType,
          reportDate: new Date(),
          periodStart: new Date(periodStart),
          periodEnd: periodEndDate,
          status: "DRAFT",
          reportData,
          ...(notes && { notes }),
          createdBy: userId,
        },
        include: {
          creator: { select: { id: true, name: true } },
          finalizer: { select: { id: true, name: true } },
        }
      });
    }

    res.status(201).json({
      success: true,
      message: "Laporan berhasil disimpan",
      data: report
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Gagal menyimpan laporan",
      error: error.message
    });
  }
};

export const triggerEOD = async (req: Request, res: Response) => {
  try {
    const { companyId, date } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!companyId || !date) {
      return res.status(400).json({
        success: false,
        message: "companyId dan date harus diisi",
      });
    }

    const parsedCompanyId = parseInt(companyId.toString(), 10);
    const targetDate = new Date(date);

    await runEODForCompany(parsedCompanyId, targetDate, userId);

    await logActivity(userId, "LOCK_ARCHIVE_REPORT", `Kunci & Arsipkan laporan tanggal ${targetDate.toLocaleDateString("id-ID")}`);

    res.json({
      success: true,
      message: `End of Day untuk tanggal ${targetDate.toLocaleDateString("id-ID")} berhasil dijalankan.`,
    });
  } catch (error: any) {
    console.error("Error triggering EOD:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menjalankan End of Day",
      error: error.message,
    });
  }
};


