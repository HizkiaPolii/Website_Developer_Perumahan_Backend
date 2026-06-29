import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper to check if a financial period is locked (finalized)
const isPeriodLocked = async (companyId: number, date: Date): Promise<boolean> => {
  const finalizedReport = await prisma.financialReport.findFirst({
    where: {
      companyId,
      status: "FINALIZED",
      periodStart: { lte: date },
      periodEnd: { gte: date },
    },
  });
  return !!finalizedReport;
};

// Generate transaction code
const generateTransactionCode = async (companyId: number, type: string) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const typeCode = type.substring(0, 3).toUpperCase();

  // Get count of transactions for this month
  const count = await prisma.transaction.count({
    where: {
      companyId,
      transactionDate: {
        gte: new Date(year, date.getMonth(), 1),
        lt: new Date(year, date.getMonth() + 1, 1),
      },
    },
  });

  const seq = String(count + 1).padStart(4, "0");
  return `${typeCode}/${year}${month}${day}/${seq}`;
};

// Get all transactions with filters and pagination
export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const {
      companyId,
      type,
      status,
      from,
      to,
      category,
      page = 1,
      limit = 10,
    } = req.query;

    const filters: any = {};

    if (companyId) filters.companyId = parseInt(companyId as string);
    if (type) filters.transactionType = type;
    if (status) filters.status = status;
    if (category) filters.category = category;

    if (from || to) {
      filters.transactionDate = {};
      if (from) filters.transactionDate.gte = new Date(from as string);
      if (to) {
        const toDate = new Date(to as string);
        toDate.setHours(23, 59, 59, 999);
        filters.transactionDate.lte = toDate;
      }
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: filters,
        include: {
          debitAccount: true,
          creditAccount: true,
          user: { select: { id: true, name: true, email: true } },
          approver: { select: { id: true, name: true, email: true } },
        },
        orderBy: { transactionDate: "desc" },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.transaction.count({ where: filters }),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message,
    });
  }
};

// Get transaction by ID
export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
      include: {
        debitAccount: true,
        creditAccount: true,
        user: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
        journalEntry: {
          include: {
            lines: {
              include: { account: true },
            },
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch transaction",
      error: error.message,
    });
  }
};

// Create new transaction
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const {
      companyId,
      userId,
      transactionDate,
      transactionType,
      description,
      category,
      referenceNo,
      debitAccountId,
      creditAccountId,
      amount,
    } = req.body;

    // Validasi required fields
    if (
      !companyId ||
      !userId ||
      !transactionDate ||
      !transactionType ||
      !description ||
      !debitAccountId ||
      !creditAccountId ||
      !amount
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const parsedCompanyId = parseInt(companyId.toString(), 10);
    const parsedUserId = parseInt(userId.toString(), 10);
    const parsedDebitAccountId = parseInt(debitAccountId.toString(), 10);
    const parsedCreditAccountId = parseInt(creditAccountId.toString(), 10);

    // Check if period is locked
    const txDate = new Date(transactionDate);
    const locked = await isPeriodLocked(parsedCompanyId, txDate);
    if (locked) {
      return res.status(400).json({
        success: false,
        message: "Transaksi tidak dapat dibuat karena periode laporan keuangan untuk tanggal ini telah difinalisasi (Locked).",
      });
    }

    // Validate accounts exist
    const [debitAccount, creditAccount] = await Promise.all([
      prisma.chartOfAccounts.findUnique({
        where: { id: parsedDebitAccountId },
      }),
      prisma.chartOfAccounts.findUnique({
        where: { id: parsedCreditAccountId },
      }),
    ]);

    if (!debitAccount || !creditAccount) {
      return res.status(400).json({
        success: false,
        message: "Invalid account ID",
      });
    }

    // Generate transaction code
    const transactionCode = await generateTransactionCode(parsedCompanyId, transactionType);

    const transaction = await prisma.transaction.create({
      data: {
        companyId: parsedCompanyId,
        userId: parsedUserId,
        transactionCode,
        transactionDate: new Date(transactionDate),
        transactionType,
        description,
        category: category || null,
        referenceNo: referenceNo || null,
        debitAccountId: parsedDebitAccountId,
        creditAccountId: parsedCreditAccountId,
        amount: parseFloat(amount),
        status: "PENDING",
      },
      include: {
        debitAccount: true,
        creditAccount: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: transaction,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to create transaction",
      error: error.message,
    });
  }
};

// Update transaction (only for DRAFT status)
export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const {
      transactionDate,
      description,
      category,
      referenceNo,
      debitAccountId,
      creditAccountId,
      amount,
    } = req.body;

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (transaction.status !== "DRAFT" && transaction.status !== "REJECTED") {
      return res.status(400).json({
        success: false,
        message: "Can only update DRAFT or REJECTED transactions",
      });
    }

    // Check if original date is locked
    if (await isPeriodLocked(transaction.companyId, transaction.transactionDate)) {
      return res.status(400).json({
        success: false,
        message: "Transaksi tidak dapat diubah karena periode laporan keuangan untuk tanggal asal transaksi ini telah difinalisasi (Locked).",
      });
    }

    // Check if new date is locked
    if (transactionDate) {
      const txDate = new Date(transactionDate);
      if (await isPeriodLocked(transaction.companyId, txDate)) {
        return res.status(400).json({
          success: false,
          message: "Transaksi tidak dapat dipindahkan ke periode yang telah difinalisasi (Locked).",
        });
      }
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: {
        ...(transactionDate && { transactionDate: new Date(transactionDate) }),
        ...(description && { description }),
        ...(category !== undefined && { category }),
        ...(referenceNo !== undefined && { referenceNo }),
        ...(debitAccountId && { debitAccountId }),
        ...(creditAccountId && { creditAccountId }),
        ...(amount && { amount: parseFloat(amount) }),
      },
      include: {
        debitAccount: true,
        creditAccount: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({
      success: true,
      message: "Transaction updated successfully",
      data: updatedTransaction,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update transaction",
      error: error.message,
    });
  }
};

// Delete transaction (only for DRAFT status)
export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (transaction.status !== "DRAFT" && transaction.status !== "REJECTED") {
      return res.status(400).json({
        success: false,
        message: "Can only delete DRAFT or REJECTED transactions",
      });
    }

    // Check if date is locked
    if (await isPeriodLocked(transaction.companyId, transaction.transactionDate)) {
      return res.status(400).json({
        success: false,
        message: "Transaksi tidak dapat dihapus karena periode laporan keuangan untuk tanggal transaksi ini telah difinalisasi (Locked).",
      });
    }

    await prisma.transaction.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to delete transaction",
      error: error.message,
    });
  }
};

// Approve transaction
export const approveTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { approvedBy } = req.body;

    const approverUserId = approvedBy || req.user?.id;

    if (!approverUserId) {
      return res.status(400).json({
        success: false,
        message: "approvedBy is required",
      });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
      include: {
        debitAccount: true,
        creditAccount: true,
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (transaction.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Can only approve PENDING transactions",
      });
    }

    // Check if period is locked
    if (await isPeriodLocked(transaction.companyId, transaction.transactionDate)) {
      return res.status(400).json({
        success: false,
        message: "Transaksi tidak dapat disetujui karena periode laporan keuangan untuk tanggal transaksi ini telah difinalisasi (Locked).",
      });
    }

    const journalNo = `JE/${transaction.companyId}/${Date.now()}`;
    const approverId = parseInt(approverUserId.toString());

    // Generate journal entry and lines, and post transaction in a transaction block
    const result = await prisma.$transaction(async (tx) => {
      // Create journal entry and lines
      const journalEntry = await tx.journalEntry.create({
        data: {
          companyId: transaction.companyId,
          userId: transaction.userId,
          transactionId: transaction.id,
          journalDate: new Date(),
          journalNo,
          description: transaction.description,
          lines: {
            createMany: {
              data: [
                {
                  accountId: transaction.debitAccountId,
                  debit: transaction.amount,
                  credit: 0,
                  description: transaction.description,
                },
                {
                  accountId: transaction.creditAccountId,
                  debit: 0,
                  credit: transaction.amount,
                  description: transaction.description,
                },
              ],
            },
          },
        },
        include: {
          lines: { include: { account: true } },
        },
      });

      // Update transaction status to POSTED
      const updatedTrx = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "POSTED",
          approvedBy: approverId,
          approvedAt: new Date(),
        },
        include: {
          debitAccount: true,
          creditAccount: true,
          user: { select: { id: true, name: true, email: true } },
          approver: { select: { id: true, name: true, email: true } },
          journalEntry: { include: { lines: { include: { account: true } } } },
        },
      });

      return { transaction: updatedTrx, journalEntry };
    });

    res.json({
      success: true,
      message: "Transaction approved and posted successfully",
      data: result.transaction,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to approve transaction",
      error: error.message,
    });
  }
};

// Reject transaction
export const rejectTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "rejectionReason is required",
      });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (transaction.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Can only reject PENDING transactions",
      });
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: {
        status: "REJECTED",
        rejectionReason,
      },
      include: {
        debitAccount: true,
        creditAccount: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({
      success: true,
      message: "Transaction rejected successfully",
      data: updatedTransaction,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to reject transaction",
      error: error.message,
    });
  }
};

// Post transaction (create journal entry)
export const postTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
      include: {
        debitAccount: true,
        creditAccount: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (transaction.status !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Can only post APPROVED transactions",
      });
    }

    // Create journal entry and lines
    const journalNo = `JE/${transaction.companyId}/${Date.now()}`;

    const journalEntry = await prisma.journalEntry.create({
      data: {
        companyId: transaction.companyId,
        userId: transaction.userId,
        transactionId: transaction.id,
        journalDate: new Date(),
        journalNo,
        description: transaction.description,
        lines: {
          createMany: {
            data: [
              {
                accountId: transaction.debitAccountId,
                debit: transaction.amount,
                credit: 0,
                description: transaction.description,
              },
              {
                accountId: transaction.creditAccountId,
                debit: 0,
                credit: transaction.amount,
                description: transaction.description,
              },
            ],
          },
        },
      },
      include: {
        lines: { include: { account: true } },
      },
    });

    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: { status: "POSTED" },
      include: {
        debitAccount: true,
        creditAccount: true,
        journalEntry: { include: { lines: { include: { account: true } } } },
      },
    });

    res.json({
      success: true,
      message: "Transaction posted successfully",
      data: {
        transaction: updatedTransaction,
        journalEntry,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to post transaction",
      error: error.message,
    });
  }
};
