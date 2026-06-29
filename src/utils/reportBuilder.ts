import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'aset' | 'kewajiban' | 'modal' | 'pendapatan' | 'beban';
  parentId: string | null;
  isCash: boolean;
  isDrawing: boolean;
  isFixedAsset: boolean;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  status?: string;
}

export interface CashFlowItem {
  code: string;
  name: string;
  amount: number;
}

export interface CashFlowGroup {
  label: string;
  items: CashFlowItem[];
  total: number;
}

export interface CashFlowReport {
  operasional: CashFlowGroup[];
  totalOperasional: number;
  investasi: CashFlowGroup[];
  totalInvestasi: number;
  pendanaan: CashFlowGroup[];
  totalPendanaan: number;
  kasAwalPeriode: number;
  perubahanKasBersih: number;
  kasAkhirPeriode: number;
}

export interface ReportAccountNode {
  id: string;
  code: string;
  name: string;
  balance: number;
  children: ReportAccountNode[];
}

export interface IncomeStatement {
  pendapatan: ReportAccountNode[];
  totalPendapatan: number;
  beban: ReportAccountNode[];
  totalBeban: number;
  labaBersih: number;
}

export interface EquityChange {
  modalAwal: number;
  labaBersih: number;
  prive: number;
  ekuitasAkhir: number;
}

export interface BalanceSheet {
  aset: ReportAccountNode[];
  totalAset: number;
  kewajiban: ReportAccountNode[];
  totalKewajiban: number;
  ekuitasAkhir: number;
  totalPasiva: number;
  isBalanced: boolean;
  selisih: number;
}

export interface Reports {
  balances: Record<string, number>;
  cashFlowReport: CashFlowReport;
  incomeStatement: IncomeStatement;
  equityChange: EquityChange;
  balanceSheet: BalanceSheet;
}

const typeMap: Record<string, 'aset' | 'kewajiban' | 'modal' | 'pendapatan' | 'beban'> = {
  ASSET: "aset",
  LIABILITY: "kewajiban",
  EQUITY: "modal",
  REVENUE: "pendapatan",
  EXPENSE: "beban",
};

/**
 * Builds all 4 financial reports from database transactions and accounts as of a specific date.
 */
export async function buildFinancialReportsForDate(companyId: number, date: Date): Promise<Reports> {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // 1. Fetch active accounts
  const dbAccounts = await prisma.chartOfAccounts.findMany({
    where: {
      companyId,
      isActive: true,
    },
    orderBy: { accountCode: "asc" },
  });

  const accounts: Account[] = dbAccounts.map((acc) => ({
    id: acc.id.toString(),
    code: acc.accountCode,
    name: acc.accountName,
    type: typeMap[acc.accountType] || "aset",
    parentId: acc.parentId ? acc.parentId.toString() : null,
    isCash: acc.isCashFlow || false,
    isDrawing: acc.accountName.toLowerCase().includes("prive") || acc.accountCode.startsWith("3.1.02") || acc.accountCode.startsWith("3.1.01.02"),
    isFixedAsset: acc.accountCode.startsWith("1.2"),
  }));

  // 2. Fetch all approved/posted transactions up to target date
  const dbTransactions = await prisma.transaction.findMany({
    where: {
      companyId,
      status: { in: ["POSTED", "APPROVED"] },
      transactionDate: { lte: endOfDay },
    },
  });

  const transactions: Transaction[] = dbTransactions.map((trx) => ({
    id: trx.id.toString(),
    date: trx.transactionDate.toISOString().split("T")[0],
    description: trx.description,
    debitAccountId: trx.debitAccountId.toString(),
    creditAccountId: trx.creditAccountId.toString(),
    amount: parseFloat(trx.amount.toString()),
    status: trx.status,
  }));

  // 3. Compute leaf‑level balances
  const leafBalances: Record<string, number> = {};
  accounts.forEach(a => { leafBalances[a.id] = 0; });

  transactions.forEach(trx => {
    const dAcc = accounts.find(a => a.id === trx.debitAccountId);
    const cAcc = accounts.find(a => a.id === trx.creditAccountId);

    if (dAcc) {
      leafBalances[dAcc.id] += (['aset', 'beban'].includes(dAcc.type) ? 1 : -1) * trx.amount;
    }
    if (cAcc) {
      leafBalances[cAcc.id] += (['aset', 'beban'].includes(cAcc.type) ? -1 : 1) * trx.amount;
    }
  });

  // 4. Roll‑up balances
  const balances = { ...leafBalances };
  const parentIds = new Set(accounts.filter(a => a.parentId).map(a => a.parentId!));
  parentIds.forEach(pid => { balances[pid] = 0; });

  const sortedAccounts = [...accounts].sort((a, b) => b.code.length - a.code.length);
  sortedAccounts.forEach(acc => {
    if (acc.parentId && balances[acc.parentId] !== undefined) {
      balances[acc.parentId] += balances[acc.id];
    }
  });

  // 5. Cash Flow Report
  const cashIds = new Set(accounts.filter(a => a.isCash).map(a => a.id));
  const counterpartMap: Record<string, { code: string; name: string; type: typeof accounts[0]['type']; isCash: boolean; isFixedAsset: boolean; amount: number }> = {};

  transactions.forEach(trx => {
    const isDebitCash = cashIds.has(trx.debitAccountId);
    const isCreditCash = cashIds.has(trx.creditAccountId);

    if (isDebitCash && isCreditCash) return;

    if (isDebitCash && !isCreditCash) {
      const c = accounts.find(a => a.id === trx.creditAccountId);
      if (c) {
        if (!counterpartMap[c.id]) counterpartMap[c.id] = { code: c.code, name: c.name, type: c.type, isCash: c.isCash, isFixedAsset: c.isFixedAsset || false, amount: 0 };
        counterpartMap[c.id].amount += trx.amount;
      }
    } else if (!isDebitCash && isCreditCash) {
      const c = accounts.find(a => a.id === trx.debitAccountId);
      if (c) {
        if (!counterpartMap[c.id]) counterpartMap[c.id] = { code: c.code, name: c.name, type: c.type, isCash: c.isCash, isFixedAsset: c.isFixedAsset || false, amount: 0 };
        counterpartMap[c.id].amount -= trx.amount;
      }
    }
  });

  const opPenerimaan: CashFlowItem[] = [];
  const opPengeluaran: CashFlowItem[] = [];
  const invItems: CashFlowItem[] = [];
  const finItems: CashFlowItem[] = [];

  Object.values(counterpartMap).forEach(item => {
    const fi: CashFlowItem = { code: item.code, name: item.name, amount: item.amount };
    if (item.type === 'pendapatan') {
      opPenerimaan.push(fi);
    } else if (item.type === 'beban') {
      opPengeluaran.push(fi);
    } else if (item.type === 'aset' && !item.isCash && item.isFixedAsset) {
      invItems.push(fi);
    } else if (item.type === 'aset' && !item.isCash && !item.isFixedAsset) {
      opPengeluaran.push(fi);
    } else if (item.type === 'kewajiban' || item.type === 'modal') {
      finItems.push(fi);
    }
  });

  const sortByCode = (a: CashFlowItem, b: CashFlowItem) => a.code.localeCompare(b.code);
  opPenerimaan.sort(sortByCode);
  opPengeluaran.sort(sortByCode);
  invItems.sort(sortByCode);
  finItems.sort(sortByCode);

  const sumItems = (arr: CashFlowItem[]) => arr.reduce((s, i) => s + i.amount, 0);

  const operasionalGroups: CashFlowGroup[] = [];
  if (opPenerimaan.length > 0) {
    operasionalGroups.push({ label: 'Penerimaan Kas dari Pelanggan', items: opPenerimaan, total: sumItems(opPenerimaan) });
  }
  if (opPengeluaran.length > 0) {
    operasionalGroups.push({ label: 'Kas yang Dibayarkan untuk Beban Operasional', items: opPengeluaran, total: sumItems(opPengeluaran) });
  }

  const investasiGroups: CashFlowGroup[] = [];
  if (invItems.length > 0) {
    investasiGroups.push({ label: 'Kas dari Aktivitas Investasi', items: invItems, total: sumItems(invItems) });
  }

  const pendanaanGroups: CashFlowGroup[] = [];
  if (finItems.length > 0) {
    pendanaanGroups.push({ label: 'Kas dari Aktivitas Pendanaan', items: finItems, total: sumItems(finItems) });
  }

  const totalOperasional = operasionalGroups.reduce((s, g) => s + g.total, 0);
  const totalInvestasi = investasiGroups.reduce((s, g) => s + g.total, 0);
  const totalPendanaan = pendanaanGroups.reduce((s, g) => s + g.total, 0);
  const perubahanKasBersih = totalOperasional + totalInvestasi + totalPendanaan;
  const kasAwalPeriode = 0;
  const kasAkhirPeriode = kasAwalPeriode + perubahanKasBersih;

  const cashFlowReport: CashFlowReport = {
    operasional: operasionalGroups, totalOperasional,
    investasi: investasiGroups, totalInvestasi,
    pendanaan: pendanaanGroups, totalPendanaan,
    kasAwalPeriode, perubahanKasBersih, kasAkhirPeriode,
  };

  // 6. Report Nodes Builder
  const buildNodes = (type: typeof accounts[0]['type']): ReportAccountNode[] => {
    const ofType = accounts.filter(a => a.type === type);
    const build = (parentId: string | null): ReportAccountNode[] =>
      ofType
        .filter(a => a.parentId === parentId)
        .sort((a, b) => a.code.localeCompare(b.code))
        .map(a => ({ id: a.id, code: a.code, name: a.name, balance: balances[a.id] || 0, children: build(a.id) }));
    return build(null);
  };

  // 7. Income Statement
  const pendapatanNodes = buildNodes('pendapatan');
  const bebanNodes = buildNodes('beban');
  const totalPendapatan = pendapatanNodes.reduce((s, n) => s + n.balance, 0);
  const totalBeban = bebanNodes.reduce((s, n) => s + n.balance, 0);
  const labaBersih = totalPendapatan - totalBeban;

  const incomeStatement: IncomeStatement = {
    pendapatan: pendapatanNodes,
    totalPendapatan,
    beban: bebanNodes,
    totalBeban,
    labaBersih,
  };

  // 8. Equity Change
  const modalRoots = accounts.filter(a => a.type === 'modal' && !a.parentId && !a.isDrawing);
  const priveRoots = accounts.filter(a => a.type === 'modal' && !a.parentId && a.isDrawing);
  const modalAwal = modalRoots.reduce((s, a) => s + (balances[a.id] || 0), 0);
  const prive = Math.abs(priveRoots.reduce((s, a) => s + (balances[a.id] || 0), 0));
  const ekuitasAkhir = modalAwal + labaBersih - prive;

  const equityChange: EquityChange = { modalAwal, labaBersih, prive, ekuitasAkhir };

  // 9. Balance Sheet
  const asetNodes = buildNodes('aset');
  const kewajibanNodes = buildNodes('kewajiban');
  const totalAset = asetNodes.reduce((s, n) => s + n.balance, 0);
  const totalKewajiban = kewajibanNodes.reduce((s, n) => s + n.balance, 0);
  const totalPasiva = totalKewajiban + ekuitasAkhir;
  const selisih = Math.abs(totalAset - totalPasiva);

  const balanceSheet: BalanceSheet = {
    aset: asetNodes,
    totalAset,
    kewajiban: kewajibanNodes,
    totalKewajiban,
    ekuitasAkhir,
    totalPasiva,
    isBalanced: selisih < 1,
    selisih,
  };

  return { balances, cashFlowReport, incomeStatement, equityChange, balanceSheet };
}
