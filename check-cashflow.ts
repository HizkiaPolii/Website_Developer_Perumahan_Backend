import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const r = await p.chartOfAccounts.findMany({
    where: { accountCode: { startsWith: "100.01" } },
    select: { id: true, accountCode: true, accountName: true, isCashFlow: true }
  });
  console.log("Akun Kas & Bank:");
  console.log(JSON.stringify(r, null, 2));
  await p.$disconnect();
}
main();
