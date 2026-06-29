import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed transaksi dummy realistis untuk perusahaan perumahan.
 * 
 * Setiap transaksi:
 * 1. Dibuat dengan status POSTED
 * 2. Otomatis membuat JournalEntry + JournalEntryLines
 * 
 * Sehingga saldo akun langsung terlihat di laporan keuangan.
 */

interface DummyTransaction {
  date: string;          // YYYY-MM-DD
  description: string;
  type: string;          // PENDAPATAN, PENGELUARAN, TRANSFER
  debitCode: string;     // account code for debit
  creditCode: string;    // account code for credit
  amount: number;
}

// ==================== DATA TRANSAKSI DUMMY ====================
const dummyTransactions: DummyTransaction[] = [
  // ─── JANUARI 2026 ───────────────────────────────────────
  // Modal awal disetor
  { date: "2026-01-02", description: "Setoran modal awal pemilik", type: "TRANSFER", debitCode: "100.01.01.01", creditCode: "300.01.01.01", amount: 500000000 },
  // Penjualan unit rumah
  { date: "2026-01-10", description: "Penjualan unit rumah Blok A-01", type: "PENDAPATAN", debitCode: "100.01.02.01", creditCode: "400.01.01", amount: 350000000 },
  { date: "2026-01-15", description: "Penjualan unit rumah Blok A-02", type: "PENDAPATAN", debitCode: "100.01.01.01", creditCode: "400.01.01", amount: 275000000 },
  // Beban operasional
  { date: "2026-01-25", description: "Pembayaran gaji karyawan Januari", type: "PENGELUARAN", debitCode: "500.01.01", creditCode: "100.01.01.01", amount: 25000000 },
  { date: "2026-01-28", description: "Pembayaran listrik & air kantor Januari", type: "PENGELUARAN", debitCode: "500.01.02", creditCode: "100.01.01.01", amount: 3500000 },
  { date: "2026-01-30", description: "Pembelian ATK & perlengkapan kantor", type: "PENGELUARAN", debitCode: "500.01.04", creditCode: "100.01.01.02", amount: 1200000 },

  // ─── FEBRUARI 2026 ──────────────────────────────────────
  { date: "2026-02-05", description: "Pendapatan jasa pengelolaan lingkungan", type: "PENDAPATAN", debitCode: "100.01.01.01", creditCode: "400.01.02", amount: 15000000 },
  { date: "2026-02-12", description: "Penjualan unit rumah Blok B-01", type: "PENDAPATAN", debitCode: "100.01.02.01", creditCode: "400.01.01", amount: 320000000 },
  { date: "2026-02-20", description: "Pembayaran sewa alat berat", type: "PENGELUARAN", debitCode: "500.01.03", creditCode: "100.01.01.01", amount: 8000000 },
  { date: "2026-02-25", description: "Pembayaran gaji karyawan Februari", type: "PENGELUARAN", debitCode: "500.01.01", creditCode: "100.01.01.01", amount: 25000000 },
  { date: "2026-02-26", description: "Pembayaran listrik & air Februari", type: "PENGELUARAN", debitCode: "500.01.02", creditCode: "100.01.01.01", amount: 3800000 },
  { date: "2026-02-27", description: "Biaya transportasi operasional", type: "PENGELUARAN", debitCode: "500.01.05", creditCode: "100.01.01.02", amount: 2500000 },
  { date: "2026-02-28", description: "Biaya admin bank BCA Februari", type: "PENGELUARAN", debitCode: "500.02.01", creditCode: "100.01.02.01", amount: 150000 },
  { date: "2026-02-28", description: "Pendapatan bunga bank BCA", type: "PENDAPATAN", debitCode: "100.01.02.01", creditCode: "400.02.01", amount: 850000 },

  // ─── MARET 2026 ─────────────────────────────────────────
  { date: "2026-03-03", description: "Penjualan unit rumah Blok B-02", type: "PENDAPATAN", debitCode: "100.01.01.01", creditCode: "400.01.01", amount: 290000000 },
  { date: "2026-03-08", description: "Penjualan unit rumah Blok C-01 (DP)", type: "PENDAPATAN", debitCode: "100.01.02.01", creditCode: "400.01.01", amount: 150000000 },
  { date: "2026-03-15", description: "Pembayaran telepon & internet Maret", type: "PENGELUARAN", debitCode: "500.01.06", creditCode: "100.01.01.01", amount: 1800000 },
  { date: "2026-03-20", description: "Pembelian perlengkapan proyek", type: "PENGELUARAN", debitCode: "500.01.04", creditCode: "100.01.01.01", amount: 4500000 },
  { date: "2026-03-25", description: "Pembayaran gaji karyawan Maret", type: "PENGELUARAN", debitCode: "500.01.01", creditCode: "100.01.01.01", amount: 27000000 },
  { date: "2026-03-28", description: "Pembayaran listrik & air Maret", type: "PENGELUARAN", debitCode: "500.01.02", creditCode: "100.01.01.01", amount: 4200000 },
  { date: "2026-03-30", description: "Pembayaran PBB kantor & lahan", type: "PENGELUARAN", debitCode: "500.02.02", creditCode: "100.01.01.01", amount: 5000000 },
  { date: "2026-03-31", description: "Biaya admin bank BCA Maret", type: "PENGELUARAN", debitCode: "500.02.01", creditCode: "100.01.02.01", amount: 150000 },
  { date: "2026-03-31", description: "Pendapatan bunga bank BCA Maret", type: "PENDAPATAN", debitCode: "100.01.02.01", creditCode: "400.02.01", amount: 920000 },

  // ─── APRIL 2026 ─────────────────────────────────────────
  { date: "2026-04-05", description: "Penjualan unit rumah Blok C-02", type: "PENDAPATAN", debitCode: "100.01.02.01", creditCode: "400.01.01", amount: 310000000 },
  { date: "2026-04-10", description: "Pendapatan jasa administrasi", type: "PENDAPATAN", debitCode: "100.01.01.01", creditCode: "400.01.02", amount: 8000000 },
  { date: "2026-04-15", description: "Transfer kas ke bank BCA", type: "TRANSFER", debitCode: "100.01.02.01", creditCode: "100.01.01.01", amount: 200000000 },
  { date: "2026-04-20", description: "Biaya transportasi survey lokasi", type: "PENGELUARAN", debitCode: "500.01.05", creditCode: "100.01.01.02", amount: 3000000 },
  { date: "2026-04-25", description: "Pembayaran gaji karyawan April", type: "PENGELUARAN", debitCode: "500.01.01", creditCode: "100.01.01.01", amount: 27000000 },
  { date: "2026-04-28", description: "Pembayaran listrik & air April", type: "PENGELUARAN", debitCode: "500.01.02", creditCode: "100.01.01.01", amount: 3900000 },
  { date: "2026-04-30", description: "Beban penyusutan aset April", type: "PENGELUARAN", debitCode: "500.03.01", creditCode: "100.01.01.01", amount: 2000000 },
  { date: "2026-04-30", description: "Pendapatan bunga bank April", type: "PENDAPATAN", debitCode: "100.01.02.01", creditCode: "400.02.01", amount: 1100000 },

  // ─── MEI 2026 ───────────────────────────────────────────
  { date: "2026-05-07", description: "Penjualan unit rumah Blok D-01", type: "PENDAPATAN", debitCode: "100.01.01.01", creditCode: "400.01.01", amount: 285000000 },
  { date: "2026-05-12", description: "Pelunasan unit Blok C-01", type: "PENDAPATAN", debitCode: "100.01.02.01", creditCode: "400.01.01", amount: 180000000 },
  { date: "2026-05-18", description: "Pembelian perlengkapan kebersihan lingkungan", type: "PENGELUARAN", debitCode: "500.01.04", creditCode: "100.01.01.01", amount: 2800000 },
  { date: "2026-05-20", description: "Biaya telepon & internet Mei", type: "PENGELUARAN", debitCode: "500.01.06", creditCode: "100.01.01.01", amount: 1900000 },
  { date: "2026-05-25", description: "Pembayaran gaji karyawan Mei", type: "PENGELUARAN", debitCode: "500.01.01", creditCode: "100.01.01.01", amount: 28000000 },
  { date: "2026-05-28", description: "Pembayaran listrik & air Mei", type: "PENGELUARAN", debitCode: "500.01.02", creditCode: "100.01.01.01", amount: 4100000 },
  { date: "2026-05-31", description: "Biaya admin bank BCA Mei", type: "PENGELUARAN", debitCode: "500.02.01", creditCode: "100.01.02.01", amount: 150000 },
  { date: "2026-05-31", description: "Pendapatan bunga bank Mei", type: "PENDAPATAN", debitCode: "100.01.02.01", creditCode: "400.02.01", amount: 1250000 },
  { date: "2026-05-31", description: "Pendapatan lainnya - denda keterlambatan", type: "PENDAPATAN", debitCode: "100.01.01.01", creditCode: "400.02.02", amount: 2500000 },

  // ─── JUNI 2026 ──────────────────────────────────────────
  { date: "2026-06-02", description: "Penjualan unit rumah Blok D-02", type: "PENDAPATAN", debitCode: "100.01.02.01", creditCode: "400.01.01", amount: 295000000 },
  { date: "2026-06-08", description: "Pendapatan jasa pengelolaan Juni", type: "PENDAPATAN", debitCode: "100.01.01.01", creditCode: "400.01.02", amount: 12000000 },
  { date: "2026-06-10", description: "Biaya sewa kantor pemasaran", type: "PENGELUARAN", debitCode: "500.01.03", creditCode: "100.01.01.01", amount: 5000000 },
  { date: "2026-06-12", description: "Biaya transportasi marketing", type: "PENGELUARAN", debitCode: "500.01.05", creditCode: "100.01.01.02", amount: 1800000 },
  { date: "2026-06-14", description: "Pembayaran pajak daerah", type: "PENGELUARAN", debitCode: "500.02.02", creditCode: "100.01.01.01", amount: 3500000 },
];

async function seedDummyTransactions() {
  try {
    console.log("🌱 Membuat transaksi dummy...\n");

    const company = await prisma.company.findFirst();
    if (!company) throw new Error("Company tidak ditemukan!");

    // Get first user as the transaction creator
    const user = await prisma.user.findFirst({ where: { isActive: true } });
    if (!user) throw new Error("User tidak ditemukan! Buat user dulu.");

    // Get manager for approver
    const manager = await prisma.user.findFirst({ 
      where: { role: { in: ["manager", "Manager"] }, isActive: true } 
    });
    const approverId = manager?.id || user.id;

    console.log(`📦 Company: ${company.companyName}`);
    console.log(`👤 User: ${user.name} (ID: ${user.id})`);
    console.log(`✅ Approver: ${manager?.name || user.name} (ID: ${approverId})\n`);

    // Load all accounts into a map: code -> id
    const accounts = await prisma.chartOfAccounts.findMany({
      where: { companyId: company.id },
      select: { id: true, accountCode: true, accountName: true }
    });
    const accountMap: Record<string, number> = {};
    for (const acc of accounts) {
      accountMap[acc.accountCode] = acc.id;
    }

    console.log(`📋 ${accounts.length} akun dimuat dari database.\n`);

    let created = 0;
    let errors = 0;

    for (const trx of dummyTransactions) {
      const debitAccountId = accountMap[trx.debitCode];
      const creditAccountId = accountMap[trx.creditCode];

      if (!debitAccountId) {
        console.error(`  ❌ Akun debit "${trx.debitCode}" tidak ditemukan — skip: ${trx.description}`);
        errors++;
        continue;
      }
      if (!creditAccountId) {
        console.error(`  ❌ Akun kredit "${trx.creditCode}" tidak ditemukan — skip: ${trx.description}`);
        errors++;
        continue;
      }

      // Generate unique codes
      const seq = String(created + 1).padStart(4, "0");
      const dateStr = trx.date.replace(/-/g, "");
      const typeCode = trx.type.substring(0, 3).toUpperCase();
      const transactionCode = `${typeCode}/${dateStr}/${seq}`;
      const journalNo = `JE/${company.id}/${dateStr}${seq}`;

      // Create transaction + journal in a single DB transaction
      await prisma.$transaction(async (tx) => {
        // 1. Create transaction (already POSTED)
        const transaction = await tx.transaction.create({
          data: {
            companyId: company.id,
            userId: user.id,
            transactionCode,
            transactionDate: new Date(trx.date),
            transactionType: trx.type,
            description: trx.description,
            debitAccountId,
            creditAccountId,
            amount: trx.amount,
            status: "POSTED",
            approvedBy: approverId,
            approvedAt: new Date(trx.date),
          },
        });

        // 2. Create journal entry with lines
        await tx.journalEntry.create({
          data: {
            companyId: company.id,
            userId: user.id,
            transactionId: transaction.id,
            journalDate: new Date(trx.date),
            journalNo,
            description: trx.description,
            isPosted: true,
            postedAt: new Date(trx.date),
            approvedBy: approverId,
            approvedAt: new Date(trx.date),
            lines: {
              createMany: {
                data: [
                  { accountId: debitAccountId, debit: trx.amount, credit: 0, description: trx.description },
                  { accountId: creditAccountId, debit: 0, credit: trx.amount, description: trx.description },
                ],
              },
            },
          },
        });
      });

      const amountStr = new Intl.NumberFormat("id-ID").format(trx.amount);
      console.log(`  ✅ ${trx.date} | Rp ${amountStr.padStart(15)} | ${trx.description}`);
      created++;
    }

    console.log(`\n${"═".repeat(70)}`);
    console.log(`🎉 Selesai! ${created} transaksi berhasil dibuat.`);
    if (errors > 0) console.log(`⚠️  ${errors} transaksi gagal (akun tidak ditemukan).`);
    
    // Print summary
    console.log(`\n📊 Ringkasan data yang dibuat:`);
    console.log(`   • ${created} Transaksi (status: POSTED)`);
    console.log(`   • ${created} Journal Entry`);
    console.log(`   • ${created * 2} Journal Entry Lines (debit + kredit)`);
    console.log(`   • Periode: Januari - Juni 2026`);
    console.log(`\n💡 Refresh halaman di browser untuk melihat saldo di Dashboard & Laporan!`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDummyTransactions();
