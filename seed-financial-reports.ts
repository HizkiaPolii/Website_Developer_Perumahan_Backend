import prisma from "./src/utils/database";

const balanceSheetData = {
  "1.1.01": 800224338.54,
  "1.1.02": 463165395.19,
  "1.1.03": 1279209150,
  "1.1.05": 670327992.31,
  "1.1.06": 21849919,
  "1.2.01": 995278604.05,
  "1.2.04": 100000,
  "2.1.01": 2314649860,
  "2.1.02": 80381640.54,
  "2.1.03": 77352000,
  "2.1.04": 1000000,
  "2.2.01": 1500000000,
  "3.1.01": 394160000,
  "3.1.02": 1269601898.55,
};

const incomeStatementData = {
  "4.1.01": 1500000000,
  "4.1.02": 50000000,
  "4.2.01": 5000000,
  "5.1.01": 800000000,
  "6.1.01": 120000000,
  "6.1.02": 30000000,
  "6.2.01": 150000000,
  "6.2.02": 60000000,
  "6.2.03": 24000000,
  "6.2.04": 15000000,
  "7.1.01": 12000000,
  "7.1.02": 2000000,
  "7.1.03": 45000000,
};

async function main() {
  const company = await prisma.company.findFirst({
    orderBy: { id: "asc" },
  });

  if (!company) {
    throw new Error("Company belum ada. Jalankan seed company/user terlebih dahulu.");
  }

  const creator = await prisma.user.findFirst({
    where: {
      OR: [
        { companyId: company.id },
        { companyId: null },
      ],
    },
    orderBy: { id: "asc" },
  });

  if (!creator) {
    throw new Error("User pembuat laporan belum ada. Jalankan seed user terlebih dahulu.");
  }

  const periodStart = new Date("2025-01-01T00:00:00.000Z");
  const periodEnd = new Date("2025-12-31T00:00:00.000Z");
  const reportDate = periodEnd;

  const balanceSheet = await prisma.financialReport.upsert({
    where: {
      companyId_reportType_periodEnd: {
        companyId: company.id,
        reportType: "BALANCE_SHEET",
        periodEnd,
      },
    },
    update: {
      reportDate,
      periodStart,
      status: "DRAFT",
      reportData: balanceSheetData,
      createdBy: creator.id,
      notes: "Seeded sample balance sheet report data.",
    },
    create: {
      companyId: company.id,
      reportType: "BALANCE_SHEET",
      reportDate,
      periodStart,
      periodEnd,
      status: "DRAFT",
      reportData: balanceSheetData,
      createdBy: creator.id,
      notes: "Seeded sample balance sheet report data.",
    },
  });

  const incomeStatement = await prisma.financialReport.upsert({
    where: {
      companyId_reportType_periodEnd: {
        companyId: company.id,
        reportType: "INCOME_STATEMENT",
        periodEnd,
      },
    },
    update: {
      reportDate,
      periodStart,
      status: "DRAFT",
      reportData: incomeStatementData,
      createdBy: creator.id,
      notes: "Seeded sample income statement report data.",
    },
    create: {
      companyId: company.id,
      reportType: "INCOME_STATEMENT",
      reportDate,
      periodStart,
      periodEnd,
      status: "DRAFT",
      reportData: incomeStatementData,
      createdBy: creator.id,
      notes: "Seeded sample income statement report data.",
    },
  });

  console.log("Financial reports seeded:");
  console.log({
    companyId: company.id,
    createdBy: creator.id,
    balanceSheetId: balanceSheet.id,
    incomeStatementId: incomeStatement.id,
  });
}

main()
  .catch((error) => {
    console.error("Error seeding financial reports:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
