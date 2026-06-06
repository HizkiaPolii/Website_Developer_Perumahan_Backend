import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ChartOfAccountsData {
  accountCode: string;
  accountName: string;
  accountType: string;
  level: number;
  parentCode?: string;
  description?: string;
  isCashFlow?: boolean;
}

// Default Chart of Accounts template
const defaultChartOfAccounts: ChartOfAccountsData[] = [
  // ==================== ASET (ASSET) ====================
  {
    accountCode: "1.0.00",
    accountName: "ASET",
    accountType: "ASSET",
    level: 1,
    description: "Total Aset",
  },

  // ASET LANCAR (Current Assets)
  {
    accountCode: "1.1.00",
    accountName: "ASET LANCAR",
    accountType: "ASSET",
    level: 2,
    parentCode: "1.0.00",
    description: "Aset yang dapat dikonversi menjadi kas dalam jangka pendek",
  },
  {
    accountCode: "1.1.01",
    accountName: "Kas",
    accountType: "ASSET",
    level: 3,
    parentCode: "1.1.00",
    description: "Kas besar, Petty Cash",
    isCashFlow: true,
  },
  {
    accountCode: "1.1.02",
    accountName: "Bank",
    accountType: "ASSET",
    level: 3,
    parentCode: "1.1.00",
    description: "Bank BCA, Bank BRI, Bank USD, dll",
    isCashFlow: true,
  },
  {
    accountCode: "1.1.03",
    accountName: "Piutang",
    accountType: "ASSET",
    level: 3,
    parentCode: "1.1.00",
    description: "Piutang Usaha, Piutang Karyawan",
  },
  {
    accountCode: "1.1.05",
    accountName: "Persediaan",
    accountType: "ASSET",
    level: 3,
    parentCode: "1.1.00",
    description: "Inventory, Barang dagangan",
  },
  {
    accountCode: "1.1.06",
    accountName: "Pajak Dibayar Dimuka",
    accountType: "ASSET",
    level: 3,
    parentCode: "1.1.00",
    description: "PPN, PPh dibayar dimuka",
  },

  // ASET TIDAK LANCAR (Non-Current Assets)
  {
    accountCode: "1.2.00",
    accountName: "ASET TIDAK LANCAR",
    accountType: "ASSET",
    level: 2,
    parentCode: "1.0.00",
    description: "Aset jangka panjang",
  },
  {
    accountCode: "1.2.01",
    accountName: "Aset Tetap",
    accountType: "ASSET",
    level: 3,
    parentCode: "1.2.00",
    description: "Bangunan, Kendaraan, Peralatan",
  },
  {
    accountCode: "1.2.04",
    accountName: "Kitchen Machinery",
    accountType: "ASSET",
    level: 3,
    parentCode: "1.2.00",
    description: "Peralatan dapur",
  },

  // ==================== KEWAJIBAN (LIABILITY) ====================
  {
    accountCode: "2.0.00",
    accountName: "KEWAJIBAN",
    accountType: "LIABILITY",
    level: 1,
    description: "Total Kewajiban",
  },

  // KEWAJIBAN LANCAR (Current Liabilities)
  {
    accountCode: "2.1.00",
    accountName: "KEWAJIBAN LANCAR",
    accountType: "LIABILITY",
    level: 2,
    parentCode: "2.0.00",
    description: "Kewajiban jangka pendek",
  },
  {
    accountCode: "2.1.01",
    accountName: "Utang Usaha",
    accountType: "LIABILITY",
    level: 3,
    parentCode: "2.1.00",
    description: "Hutang kepada supplier/vendor",
  },
  {
    accountCode: "2.1.02",
    accountName: "Utang Pajak",
    accountType: "LIABILITY",
    level: 3,
    parentCode: "2.1.00",
    description: "PPN, PPh 21, PPh 23",
  },
  {
    accountCode: "2.1.03",
    accountName: "Biaya Terutang",
    accountType: "LIABILITY",
    level: 3,
    parentCode: "2.1.00",
    description: "Biaya yang masih harus dibayar",
  },
  {
    accountCode: "2.1.04",
    accountName: "Utang Lainnya",
    accountType: "LIABILITY",
    level: 3,
    parentCode: "2.1.00",
    description: "Utang lainnya",
  },

  // KEWAJIBAN TIDAK LANCAR (Non-Current Liabilities)
  {
    accountCode: "2.2.00",
    accountName: "KEWAJIBAN TIDAK LANCAR",
    accountType: "LIABILITY",
    level: 2,
    parentCode: "2.0.00",
    description: "Kewajiban jangka panjang",
  },
  {
    accountCode: "2.2.01",
    accountName: "Utang Bank",
    accountType: "LIABILITY",
    level: 3,
    parentCode: "2.2.00",
    description: "Pinjaman bank jangka panjang",
  },

  // ==================== EKUITAS (EQUITY) ====================
  {
    accountCode: "3.0.00",
    accountName: "EKUITAS",
    accountType: "EQUITY",
    level: 1,
    description: "Total Ekuitas",
  },
  {
    accountCode: "3.1.00",
    accountName: "EKUITAS PEMILIK",
    accountType: "EQUITY",
    level: 2,
    parentCode: "3.0.00",
    description: "Modal dan saldo laba",
  },
  {
    accountCode: "3.1.01",
    accountName: "Modal",
    accountType: "EQUITY",
    level: 3,
    parentCode: "3.1.00",
    description: "Modal awal dan tambahan",
  },
  {
    accountCode: "3.1.02",
    accountName: "Saldo Laba",
    accountType: "EQUITY",
    level: 3,
    parentCode: "3.1.00",
    description: "Laba ditahan dan tahun berjalan",
  },

  // ==================== PENDAPATAN (REVENUE) ====================
  {
    accountCode: "4.0.00",
    accountName: "PENDAPATAN",
    accountType: "REVENUE",
    level: 1,
    description: "Total Pendapatan",
  },
  {
    accountCode: "4.1.00",
    accountName: "Pendapatan Penjualan",
    accountType: "REVENUE",
    level: 2,
    parentCode: "4.0.00",
    description: "Pendapatan dari penjualan produk/jasa",
  },
  {
    accountCode: "4.1.01",
    accountName: "Penjualan Produk",
    accountType: "REVENUE",
    level: 3,
    parentCode: "4.1.00",
    description: "Pendapatan penjualan produk",
  },
  {
    accountCode: "4.1.02",
    accountName: "Penjualan Jasa",
    accountType: "REVENUE",
    level: 3,
    parentCode: "4.1.00",
    description: "Pendapatan penjualan jasa",
  },
  {
    accountCode: "4.2.00",
    accountName: "Pendapatan Lainnya",
    accountType: "REVENUE",
    level: 2,
    parentCode: "4.0.00",
    description: "Pendapatan di luar operasional utama",
  },
  {
    accountCode: "4.2.01",
    accountName: "Bunga Diterima",
    accountType: "REVENUE",
    level: 3,
    parentCode: "4.2.00",
    description: "Bunga dari tabungan/investasi",
  },

  // ==================== BIAYA (EXPENSE) ====================
  {
    accountCode: "5.0.00",
    accountName: "BIAYA",
    accountType: "EXPENSE",
    level: 1,
    description: "Total Biaya",
  },
  {
    accountCode: "5.1.00",
    accountName: "Biaya Operasional",
    accountType: "EXPENSE",
    level: 2,
    parentCode: "5.0.00",
    description: "Biaya operasional utama",
  },
  {
    accountCode: "5.1.01",
    accountName: "Gaji & Upah",
    accountType: "EXPENSE",
    level: 3,
    parentCode: "5.1.00",
    description: "Gaji karyawan, upah harian",
  },
  {
    accountCode: "5.1.02",
    accountName: "Biaya Sewa",
    accountType: "EXPENSE",
    level: 3,
    parentCode: "5.1.00",
    description: "Sewa ruang, gedung, tanah",
  },
  {
    accountCode: "5.1.03",
    accountName: "Biaya Utilitas",
    accountType: "EXPENSE",
    level: 3,
    parentCode: "5.1.00",
    description: "Listrik, air, gas, internet",
  },
  {
    accountCode: "5.1.04",
    accountName: "Biaya Marketing",
    accountType: "EXPENSE",
    level: 3,
    parentCode: "5.1.00",
    description: "Iklan, promosi, marketing",
  },
  {
    accountCode: "5.1.05",
    accountName: "Biaya Transportasi",
    accountType: "EXPENSE",
    level: 3,
    parentCode: "5.1.00",
    description: "Bahan bakar, maintenance kendaraan",
  },
  {
    accountCode: "5.1.06",
    accountName: "Biaya Asuransi",
    accountType: "EXPENSE",
    level: 3,
    parentCode: "5.1.00",
    description: "Asuransi kesehatan, property, dll",
  },
  {
    accountCode: "5.2.00",
    accountName: "Biaya Non-Operasional",
    accountType: "EXPENSE",
    level: 2,
    parentCode: "5.0.00",
    description: "Biaya di luar operasional utama",
  },
  {
    accountCode: "5.2.01",
    accountName: "Biaya Bunga",
    accountType: "EXPENSE",
    level: 3,
    parentCode: "5.2.00",
    description: "Bunga pinjaman bank",
  },
  {
    accountCode: "5.2.02",
    accountName: "Biaya Administrasi",
    accountType: "EXPENSE",
    level: 3,
    parentCode: "5.2.00",
    description: "Biaya administrasi bank, notaris",
  },
];

async function seedChartOfAccounts() {
  try {
    console.log("🌱 Starting to seed Chart of Accounts...");

    // Get or create default company
    let company = await prisma.company.findFirst();

    if (!company) {
      company = await prisma.company.create({
        data: {
          companyName: "PT. Default Company",
          companyCode: "DEFAULT",
          email: "company@example.com",
          isActive: true,
        },
      });
      console.log("✅ Created default company");
    }

    // Create a map to track created accounts for parent-child relationships
    const createdAccounts: { [key: string]: number } = {};

    // First pass: create all root and main accounts
    for (const account of defaultChartOfAccounts) {
      // Skip if account already exists
      const existing = await prisma.chartOfAccounts.findUnique({
        where: { accountCode: account.accountCode },
      });

      if (existing) {
        console.log(`⏭️  Account ${account.accountCode} already exists, skipping...`);
        createdAccounts[account.accountCode] = existing.id;
        continue;
      }

      const created = await prisma.chartOfAccounts.create({
        data: {
          companyId: company.id,
          accountCode: account.accountCode,
          accountName: account.accountName,
          accountType: account.accountType,
          level: account.level,
          parentId: account.parentCode ? createdAccounts[account.parentCode] : null,
          isCashFlow: account.isCashFlow || false,
          description: account.description,
          isActive: true,
        },
      });

      createdAccounts[account.accountCode] = created.id;
      console.log(`✅ Created account: ${account.accountCode} - ${account.accountName}`);
    }

    console.log(
      `✅ Chart of Accounts seeding completed! Total accounts: ${Object.keys(createdAccounts).length}`
    );
  } catch (error) {
    console.error("❌ Error seeding Chart of Accounts:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed
seedChartOfAccounts();
