const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const startDateStr = "2026-06-23T16:00:00.000Z";
    const endDateStr = "2026-06-24T15:59:59.999Z";

    const filters = {
        reportType: "NERACA",
        status: "FINALIZED",
        periodEnd: {
            gte: new Date(startDateStr),
            lte: new Date(endDateStr)
        }
    };

    console.log("Filters:", filters);

    const reports = await prisma.financialReport.findMany({
        where: filters,
        select: {
            id: true,
            reportType: true,
            status: true,
            periodEnd: true,
        }
    });
    console.log("Result:", JSON.stringify(reports, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
