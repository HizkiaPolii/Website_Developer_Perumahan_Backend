import prisma from "./src/utils/database";

async function viewCoaAndBalances() {
  try {
    console.log("\n📊 ============ CHART OF ACCOUNTS ============\n");
    const coa = await prisma.chartOfAccounts.findMany({
      orderBy: {
        accountCode: 'asc'
      },
      select: {
        id: true,
        accountCode: true,
        accountName: true,
        accountType: true,
        level: true,
        isActive: true,
        description: true
      }
    });
    
    console.log(`Total Records: ${coa.length}\n`);
    coa.forEach(acc => {
      console.log(`${acc.accountCode} | ${acc.accountName} | Type: ${acc.accountType} | Level: ${acc.level}`);
    });

    console.log("\n\n📊 ============ ACCOUNT BALANCES ============\n");
    const balances = await prisma.accountBalance.findMany({
      orderBy: [
        { periodDate: 'desc' },
        { accountId: 'asc' }
      ],
      include: {
        account: {
          select: {
            accountCode: true,
            accountName: true
          }
        }
      }
    });
    
    console.log(`Total Records: ${balances.length}\n`);
    if (balances.length > 0) {
      balances.forEach(bal => {
        console.log(`${bal.account.accountCode} | ${bal.account.accountName}`);
        console.log(`  Period: ${bal.periodDate.toISOString().split('T')[0]} | Type: ${bal.periodType}`);
        console.log(`  Opening: ${bal.openingBalance} | Debit: ${bal.debitTotal} | Credit: ${bal.creditTotal} | Closing: ${bal.closingBalance}`);
        console.log('');
      });
    } else {
      console.log("No account balances found in database");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

viewCoaAndBalances();
