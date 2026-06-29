import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all journal entries with filters and pagination
export const getAllJournalEntries = async (req: Request, res: Response) => {
  try {
    const {
      companyId,
      from,
      to,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filters: any = {};

    if (companyId) filters.companyId = parseInt(companyId as string);

    // Only show posted journal entries
    filters.isPosted = false; // JournalEntry doesn't use isPosted for filtering since all are created on approve

    // Remove the isPosted filter - all journal entries are valid
    delete filters.isPosted;

    if (from || to) {
      filters.journalDate = {};
      if (from) filters.journalDate.gte = new Date(from as string);
      if (to) {
        const toDate = new Date(to as string);
        toDate.setHours(23, 59, 59, 999);
        filters.journalDate.lte = toDate;
      }
    }

    if (search) {
      filters.OR = [
        { journalNo: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [journalEntries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where: filters,
        include: {
          lines: {
            include: {
              account: {
                select: {
                  id: true,
                  accountCode: true,
                  accountName: true,
                  accountType: true,
                },
              },
            },
            orderBy: [{ debit: "desc" }], // Debit lines first
          },
          user: { select: { id: true, name: true, email: true } },
          approver: { select: { id: true, name: true, email: true } },
          transaction: {
            select: {
              id: true,
              transactionCode: true,
              transactionType: true,
              status: true,
              amount: true,
            },
          },
        },
        orderBy: { journalDate: "desc" },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.journalEntry.count({ where: filters }),
    ]);

    // Calculate totals for summary
    const allEntries = await prisma.journalEntryLine.aggregate({
      where: {
        journalEntry: filters,
      },
      _sum: {
        debit: true,
        credit: true,
      },
    });

    res.json({
      success: true,
      data: journalEntries,
      summary: {
        totalDebit: allEntries._sum.debit || 0,
        totalCredit: allEntries._sum.credit || 0,
      },
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    console.error("Error fetching journal entries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch journal entries",
      error: error.message,
    });
  }
};

// Get single journal entry by ID
export const getJournalEntryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const journalEntry = await prisma.journalEntry.findUnique({
      where: { id: parseInt(id) },
      include: {
        lines: {
          include: {
            account: {
              select: {
                id: true,
                accountCode: true,
                accountName: true,
                accountType: true,
              },
            },
          },
          orderBy: [{ debit: "desc" }],
        },
        user: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
        transaction: {
          select: {
            id: true,
            transactionCode: true,
            transactionType: true,
            transactionDate: true,
            description: true,
            status: true,
            amount: true,
          },
        },
      },
    });

    if (!journalEntry) {
      return res.status(404).json({
        success: false,
        message: "Journal entry not found",
      });
    }

    res.json({
      success: true,
      data: journalEntry,
    });
  } catch (error: any) {
    console.error("Error fetching journal entry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch journal entry",
      error: error.message,
    });
  }
};
