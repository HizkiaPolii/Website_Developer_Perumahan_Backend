import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Starting database cleanup for accounting data...");

  try {
    // Delete in order to satisfy foreign key constraints
    console.log("- Deleting IncomeStatementItem...");
    await prisma.incomeStatementItem.deleteMany({});

    console.log("- Deleting BalanceSheetItem...");
    await prisma.balanceSheetItem.deleteMany({});

    console.log("- Deleting FinancialReport...");
    await prisma.financialReport.deleteMany({});

    console.log("- Deleting AccountBalance...");
    await prisma.accountBalance.deleteMany({});

    console.log("- Deleting JournalEntryLine...");
    await prisma.journalEntryLine.deleteMany({});

    console.log("- Deleting JournalEntry...");
    await prisma.journalEntry.deleteMany({});

    console.log("- Deleting Transaction...");
    await prisma.transaction.deleteMany({});

    console.log("- Deleting ChartOfAccounts...");
    await prisma.chartOfAccounts.deleteMany({});

    console.log("✨ Database cleanup finished successfully. Chart of Accounts and all transactions are now empty.");
  } catch (error: any) {
    console.error("❌ Cleanup failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
