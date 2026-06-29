import { PrismaClient } from "@prisma/client";

async function main() {
  const p = new PrismaClient();
  
  // Check all kas/bank accounts
  const accounts = await p.chartOfAccounts.findMany({
    where: { 
      OR: [
        { accountCode: { startsWith: "100.01" } },
        { accountName: { contains: "Kas", mode: "insensitive" } },
        { accountName: { contains: "Bank", mode: "insensitive" } },
      ]
    },
    select: { id: true, accountCode: true, accountName: true, isCashFlow: true, level: true },
    orderBy: { accountCode: "asc" }
  });
  
  console.log("Akun Kas & Bank saat ini:\n");
  accounts.forEach(a => {
    const flag = a.isCashFlow ? "✅ TRUE" : "❌ FALSE";
    console.log(`  ${a.accountCode.padEnd(15)} ${a.accountName.padEnd(20)} isCashFlow: ${flag}`);
  });

  // Fix: set isCashFlow=true for all Kas & Bank accounts
  console.log("\n🔧 Memperbaiki flag isCashFlow...\n");
  
  const kasBank = await p.chartOfAccounts.findMany({
    where: {
      OR: [
        { accountCode: { startsWith: "100.01.01" } }, // Kas
        { accountCode: { startsWith: "100.01.02" } }, // Bank
      ]
    }
  });

  for (const acc of kasBank) {
    if (!acc.isCashFlow) {
      await p.chartOfAccounts.update({
        where: { id: acc.id },
        data: { isCashFlow: true }
      });
      console.log(`  ✅ Fixed: ${acc.accountCode} ${acc.accountName} → isCashFlow: true`);
    } else {
      console.log(`  ⏭️  OK: ${acc.accountCode} ${acc.accountName} — sudah true`);
    }
  }

  console.log("\n🎉 Selesai! Refresh halaman Arus Kas di browser.");
  await p.$disconnect();
}

main();
