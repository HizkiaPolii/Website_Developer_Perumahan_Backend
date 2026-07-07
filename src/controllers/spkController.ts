import { Request, Response } from "express";
import prisma from "../utils/database";

const BOBOT = {
  c1: 0.35, // Rasio Laba Bersih (Benefit)
  c2: 0.30, // Pertumbuhan Pendapatan (Benefit)
  c3: 0.20, // Rasio Efisiensi Beban (Cost)
  c4: 0.15, // Rasio Likuiditas Kas (Benefit)
};

const KRITERIA = [
  { kode: "C1", nama: "Rasio Laba Bersih", bobot: BOBOT.c1, jenis: "Benefit", rumus: "Laba Bersih / Pendapatan × 100%" },
  { kode: "C2", nama: "Pertumbuhan Pendapatan", bobot: BOBOT.c2, jenis: "Benefit", rumus: "(Pend. Bln Ini − Bln Lalu) / Bln Lalu × 100%" },
  { kode: "C3", nama: "Rasio Efisiensi Beban", bobot: BOBOT.c3, jenis: "Cost", rumus: "Total Beban / Pendapatan × 100%" },
  { kode: "C4", nama: "Rasio Likuiditas Kas", bobot: BOBOT.c4, jenis: "Benefit", rumus: "Saldo Kas / Total Beban" },
];

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function getKategori(skor: number): string {
  if (skor >= 0.80) return "Sangat Baik";
  if (skor >= 0.60) return "Baik";
  if (skor >= 0.40) return "Cukup";
  if (skor >= 0.20) return "Kurang";
  return "Sangat Kurang";
}

export const getAnalisisKinerja = async (req: Request, res: Response) => {
  try {
    const { companyId, startDate, endDate } = req.query;

    if (!companyId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Parameter companyId, startDate, dan endDate wajib diisi",
      });
    }

    const cid = parseInt(companyId as string);

    // Parse YYYY-MM-DD langsung sebagai local date (hindari UTC parsing issue)
    const [sy, sm] = (startDate as string).split("-").map(Number);
    const [ey, em] = (endDate as string).split("-").map(Number);

    const start = new Date(sy, sm - 1, 1, 0, 0, 0, 0);
    const end   = new Date(ey, em, 0, 23, 59, 59, 999);

    // Ambil akun kas
    const cashAccounts = await prisma.chartOfAccounts.findMany({
      where: { companyId: cid, isCashFlow: true, isActive: true },
      select: { id: true },
    });
    const cashIds = new Set(cashAccounts.map((a) => a.id));

    // Saldo kas kumulatif sebelum periode
    const prevTrx = await prisma.transaction.findMany({
      where: {
        companyId: cid,
        status: { in: ["POSTED", "APPROVED"] },
        transactionDate: { lt: start },
      },
      select: { debitAccountId: true, creditAccountId: true, amount: true },
    });

    let runningKas = prevTrx.reduce((sum, t) => {
      const a = parseFloat(t.amount.toString());
      let delta = 0;
      if (cashIds.has(t.debitAccountId))  delta += a;
      if (cashIds.has(t.creditAccountId)) delta -= a;
      return sum + delta;
    }, 0);

    // Semua transaksi dalam periode
    const trxInRange = await prisma.transaction.findMany({
      where: {
        companyId: cid,
        status: { in: ["POSTED", "APPROVED"] },
        transactionDate: { gte: start, lte: end },
      },
      select: {
        transactionDate: true,
        transactionType: true,
        debitAccountId: true,
        creditAccountId: true,
        amount: true,
      },
      orderBy: { transactionDate: "asc" },
    });

    // Generate daftar bulan dalam rentang
    const months: { year: number; month: number }[] = [];
    const cur = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cur <= end) {
      months.push({ year: cur.getFullYear(), month: cur.getMonth() + 1 });
      cur.setMonth(cur.getMonth() + 1);
    }

    // Agregasi data per bulan
    const monthlyRaw = months.map(({ year, month }) => {
      const monthTrx = trxInRange.filter((t) => {
        const d = new Date(t.transactionDate);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });

      let pendapatan = 0, beban = 0, kasIn = 0, kasOut = 0;
      monthTrx.forEach((t) => {
        const a = parseFloat(t.amount.toString());
        if (t.transactionType === "PENDAPATAN") pendapatan += a;
        if (t.transactionType === "PENGELUARAN") beban += a;
        if (cashIds.has(t.debitAccountId)) kasIn += a;
        if (cashIds.has(t.creditAccountId)) kasOut += a;
      });

      runningKas += kasIn - kasOut;

      return {
        periode: `${year}-${String(month).padStart(2, "0")}`,
        label: `${MONTH_NAMES[month - 1]} ${year}`,
        pendapatan,
        beban,
        labaBersih: pendapatan - beban,
        saldoKas: runningKas,
      };
    });

    // Hanya bulan yang ada transaksinya
    const aktif = monthlyRaw.filter((m) => m.pendapatan > 0 || m.beban > 0);

    if (aktif.length === 0) {
      return res.json({
        success: true,
        data: [],
        bobot: BOBOT,
        kriteria: KRITERIA,
        message: "Tidak ada transaksi pada periode yang dipilih",
      });
    }

    // Step 1 — Hitung nilai mentah setiap kriteria
    const denganKriteria = aktif.map((m, i) => {
      const prev = i > 0 ? aktif[i - 1] : null;
      const c1 = m.pendapatan > 0 ? m.labaBersih / m.pendapatan : 0;
      const c2 = prev && prev.pendapatan > 0
        ? (m.pendapatan - prev.pendapatan) / prev.pendapatan
        : null;
      const c3 = m.pendapatan > 0 ? m.beban / m.pendapatan : 1;
      const c4 = m.beban > 0 ? m.saldoKas / m.beban : (m.saldoKas > 0 ? 1 : 0);
      return { ...m, c1, c2, c3, c4 };
    });

    // Step 2 — Tentukan nilai max/min untuk normalisasi
    const maxC1 = Math.max(...denganKriteria.map((m) => m.c1), 0.0001);
    const c2Vals = denganKriteria.filter((m) => m.c2 !== null).map((m) => m.c2 as number);
    const maxC2 = c2Vals.length > 0 ? Math.max(...c2Vals, 0.0001) : 1;
    const minC3 = Math.min(...denganKriteria.map((m) => m.c3));
    const maxC4 = Math.max(...denganKriteria.map((m) => m.c4), 0.0001);

    // Step 3 — Normalisasi & hitung skor SAW
    const hasil = denganKriteria.map((m) => {
      // Normalisasi: benefit = nilai/max, cost = min/nilai
      const r1 = m.c1 / maxC1;
      const r2 = m.c2 !== null ? Math.max(0, m.c2 / maxC2) : 0;
      const r3 = m.c3 > 0 ? minC3 / m.c3 : 1;
      const r4 = m.c4 / maxC4;

      // Jika tidak ada bulan sebelumnya, bobot C2 dialihkan ke C1
      const w1 = m.c2 !== null ? BOBOT.c1 : BOBOT.c1 + BOBOT.c2;
      const w2 = m.c2 !== null ? BOBOT.c2 : 0;

      const skor = w1 * r1 + w2 * r2 + BOBOT.c3 * r3 + BOBOT.c4 * r4;

      return {
        periode: m.periode,
        label: m.label,
        pendapatan: m.pendapatan,
        beban: m.beban,
        labaBersih: m.labaBersih,
        saldoKas: m.saldoKas,
        c1: parseFloat((m.c1 * 100).toFixed(2)),
        c2: m.c2 !== null ? parseFloat((m.c2 * 100).toFixed(2)) : null,
        c3: parseFloat((m.c3 * 100).toFixed(2)),
        c4: parseFloat(m.c4.toFixed(4)),
        r1: parseFloat(r1.toFixed(4)),
        r2: parseFloat(r2.toFixed(4)),
        r3: parseFloat(r3.toFixed(4)),
        r4: parseFloat(r4.toFixed(4)),
        skor: parseFloat(skor.toFixed(4)),
        kategori: getKategori(skor),
        peringkat: 0,
      };
    });

    // Step 4 — Ranking berdasarkan skor tertinggi
    const sorted = [...hasil].sort((a, b) => b.skor - a.skor);
    sorted.forEach((item, i) => { item.peringkat = i + 1; });
    const rankMap = new Map(sorted.map((s) => [s.periode, s.peringkat]));
    hasil.forEach((h) => { h.peringkat = rankMap.get(h.periode) ?? 0; });

    return res.json({
      success: true,
      data: hasil,
      bobot: BOBOT,
      kriteria: KRITERIA,
    });
  } catch (error) {
    console.error("SPK Error:", error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};
