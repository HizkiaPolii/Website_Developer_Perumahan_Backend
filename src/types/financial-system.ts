/**
 * Sistem Pengelolaan Keuangan - TypeScript Types & Interfaces
 * Frontend Integration - v1.0.0
 *
 * Gunakan file ini di project frontend untuk type safety
 * Place this in: src/types/financial-system.ts
 */

// ==================== AUTH TYPES ====================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
}

export interface CurrentUser {
  id: number;
  email: string;
  name: string;
  role: string;
  companyId?: number;
}

// ==================== COMPANY ====================

export interface Company {
  id: number;
  companyName: string;
  companyCode: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  fiscalYearStart: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== USER ====================

export type UserRole = 'Admin' | 'Manager' | 'Owner' | 'Teller' | 'Staf';

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  department?: string;
  isActive: boolean;
  companyId?: number;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== CHART OF ACCOUNTS ====================

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type AccountLevel = 1 | 2 | 3;

export interface ChartOfAccount {
  id: number;
  companyId: number;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  parentId?: number;
  level: AccountLevel;
  isActive: boolean;
  isCashFlow: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;

  // Relations (when included in response)
  parent?: ChartOfAccount;
  children?: ChartOfAccount[];
}

export interface AccountHierarchyNode extends ChartOfAccount {
  children: AccountHierarchyNode[];
}

export interface CreateAccountInput {
  companyId: number;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  level: AccountLevel;
  parentId?: number;
  description?: string;
  isCashFlow?: boolean;
}

export interface UpdateAccountInput {
  accountName?: string;
  description?: string;
  isCashFlow?: boolean;
  isActive?: boolean;
}

// ==================== TRANSACTIONS ====================

export type TransactionType = 'PENDAPATAN' | 'PENGELUARAN' | 'TRANSFER' | 'ADJUSTMENT';
export type TransactionStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'POSTED';

export interface Transaction {
  id: number;
  companyId: number;
  userId: number;
  transactionCode: string;
  transactionDate: string;  // ISO date string
  transactionType: TransactionType;
  description: string;
  category?: string;
  referenceNo?: string;
  debitAccountId: number;
  creditAccountId: number;
  amount: number;
  status: TransactionStatus;
  approvedBy?: number;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;

  // Relations (when included in response)
  user?: User;
  debitAccount?: ChartOfAccount;
  creditAccount?: ChartOfAccount;
  approver?: User;
  journalEntry?: JournalEntry;
}

export interface CreateTransactionInput {
  companyId: number;
  userId: number;
  transactionDate: string;
  transactionType: TransactionType;
  description: string;
  category?: string;
  referenceNo?: string;
  debitAccountId: number;
  creditAccountId: number;
  amount: number;
}

export interface UpdateTransactionInput {
  transactionDate?: string;
  description?: string;
  category?: string;
  referenceNo?: string;
  debitAccountId?: number;
  creditAccountId?: number;
  amount?: number;
}

export interface TransactionQueryParams {
  companyId: number;
  status?: TransactionStatus;
  type?: TransactionType;
  category?: string;
  from?: string;  // ISO date
  to?: string;    // ISO date
  page?: number;
  limit?: number;
}

export interface TransactionWorkflowInput {
  approvedBy?: number;
  rejectionReason?: string;
}

// ==================== JOURNAL ENTRIES ====================

export interface JournalEntryLine {
  id: number;
  journalEntryId: number;
  accountId: number;
  debit: number;
  credit: number;
  description?: string;

  // Relations
  account?: ChartOfAccount;
}

export interface JournalEntry {
  id: number;
  companyId: number;
  userId: number;
  transactionId?: number;
  journalDate: string;
  journalNo: string;
  description: string;
  isPosted: boolean;
  postedAt?: string;
  approvedBy?: number;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  user?: User;
  transaction?: Transaction;
  approver?: User;
  lines?: JournalEntryLine[];
}

// ==================== ACCOUNT BALANCES ====================

export interface AccountBalance {
  id: number;
  companyId: number;
  accountId: number;
  periodDate: string;
  periodType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  openingBalance: number;
  debitTotal: number;
  creditTotal: number;
  closingBalance: number;
  createdAt: string;
  updatedAt: string;

  // Relations
  account?: ChartOfAccount;
}

// ==================== FINANCIAL REPORTS ====================

export type ReportType = 'BALANCE_SHEET' | 'INCOME_STATEMENT' | 'CASH_FLOW';
export type ReportStatus = 'DRAFT' | 'FINALIZED' | 'ARCHIVED';

export interface FinancialReport {
  id: number;
  companyId: number;
  reportType: ReportType;
  reportDate: string;
  periodStart: string;
  periodEnd: string;
  status: ReportStatus;
  reportData?: any;  // JSON object
  finalizedBy?: number;
  finalizedAt?: string;
  notes?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;

  // Relations
  creator?: User;
  finalizer?: User;
}

export interface GenerateReportInput {
  companyId: number;
  createdBy: number;
  periodEnd?: string;
  periodStart?: string;
}

// ==================== BALANCE SHEET ====================

export interface BalanceSheetAssetLine {
  id: number;
  accountCode: string;
  accountName: string;
  balance: number;
  level: AccountLevel;
}

export interface BalanceSheetSection {
  current: number;
  nonCurrent: number;
  total: number;
  details: BalanceSheetAssetLine[];
}

export interface BalanceSheetEquitySection {
  total: number;
  details: BalanceSheetAssetLine[];
}

export interface BalanceSheet {
  companyId: number;
  period: string;
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: BalanceSheetEquitySection;
}

export interface GenerateBalanceSheetInput {
  companyId: number;
  periodEnd: string;
  createdBy: number;
}

// ==================== INCOME STATEMENT ====================

export interface IncomeStatementSection {
  sales?: number;
  other?: number;
  total: number;
  details: BalanceSheetAssetLine[];
}

export interface IncomeStatement {
  period: {
    start: string;
    end: string;
  };
  revenue: IncomeStatementSection;
  expenses: IncomeStatementSection;
  netProfit: number;
  profitMargin: number;
}

export interface GenerateIncomeStatementInput {
  companyId: number;
  periodStart: string;
  periodEnd: string;
  createdBy: number;
}

// ==================== DASHBOARD ====================

export interface DashboardStats {
  period: {
    startDate: string;
    endDate: string;
  };
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  profitMargin: number;
  cashBalance: number;
}

export interface RecentTransaction {
  id: number;
  transactionCode: string;
  transactionDate: string;
  description: string;
  amount: number;
  transactionType: TransactionType;
  status: TransactionStatus;
  debitAccount: {
    accountName: string;
    accountCode: string;
  };
  creditAccount: {
    accountName: string;
    accountCode: string;
  };
  user: {
    name: string;
  };
}

export interface MonthlyStats {
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  transactionCount: number;
}

export interface DashboardPending {
  transactions: number;
  journals: number;
}

export interface DashboardSummary {
  month: {
    year: number;
    month: number;
  };
  stats: MonthlyStats;
  pending: DashboardPending;
  recentTransactions: RecentTransaction[];
  balanceByType: Record<AccountType, number>;
}

// ==================== API RESPONSES ====================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
}

// ==================== QUERY PARAMETERS ====================

export interface BaseQueryParams {
  companyId: number;
  page?: number;
  limit?: number;
}

export interface AccountsQueryParams extends BaseQueryParams {
  accountType?: AccountType;
  parentId?: number;
  isActive?: boolean;
}

export interface ReportsQueryParams extends BaseQueryParams {
  reportType?: ReportType;
  status?: ReportStatus;
  startDate?: string;
  endDate?: string;
}

// ==================== FORM DATA ====================

export interface TransactionFormData {
  transactionDate: string;
  transactionType: TransactionType;
  description: string;
  category: string;
  referenceNo: string;
  debitAccountId: number;
  creditAccountId: number;
  amount: number;
}

export interface AccountFormData {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  level: AccountLevel;
  parentId?: number;
  description?: string;
  isCashFlow: boolean;
}

// ==================== VALIDATION ERRORS ====================

export interface FormValidationErrors {
  [key: string]: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: FormValidationErrors;
}

// ==================== UTILITY TYPES ====================

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ==================== ENUM CONSTANTS ====================

export const ACCOUNT_TYPES = {
  ASSET: 'ASSET',
  LIABILITY: 'LIABILITY',
  EQUITY: 'EQUITY',
  REVENUE: 'REVENUE',
  EXPENSE: 'EXPENSE'
} as const;

export const TRANSACTION_TYPES = {
  PENDAPATAN: 'PENDAPATAN',
  PENGELUARAN: 'PENGELUARAN',
  TRANSFER: 'TRANSFER',
  ADJUSTMENT: 'ADJUSTMENT'
} as const;

export const TRANSACTION_STATUSES = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  POSTED: 'POSTED'
} as const;

export const REPORT_TYPES = {
  BALANCE_SHEET: 'BALANCE_SHEET',
  INCOME_STATEMENT: 'INCOME_STATEMENT',
  CASH_FLOW: 'CASH_FLOW'
} as const;

export const REPORT_STATUSES = {
  DRAFT: 'DRAFT',
  FINALIZED: 'FINALIZED',
  ARCHIVED: 'ARCHIVED'
} as const;

// ==================== HELPER TYPES ====================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncFunction<T, R = void> = (params: T) => Promise<R>;

// ==================== SELECTION TYPES ====================

export type AccountTypeOption = SelectOption<AccountType>;
export type TransactionTypeOption = SelectOption<TransactionType>;
export type TransactionStatusOption = SelectOption<TransactionStatus>;
