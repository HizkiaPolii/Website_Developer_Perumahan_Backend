import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { buildFinancialReportsForDate } from "../utils/reportBuilder";

const prisma = new PrismaClient();

/**
 * Runs End of Day (EOD) process for a company.
 * Generates and finalizes all 4 main financial reports for the specified date.
 */
export async function runEODForCompany(companyId: number, date: Date, userId: number): Promise<void> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  console.log(`⏳ Running End of Day for Company ID ${companyId} on ${date.toDateString()}...`);

  // Calculate the reports
  const reports = await buildFinancialReportsForDate(companyId, date);

  const reportTypes = [
    { type: "NERACA", data: reports.balanceSheet },
    { type: "LABA_RUGI", data: reports.incomeStatement },
    { type: "ARUS_KAS", data: reports.cashFlowReport },
    { type: "MODAL", data: reports.equityChange }
  ];

  // Save each report as FINALIZED in the database
  for (const report of reportTypes) {
    await prisma.financialReport.upsert({
      where: {
        companyId_reportType_periodEnd: {
          companyId,
          reportType: report.type,
          periodEnd: endOfDay,
        }
      },
      update: {
        status: "FINALIZED",
        reportData: report.data as any,
        finalizedBy: userId,
        finalizedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        companyId,
        reportType: report.type,
        reportDate: new Date(),
        periodStart: startOfDay,
        periodEnd: endOfDay,
        status: "FINALIZED",
        reportData: report.data as any,
        createdBy: userId,
        finalizedBy: userId,
        finalizedAt: new Date(),
      }
    });
  }

  console.log(`✅ End of Day completed successfully for Company ID ${companyId} on ${date.toDateString()}`);
}

/**
 * Starts the automated EOD scheduler.
 * Runs every hour at minute 0, checking if it is 18:00 (6 PM) WITA on a weekday.
 */
export function startEODScheduler(): void {
  console.log("⏰ Initializing automated End-of-Day scheduler...");

  // Run at minute 0 of every hour
  cron.schedule("0 * * * *", async () => {
    try {
      const witaTimeStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Makassar" });
      const witaDate = new Date(witaTimeStr);

      const hours = witaDate.getHours();
      const dayOfWeek = witaDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      // EOD runs Monday-Friday (1-5) at exactly 18:00 WITA (6 PM)
      if (hours === 18 && dayOfWeek >= 1 && dayOfWeek <= 5) {
        console.log(`[Scheduler] 18:00 WITA reached. Triggering automatic End-of-Day...`);
        
        const companies = await prisma.company.findMany({
          where: { isActive: true }
        });

        // Run EOD for each company
        for (const company of companies) {
          // Use default admin or system user (ID 1)
          const systemUser = await prisma.user.findFirst({
            where: {
              OR: [
                { companyId: company.id },
                { role: "manager" },
                { role: "owner" }
              ]
            },
            orderBy: { id: "asc" }
          });
          const userId = systemUser ? systemUser.id : 1;

          await runEODForCompany(company.id, witaDate, userId);
        }
      }
    } catch (error) {
      console.error("[Scheduler] Error in automatic End-of-Day execution:", error);
    }
  });

  console.log("✅ Automated End-of-Day scheduler initialized successfully.");
}
