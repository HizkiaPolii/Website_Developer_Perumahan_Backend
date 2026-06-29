import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all chart of accounts dengan filter
export const getAllAccounts = async (req: Request, res: Response) => {
  try {
    const { companyId, accountType, parentId, isActive } = req.query;

    const filters: any = {};

    if (companyId) filters.companyId = parseInt(companyId as string);
    if (accountType) filters.accountType = accountType;
    if (parentId) filters.parentId = parseInt(parentId as string);
    if (isActive !== undefined) filters.isActive = isActive === "true";

    const accounts = await prisma.chartOfAccounts.findMany({
      where: filters,
      include: {
        parent: true,
        children: true,
      },
      orderBy: [{ accountCode: "asc" }],
    });

    res.json({
      success: true,
      data: accounts,
      count: accounts.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch accounts",
      error: error.message,
    });
  }
};

// Get account by ID
export const getAccountById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const account = await prisma.chartOfAccounts.findUnique({
      where: { id: parseInt(id) },
      include: {
        parent: true,
        children: true,
        debitTransactions: { take: 5 },
        creditTransactions: { take: 5 },
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    res.json({
      success: true,
      data: account,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch account",
      error: error.message,
    });
  }
};

// Create new account
export const createAccount = async (req: Request, res: Response) => {
  try {
    const {
      companyId,
      accountCode,
      accountName,
      accountType,
      parentId,
      level,
      isCashFlow,
      description,
    } = req.body;

    // Validasi required fields
    if (!companyId || !accountCode || !accountName || !accountType || !level) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check if account code already exists
    const existingAccount = await prisma.chartOfAccounts.findUnique({
      where: { accountCode },
    });

    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: "Account code already exists",
      });
    }

    const parsedCompanyId = parseInt(companyId.toString(), 10);
    const parsedParentId = parentId ? parseInt(parentId.toString(), 10) : null;

    const account = await prisma.chartOfAccounts.create({
      data: {
        companyId: parsedCompanyId,
        accountCode,
        accountName,
        accountType,
        parentId: parsedParentId,
        level: parseInt(level.toString(), 10),
        isCashFlow: isCashFlow || false,
        description,
      },
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: account,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to create account",
      error: error.message,
    });
  }
};

// Update account
export const updateAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const {
      accountName,
      isCashFlow,
      description,
      isActive,
    } = req.body;

    const account = await prisma.chartOfAccounts.update({
      where: { id: parseInt(id) },
      data: {
        ...(accountName && { accountName }),
        ...(isCashFlow !== undefined && { isCashFlow }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({
      success: true,
      message: "Account updated successfully",
      data: account,
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update account",
      error: error.message,
    });
  }
};

// Delete account
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    // Check if account has transactions or children
    const account = await prisma.chartOfAccounts.findUnique({
      where: { id: parseInt(id) },
      include: {
        children: true,
        debitTransactions: true,
        creditTransactions: true,
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    if (account.children.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete account with child accounts",
      });
    }

    if (account.debitTransactions.length > 0 || account.creditTransactions.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete account with transactions",
      });
    }

    await prisma.chartOfAccounts.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to delete account",
      error: error.message,
    });
  }
};

// Get account hierarchy
export const getAccountHierarchy = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "companyId is required",
      });
    }

    // Get root accounts (level 1)
    const hierarchy = await prisma.chartOfAccounts.findMany({
      where: {
        companyId: parseInt(companyId as string),
        parentId: null,
        isActive: true,
      },
      include: {
        children: {
          where: { isActive: true },
          include: {
            children: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { accountCode: "asc" },
    });

    res.json({
      success: true,
      data: hierarchy,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch account hierarchy",
      error: error.message,
    });
  }
};

// Get accounts by type
export const getAccountsByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.params as { type: string };
    const { companyId } = req.query;

    const validTypes = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account type",
      });
    }

    const filters: any = {
      accountType: type,
      isActive: true,
    };

    if (companyId) filters.companyId = parseInt(companyId as string);

    const accounts = await prisma.chartOfAccounts.findMany({
      where: filters,
      orderBy: { accountCode: "asc" },
    });

    res.json({
      success: true,
      data: accounts,
      count: accounts.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch accounts by type",
      error: error.message,
    });
  }
};
