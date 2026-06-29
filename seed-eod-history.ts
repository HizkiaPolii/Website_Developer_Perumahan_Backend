import { PrismaClient } from "@prisma/client";
import { runEODForCompany } from "./src/services/eodService";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🌱 Starting to backfill EOD reports for the past 2 weeks...");

    const company = await prisma.company.findFirst({
      where: { isActive: true }
    });

    if (!company) {
      throw new Error("No active company found. Please seed company first.");
    }

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

    // Loop through the past 14 days
    const today = new Date();
    for (let i = 14; i >= 1; i--) {
      const targetDate = new Date();
      targetDate.setDate(today.getDate() - i);
      
      const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 6 = Saturday
      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }

      console.log(`\n----------------------------------------`);
      console.log(`📅 Processing EOD for date: ${targetDate.toLocaleDateString("id-ID")}`);
      await runEODForCompany(company.id, targetDate, userId);
    }

    console.log("\n========================================");
    console.log("✅ Backfill of EOD reports completed successfully!");
    console.log("========================================");
  } catch (error) {
    console.error("❌ Error backfilling EOD reports:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
