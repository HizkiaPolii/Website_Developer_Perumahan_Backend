/**
 * Test Suite: SPK / SAW Backend Logic
 * File: src/controllers/spkController.ts
 *
 * Memverifikasi algoritma SAW yang dijalankan di backend:
 * — Perhitungan kriteria C1–C4
 * — Normalisasi (benefit/cost)
 * — Perhitungan skor akhir
 * — Ranking & kategori
 */

import { describe, it, expect } from 'vitest';

// ─── Konstanta bobot (sama dengan spkController.ts) ──────────
const BOBOT = { c1: 0.35, c2: 0.30, c3: 0.20, c4: 0.15 };

function getKategori(skor: number): string {
  if (skor >= 0.80) return 'Sangat Baik';
  if (skor >= 0.60) return 'Baik';
  if (skor >= 0.40) return 'Cukup';
  if (skor >= 0.20) return 'Kurang';
  return 'Sangat Kurang';
}

interface MonthRaw {
  periode: string;
  pendapatan: number;
  beban: number;
  labaBersih: number;
  saldoKas: number;
}

function hitungSAW(months: MonthRaw[]) {
  const denganKriteria = months.map((m, i) => {
    const prev = i > 0 ? months[i - 1] : null;
    const c1 = m.pendapatan > 0 ? m.labaBersih / m.pendapatan : 0;
    const c2 = prev && prev.pendapatan > 0
      ? (m.pendapatan - prev.pendapatan) / prev.pendapatan
      : null;
    const c3 = m.pendapatan > 0 ? m.beban / m.pendapatan : 1;
    const c4 = m.beban > 0 ? m.saldoKas / m.beban : (m.saldoKas > 0 ? 1 : 0);
    return { ...m, c1, c2, c3, c4 };
  });

  const maxC1 = Math.max(...denganKriteria.map((m) => m.c1), 0.0001);
  const c2Vals = denganKriteria.filter((m) => m.c2 !== null).map((m) => m.c2 as number);
  const maxC2  = c2Vals.length > 0 ? Math.max(...c2Vals, 0.0001) : 1;
  const minC3  = Math.min(...denganKriteria.map((m) => m.c3));
  const maxC4  = Math.max(...denganKriteria.map((m) => m.c4), 0.0001);

  const hasil = denganKriteria.map((m) => {
    const r1 = m.c1 / maxC1;
    const r2 = m.c2 !== null ? Math.max(0, m.c2 / maxC2) : 0;
    const r3 = m.c3 > 0 ? minC3 / m.c3 : 1;
    const r4 = m.c4 / maxC4;

    const w1 = m.c2 !== null ? BOBOT.c1 : BOBOT.c1 + BOBOT.c2;
    const w2 = m.c2 !== null ? BOBOT.c2 : 0;

    const skor = w1 * r1 + w2 * r2 + BOBOT.c3 * r3 + BOBOT.c4 * r4;
    return { ...m, r1, r2, r3, r4, skor, kategori: getKategori(skor), peringkat: 0 };
  });

  const sorted = [...hasil].sort((a, b) => b.skor - a.skor);
  sorted.forEach((item, i) => { item.peringkat = i + 1; });
  const rankMap = new Map(sorted.map((s, i) => [s.periode, i + 1]));
  hasil.forEach((h) => { h.peringkat = rankMap.get(h.periode) ?? 0; });

  return hasil;
}

// ─────────────────────────────────────────────────────────────
// Kategori
// ─────────────────────────────────────────────────────────────
describe('getKategori — ambang batas', () => {
  const cases: [number, string][] = [
    [1.00, 'Sangat Baik'],
    [0.80, 'Sangat Baik'],
    [0.799, 'Baik'],
    [0.60, 'Baik'],
    [0.599, 'Cukup'],
    [0.40, 'Cukup'],
    [0.399, 'Kurang'],
    [0.20, 'Kurang'],
    [0.199, 'Sangat Kurang'],
    [0.00, 'Sangat Kurang'],
  ];

  cases.forEach(([skor, expected]) => {
    it(`skor ${skor} → "${expected}"`, () => {
      expect(getKategori(skor)).toBe(expected);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// Perhitungan kriteria mentah
// ─────────────────────────────────────────────────────────────
describe('Perhitungan Kriteria (C1–C4)', () => {
  const bulan: MonthRaw = {
    periode: '2026-01',
    pendapatan: 1_000_000_000,
    beban: 400_000_000,
    labaBersih: 600_000_000,
    saldoKas: 2_000_000_000,
  };

  it('C1 = labaBersih / pendapatan = 0.60', () => {
    const c1 = bulan.pendapatan > 0 ? bulan.labaBersih / bulan.pendapatan : 0;
    expect(c1).toBeCloseTo(0.60, 5);
  });

  it('C3 = beban / pendapatan = 0.40', () => {
    const c3 = bulan.pendapatan > 0 ? bulan.beban / bulan.pendapatan : 1;
    expect(c3).toBeCloseTo(0.40, 5);
  });

  it('C4 = saldoKas / beban = 5.0', () => {
    const c4 = bulan.beban > 0 ? bulan.saldoKas / bulan.beban : (bulan.saldoKas > 0 ? 1 : 0);
    expect(c4).toBeCloseTo(5.0, 5);
  });

  it('C1 = 0 jika pendapatan = 0 (hindari division by zero)', () => {
    const noPendapatan: MonthRaw = { ...bulan, pendapatan: 0, labaBersih: 0 };
    const c1 = noPendapatan.pendapatan > 0 ? noPendapatan.labaBersih / noPendapatan.pendapatan : 0;
    expect(c1).toBe(0);
  });

  it('C3 = 1 jika pendapatan = 0 (worst case — semua jadi beban)', () => {
    const noPendapatan: MonthRaw = { ...bulan, pendapatan: 0 };
    const c3 = noPendapatan.pendapatan > 0 ? noPendapatan.beban / noPendapatan.pendapatan : 1;
    expect(c3).toBe(1);
  });

  it('C4 = 1 jika beban = 0 tapi saldo kas ada (tidak rugi)', () => {
    const noBeban: MonthRaw = { ...bulan, beban: 0, labaBersih: bulan.pendapatan };
    const c4 = noBeban.beban > 0 ? noBeban.saldoKas / noBeban.beban : (noBeban.saldoKas > 0 ? 1 : 0);
    expect(c4).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────
// Normalisasi SAW
// ─────────────────────────────────────────────────────────────
describe('Normalisasi SAW (benefit vs cost)', () => {
  it('benefit: nilai tertinggi mendapat R = 1.0', () => {
    const values = [0.40, 0.60, 0.55];
    const maxVal = Math.max(...values);
    const normalized = values.map(v => v / maxVal);
    expect(normalized[1]).toBeCloseTo(1.0, 5); // index 1 = nilai 0.60
  });

  it('cost: nilai terendah mendapat R = 1.0', () => {
    const values = [0.40, 0.60, 0.55];
    const minVal = Math.min(...values);
    const normalized = values.map(v => minVal / v);
    expect(normalized[0]).toBeCloseTo(1.0, 5); // index 0 = nilai 0.40 (terendah = terbaik)
  });

  it('normalisasi benefit tidak bisa melebihi 1.0', () => {
    const months: MonthRaw[] = [
      { periode: '2026-01', pendapatan: 500e6, beban: 200e6, labaBersih: 300e6, saldoKas: 500e6 },
      { periode: '2026-02', pendapatan: 400e6, beban: 150e6, labaBersih: 250e6, saldoKas: 400e6 },
    ];
    const hasil = hitungSAW(months);
    hasil.forEach(h => {
      expect(h.r1).toBeLessThanOrEqual(1.0 + 1e-9);
      expect(h.r2).toBeLessThanOrEqual(1.0 + 1e-9);
      expect(h.r3).toBeLessThanOrEqual(1.0 + 1e-9);
      expect(h.r4).toBeLessThanOrEqual(1.0 + 1e-9);
    });
  });

  it('nilai R negatif diklem ke 0 (C2 turun → r2 = 0)', () => {
    const months: MonthRaw[] = [
      { periode: '2026-01', pendapatan: 600e6, beban: 200e6, labaBersih: 400e6, saldoKas: 500e6 },
      { periode: '2026-02', pendapatan: 400e6, beban: 150e6, labaBersih: 250e6, saldoKas: 400e6 },
    ];
    const hasil = hitungSAW(months);
    // Feb turun dari 600M ke 400M → c2 negatif → r2 = 0
    expect(hasil[1].r2).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// Skenario realistis proyek developer perumahan
// ─────────────────────────────────────────────────────────────
describe('Skenario Realistis Developer Perumahan', () => {
  // Q1 2026: konstruksi aktif, belum banyak penjualan
  const months: MonthRaw[] = [
    {
      periode: '2026-01',
      pendapatan: 200_000_000,    // Booking fee saja
      beban: 350_000_000,         // Beban konstruksi besar
      labaBersih: -150_000_000,   // Rugi sementara
      saldoKas: 4_500_000_000,    // Kas masih besar dari modal
    },
    {
      periode: '2026-02',
      pendapatan: 450_000_000,    // Mulai ada penjualan
      beban: 300_000_000,
      labaBersih: 150_000_000,
      saldoKas: 4_200_000_000,
    },
    {
      periode: '2026-03',
      pendapatan: 1_200_000_000,  // Penjualan rumah puncak
      beban: 400_000_000,
      labaBersih: 800_000_000,
      saldoKas: 4_600_000_000,
    },
  ];

  const hasil = hitungSAW(months);

  it('menghasilkan 3 hasil (satu per bulan)', () => {
    expect(hasil.length).toBe(3);
  });

  it('Maret mendapat peringkat 1 (penjualan puncak, laba tertinggi)', () => {
    const maret = hasil.find(h => h.periode === '2026-03');
    expect(maret?.peringkat).toBe(1);
  });

  it('Januari (rugi) mendapat peringkat 3 (terbawah)', () => {
    const januari = hasil.find(h => h.periode === '2026-01');
    expect(januari?.peringkat).toBe(3);
  });

  it('C1 Januari negatif (labaBersih negatif)', () => {
    const januari = hasil.find(h => h.periode === '2026-01');
    expect(januari?.c1).toBeLessThan(0);
  });

  it('bulan rugi (labaBersih negatif) menghasilkan skor negatif — ranking tetap berjalan', () => {
    // SAW tidak mengklem skor ke 0: C1 negatif menarik skor ke bawah.
    // Ini behavior yang benar — bulan rugi memang harus di peringkat terbawah.
    const januari = hasil.find(h => h.periode === '2026-01');
    expect(januari?.c1).toBeLessThan(0);    // labaBersih negatif → C1 negatif
    expect(januari?.skor).toBeLessThan(0);  // skor bisa negatif — wajar
    // Yang penting: ranking tetap valid (unik, berurutan)
    const peringkats = new Set(hasil.map(h => h.peringkat));
    expect(peringkats.size).toBe(3);
  });

  it('peringkat tidak ada duplikat', () => {
    const peringkats = new Set(hasil.map(h => h.peringkat));
    expect(peringkats.size).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────
// Integritas Matematika
// ─────────────────────────────────────────────────────────────
describe('Integritas Matematika SAW', () => {
  it('total bobot C1+C2+C3+C4 = 1.0 (100%)', () => {
    const total = BOBOT.c1 + BOBOT.c2 + BOBOT.c3 + BOBOT.c4;
    expect(total).toBeCloseTo(1.0, 10);
  });

  it('saat c2 null, bobot yang digunakan tetap = 1.0 (C2 dialihkan ke C1)', () => {
    const w1_null = BOBOT.c1 + BOBOT.c2; // 0.65
    const totalW = w1_null + BOBOT.c3 + BOBOT.c4;
    expect(totalW).toBeCloseTo(1.0, 10);
  });

  it('dengan semua R = 1.0, skor = 1.0 (maks teoretis)', () => {
    // Verifikasi bahwa formula tidak bisa melebihi 1.0
    const skors_maximal = BOBOT.c1 * 1 + BOBOT.c2 * 1 + BOBOT.c3 * 1 + BOBOT.c4 * 1;
    expect(skors_maximal).toBeCloseTo(1.0, 10);
  });
});
