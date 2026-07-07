import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// Get financial dashboard stats
export const getFinancialStats = async (req: Request, res: Response) => {
  try {
    const { companyId, startDate, endDate } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "companyId is required",
      });
    }

    const companyIdInt = parseInt(companyId as string);
    if (isNaN(companyIdInt)) {
      return res.status(400).json({
        success: false,
        message: "companyId harus berupa angka",
      });
    }

    const start = startDate
      ? new Date(startDate as string)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const end = endDate
      ? new Date(endDate as string)
      : new Date();

    // Get revenue transactions
    const revenueTransactions = await prisma.transaction.findMany({
      where: {
        companyId: companyIdInt,
        transactionType: "PENDAPATAN",
        status: "POSTED",
        transactionDate: {
          gte: start,
          lte: end,
        },
      },
      select: { amount: true },
    });

    // Get expense transactions
    const expenseTransactions = await prisma.transaction.findMany({
      where: {
        companyId: companyIdInt,
        transactionType: "PENGELUARAN",
        status: "POSTED",
        transactionDate: {
          gte: start,
          lte: end,
        },
      },
      select: { amount: true },
    });

    // Calculate totals
    const totalRevenue = revenueTransactions.reduce(
      (sum, t) => sum + parseFloat(t.amount.toString()),
      0
    );

    const totalExpense = expenseTransactions.reduce(
      (sum, t) => sum + parseFloat(t.amount.toString()),
      0
    );

    const netProfit = totalRevenue - totalExpense;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Get cash balance (from ASSET accounts)
    const cashAccounts = await prisma.chartOfAccounts.findMany({
      where: {
        companyId: companyIdInt,
        accountType: "ASSET",
        accountCode: { contains: "1.1" }, // Current assets
      },
      select: { id: true },
    });

    const cashDebit = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        debitAccountId: { in: cashAccounts.map((a) => a.id) },
        status: "POSTED",
      },
    });

    const cashCredit = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        creditAccountId: { in: cashAccounts.map((a) => a.id) },
        status: "POSTED",
      },
    });

    const cashBalance =
      (parseFloat(cashDebit._sum.amount?.toString() || "0") || 0) -
      (parseFloat(cashCredit._sum.amount?.toString() || "0") || 0);

    res.json({
      success: true,
      data: {
        period: {
          startDate: start,
          endDate: end,
        },
        totalRevenue,
        totalExpense,
        netProfit,
        profitMargin: parseFloat(profitMargin.toFixed(2)),
        cashBalance,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch financial stats",
      error: error.message,
    });
  }
};

// Get recent transactions
export const getRecentTransactions = async (req: Request, res: Response) => {
  try {
    const { companyId, limit = 10 } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "companyId is required",
      });
    }

    const companyIdInt = parseInt(companyId as string);
    if (isNaN(companyIdInt)) {
      return res.status(400).json({ success: false, message: "companyId harus berupa angka" });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        companyId: companyIdInt,
        status: "POSTED",
      },
      include: {
        debitAccount: { select: { accountName: true, accountCode: true } },
        creditAccount: { select: { accountName: true, accountCode: true } },
        user: { select: { name: true } },
      },
      orderBy: { transactionDate: "desc" },
      take: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: transactions,
      count: transactions.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent transactions",
      error: error.message,
    });
  }
};

// Get dashboard summary
export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "companyId is required",
      });
    }

    const companyIdInt = parseInt(companyId as string);
    if (isNaN(companyIdInt)) {
      return res.status(400).json({ success: false, message: "companyId harus berupa angka" });
    }

    // Get current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Stats for current month
    const stats = await getMonthlyStats(companyIdInt, monthStart, monthEnd);

    // Get pending transactions
    const pendingTransactions = await prisma.transaction.count({
      where: {
        companyId: companyIdInt,
        status: "PENDING",
      },
    });

    // Get pending journals
    const pendingJournals = await prisma.journalEntry.count({
      where: {
        companyId: companyIdInt,
        isPosted: false,
      },
    });

    // Get last 5 transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        companyId: companyIdInt,
        status: "POSTED",
      },
      include: {
        debitAccount: { select: { accountName: true } },
        creditAccount: { select: { accountName: true } },
      },
      orderBy: { transactionDate: "desc" },
      take: 5,
    });

    // Get account type breakdown
    const accountBalances = await prisma.accountBalance.findMany({
      where: {
        companyId: companyIdInt,
        periodDate: monthEnd,
      },
      include: {
        account: { select: { accountType: true } },
      },
    });

    const balanceByType = accountBalances.reduce(
      (acc, bal) => {
        const type = bal.account.accountType;
        if (!acc[type]) acc[type] = 0;
        acc[type] += parseFloat(bal.closingBalance.toString());
        return acc;
      },
      {} as Record<string, number>
    );

    res.json({
      success: true,
      data: {
        month: {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        },
        stats,
        pending: {
          transactions: pendingTransactions,
          journals: pendingJournals,
        },
        recentTransactions,
        balanceByType,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard summary",
      error: error.message,
    });
  }
};

// Helper function to get monthly stats
const getMonthlyStats = async (
  companyId: number,
  startDate: Date,
  endDate: Date
) => {
  const revenue = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: {
      companyId,
      transactionType: "PENDAPATAN",
      status: "POSTED",
      transactionDate: { gte: startDate, lte: endDate },
    },
  });

  const expense = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: {
      companyId,
      transactionType: "PENGELUARAN",
      status: "POSTED",
      transactionDate: { gte: startDate, lte: endDate },
    },
  });

  const totalRevenue = parseFloat(revenue._sum.amount?.toString() || "0") || 0;
  const totalExpense = parseFloat(expense._sum.amount?.toString() || "0") || 0;

  return {
    totalRevenue,
    totalExpense,
    netProfit: totalRevenue - totalExpense,
    transactionCount: await prisma.transaction.count({
      where: {
        companyId,
        status: "POSTED",
        transactionDate: { gte: startDate, lte: endDate },
      },
    }),
  };
};
