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

    // Revenue/expense accounts — dipakai utk hitung pendapatan/beban dari arah
    // debit-kredit akun sungguhan (REVENUE/EXPENSE), bukan dari label
    // transactionType, supaya retur/koreksi ikut mengurangi bukan malah
    // dijumlahkan (lihat perbaikan serupa di spkController.ts).
    const revenueExpenseAccounts = await prisma.chartOfAccounts.findMany({
      where: { companyId: companyIdInt, accountType: { in: ["REVENUE", "EXPENSE"] }, isActive: true },
      select: { id: true, accountType: true },
    });
    const revenueIds = new Set(revenueExpenseAccounts.filter((a) => a.accountType === "REVENUE").map((a) => a.id));
    const expenseIds = new Set(revenueExpenseAccounts.filter((a) => a.accountType === "EXPENSE").map((a) => a.id));

    const trxInPeriod = await prisma.transaction.findMany({
      where: {
        companyId: companyIdInt,
        status: "POSTED",
        transactionDate: { gte: start, lte: end },
      },
      select: { debitAccountId: true, creditAccountId: true, amount: true },
    });

    let totalRevenue = 0;
    let totalExpense = 0;
    trxInPeriod.forEach((t) => {
      const a = parseFloat(t.amount.toString());
      if (revenueIds.has(t.creditAccountId)) totalRevenue += a;
      if (revenueIds.has(t.debitAccountId)) totalRevenue -= a;
      if (expenseIds.has(t.debitAccountId)) totalExpense += a;
      if (expenseIds.has(t.creditAccountId)) totalExpense -= a;
    });

    const netProfit = totalRevenue - totalExpense;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Get cash balance (akun kas/bank sungguhan, ditandai isCashFlow)
    const cashAccounts = await prisma.chartOfAccounts.findMany({
      where: {
        companyId: companyIdInt,
        isCashFlow: true,
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
  const revenueExpenseAccounts = await prisma.chartOfAccounts.findMany({
    where: { companyId, accountType: { in: ["REVENUE", "EXPENSE"] }, isActive: true },
    select: { id: true, accountType: true },
  });
  const revenueIds = new Set(revenueExpenseAccounts.filter((a) => a.accountType === "REVENUE").map((a) => a.id));
  const expenseIds = new Set(revenueExpenseAccounts.filter((a) => a.accountType === "EXPENSE").map((a) => a.id));

  const trxInPeriod = await prisma.transaction.findMany({
    where: {
      companyId,
      status: "POSTED",
      transactionDate: { gte: startDate, lte: endDate },
    },
    select: { debitAccountId: true, creditAccountId: true, amount: true },
  });

  let totalRevenue = 0;
  let totalExpense = 0;
  trxInPeriod.forEach((t) => {
    const a = parseFloat(t.amount.toString());
    if (revenueIds.has(t.creditAccountId)) totalRevenue += a;
    if (revenueIds.has(t.debitAccountId)) totalRevenue -= a;
    if (expenseIds.has(t.debitAccountId)) totalExpense += a;
    if (expenseIds.has(t.creditAccountId)) totalExpense -= a;
  });

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
