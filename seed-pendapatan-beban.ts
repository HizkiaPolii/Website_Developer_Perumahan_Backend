import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Script untuk menambahkan sub-akun Pendapatan dan Beban
 * TANPA mengubah data yang sudah ada.
 * 
 * Akan skip akun yang sudah ada (berdasarkan accountCode).
 */
async function seedPendapatanBeban() {
  try {
    console.log("🌱 Menambahkan akun Pendapatan & Beban...\n");

    // Get company
    const company = await prisma.company.findFirst();
    if (!company) {
      throw new Error("Company belum ada! Jalankan seed utama terlebih dahulu.");
    }
    console.log(`📦 Company: ${company.companyName} (ID: ${company.id})\n`);

    // Cari parent PENDAPATAN dan BEBAN yang sudah ada
    const pendapatanParent = await prisma.chartOfAccounts.findFirst({
      where: { companyId: company.id, accountType: "REVENUE", level: 1 }
    });
    const bebanParent = await prisma.chartOfAccounts.findFirst({
      where: { companyId: company.id, accountType: "EXPENSE", level: 1 }
    });

    if (!pendapatanParent) {
      console.error("❌ Akun parent PENDAPATAN tidak ditemukan!");
      return;
    }
    if (!bebanParent) {
      console.error("❌ Akun parent BEBAN tidak ditemukan!");
      return;
    }

    console.log(`✅ Parent PENDAPATAN: ${pendapatanParent.accountCode} - ${pendapatanParent.accountName} (ID: ${pendapatanParent.id})`);
    console.log(`✅ Parent BEBAN: ${bebanParent.accountCode} - ${bebanParent.accountName} (ID: ${bebanParent.id})\n`);

    // Detect code format from existing parent codes
    const pCode = pendapatanParent.accountCode; // e.g., "400" or "4.0.00"
    const bCode = bebanParent.accountCode; // e.g., "500" or "5.0.00"

    // Determine format: "400" style or "4.0.00" style
    const isShortFormat = !pCode.includes(".");
    console.log(`📋 Format kode terdeteksi: ${isShortFormat ? "Short (400, 400.01, ...)" : "Dot (4.0.00, 4.1.00, ...)"}\n`);

    // Map to track created accounts by code -> ID
    const accountMap: Record<string, number> = {};
    accountMap[pCode] = pendapatanParent.id;
    accountMap[bCode] = bebanParent.id;

    // Also map existing sub-accounts
    const existingAccounts = await prisma.chartOfAccounts.findMany({
      where: { companyId: company.id },
      select: { id: true, accountCode: true }
    });
    for (const acc of existingAccounts) {
      accountMap[acc.accountCode] = acc.id;
    }

    // Define accounts to add
    interface AccountDef {
      code: string;
      name: string;
      type: "REVENUE" | "EXPENSE";
      level: number;
      parentCode: string;
      description: string;
      isCashFlow?: boolean;
    }

    let accountsToAdd: AccountDef[];

    if (isShortFormat) {
      // Format: 400, 400.01, 400.01.01, 400.01.01.01
      accountsToAdd = [
        // ==================== PENDAPATAN (REVENUE) ====================
        // Level 2
        { code: "400.01", name: "PENDAPATAN USAHA", type: "REVENUE", level: 2, parentCode: pCode, description: "Pendapatan dari kegiatan usaha utama" },
        { code: "400.02", name: "PENDAPATAN LAIN-LAIN", type: "REVENUE", level: 2, parentCode: pCode, description: "Pendapatan di luar usaha utama" },
        // Level 3 - Pendapatan Usaha
        { code: "400.01.01", name: "Pendapatan Penjualan", type: "REVENUE", level: 3, parentCode: "400.01", description: "Pendapatan dari penjualan unit rumah/kavling" },
        { code: "400.01.02", name: "Pendapatan Jasa", type: "REVENUE", level: 3, parentCode: "400.01", description: "Pendapatan jasa pengelolaan & administrasi" },
        // Level 3 - Pendapatan Lain-lain
        { code: "400.02.01", name: "Pendapatan Bunga", type: "REVENUE", level: 3, parentCode: "400.02", description: "Bunga bank/deposito" },
        { code: "400.02.02", name: "Pendapatan Lainnya", type: "REVENUE", level: 3, parentCode: "400.02", description: "Pendapatan di luar operasional" },

        // ==================== BEBAN (EXPENSE) ====================
        // Level 2
        { code: "500.01", name: "BEBAN OPERASIONAL", type: "EXPENSE", level: 2, parentCode: bCode, description: "Beban dari kegiatan operasional" },
        { code: "500.02", name: "BEBAN ADMINISTRASI", type: "EXPENSE", level: 2, parentCode: bCode, description: "Beban administrasi & umum" },
        { code: "500.03", name: "BEBAN LAIN-LAIN", type: "EXPENSE", level: 2, parentCode: bCode, description: "Beban di luar operasional" },
        // Level 3 - Beban Operasional
        { code: "500.01.01", name: "Beban Gaji & Upah", type: "EXPENSE", level: 3, parentCode: "500.01", description: "Gaji karyawan tetap & harian" },
        { code: "500.01.02", name: "Beban Listrik & Air", type: "EXPENSE", level: 3, parentCode: "500.01", description: "Tagihan listrik & PDAM" },
        { code: "500.01.03", name: "Beban Sewa", type: "EXPENSE", level: 3, parentCode: "500.01", description: "Sewa kantor/lahan" },
        { code: "500.01.04", name: "Beban Perlengkapan", type: "EXPENSE", level: 3, parentCode: "500.01", description: "ATK, perlengkapan kantor" },
        { code: "500.01.05", name: "Beban Transportasi", type: "EXPENSE", level: 3, parentCode: "500.01", description: "BBM, transport operasional" },
        { code: "500.01.06", name: "Beban Telepon & Internet", type: "EXPENSE", level: 3, parentCode: "500.01", description: "Pulsa, internet kantor" },
        // Level 3 - Beban Administrasi
        { code: "500.02.01", name: "Beban Administrasi Bank", type: "EXPENSE", level: 3, parentCode: "500.02", description: "Biaya admin rekening bank" },
        { code: "500.02.02", name: "Beban Pajak", type: "EXPENSE", level: 3, parentCode: "500.02", description: "PBB, pajak daerah, dll" },
        // Level 3 - Beban Lain-lain
        { code: "500.03.01", name: "Beban Penyusutan", type: "EXPENSE", level: 3, parentCode: "500.03", description: "Penyusutan aset tetap" },
        { code: "500.03.02", name: "Beban Lainnya", type: "EXPENSE", level: 3, parentCode: "500.03", description: "Beban tak terduga/lainnya" },
      ];
    } else {
      // Format: 4.0.00, 4.1.00, 4.1.01
      accountsToAdd = [
        // ==================== PENDAPATAN (REVENUE) ====================
        { code: "4.1.00", name: "PENDAPATAN USAHA", type: "REVENUE", level: 2, parentCode: pCode, description: "Pendapatan dari kegiatan usaha utama" },
        { code: "4.2.00", name: "PENDAPATAN LAIN-LAIN", type: "REVENUE", level: 2, parentCode: pCode, description: "Pendapatan di luar usaha utama" },
        { code: "4.1.01", name: "Pendapatan Penjualan", type: "REVENUE", level: 3, parentCode: "4.1.00", description: "Pendapatan dari penjualan unit rumah/kavling" },
        { code: "4.1.02", name: "Pendapatan Jasa", type: "REVENUE", level: 3, parentCode: "4.1.00", description: "Pendapatan jasa pengelolaan & administrasi" },
        { code: "4.2.01", name: "Pendapatan Bunga", type: "REVENUE", level: 3, parentCode: "4.2.00", description: "Bunga bank/deposito" },
        { code: "4.2.02", name: "Pendapatan Lainnya", type: "REVENUE", level: 3, parentCode: "4.2.00", description: "Pendapatan di luar operasional" },

        // ==================== BEBAN (EXPENSE) ====================
        { code: "5.1.00", name: "BEBAN OPERASIONAL", type: "EXPENSE", level: 2, parentCode: bCode, description: "Beban dari kegiatan operasional" },
        { code: "5.2.00", name: "BEBAN ADMINISTRASI", type: "EXPENSE", level: 2, parentCode: bCode, description: "Beban administrasi & umum" },
        { code: "5.3.00", name: "BEBAN LAIN-LAIN", type: "EXPENSE", level: 2, parentCode: bCode, description: "Beban di luar operasional" },
        { code: "5.1.01", name: "Beban Gaji & Upah", type: "EXPENSE", level: 3, parentCode: "5.1.00", description: "Gaji karyawan tetap & harian" },
        { code: "5.1.02", name: "Beban Listrik & Air", type: "EXPENSE", level: 3, parentCode: "5.1.00", description: "Tagihan listrik & PDAM" },
        { code: "5.1.03", name: "Beban Sewa", type: "EXPENSE", level: 3, parentCode: "5.1.00", description: "Sewa kantor/lahan" },
        { code: "5.1.04", name: "Beban Perlengkapan", type: "EXPENSE", level: 3, parentCode: "5.1.00", description: "ATK, perlengkapan kantor" },
        { code: "5.1.05", name: "Beban Transportasi", type: "EXPENSE", level: 3, parentCode: "5.1.00", description: "BBM, transport operasional" },
        { code: "5.1.06", name: "Beban Telepon & Internet", type: "EXPENSE", level: 3, parentCode: "5.1.00", description: "Pulsa, internet kantor" },
        { code: "5.2.01", name: "Beban Administrasi Bank", type: "EXPENSE", level: 3, parentCode: "5.2.00", description: "Biaya admin rekening bank" },
        { code: "5.2.02", name: "Beban Pajak", type: "EXPENSE", level: 3, parentCode: "5.2.00", description: "PBB, pajak daerah, dll" },
        { code: "5.3.01", name: "Beban Penyusutan", type: "EXPENSE", level: 3, parentCode: "5.3.00", description: "Penyusutan aset tetap" },
        { code: "5.3.02", name: "Beban Lainnya", type: "EXPENSE", level: 3, parentCode: "5.3.00", description: "Beban tak terduga/lainnya" },
      ];
    }

    // Sort by level so parents are created first
    accountsToAdd.sort((a, b) => a.level - b.level);

    let created = 0;
    let skipped = 0;

    for (const acc of accountsToAdd) {
      // Check if already exists
      const existing = await prisma.chartOfAccounts.findFirst({
        where: { companyId: company.id, accountCode: acc.code }
      });

      if (existing) {
        console.log(`  ⏭️  ${acc.code} ${acc.name} — sudah ada, skip`);
        accountMap[acc.code] = existing.id;
        skipped++;
        continue;
      }

      // Get parent ID
      const parentId = accountMap[acc.parentCode];
      if (!parentId) {
        console.error(`  ❌ Parent ${acc.parentCode} tidak ditemukan untuk ${acc.code}!`);
        continue;
      }

      const newAccount = await prisma.chartOfAccounts.create({
        data: {
          companyId: company.id,
          accountCode: acc.code,
          accountName: acc.name,
          accountType: acc.type,
          level: acc.level,
          parentId: parentId,
          isCashFlow: acc.isCashFlow || false,
          description: acc.description,
          isActive: true,
        },
      });

      accountMap[acc.code] = newAccount.id;
      console.log(`  ✅ ${acc.code} ${acc.name}`);
      created++;
    }

    console.log(`\n🎉 Selesai! ${created} akun baru ditambahkan, ${skipped} akun di-skip (sudah ada).`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPendapatanBeban();
