/**
 * Sistem Pengelolaan Keuangan - Frontend Constants & Utilities
 * v1.0.0
 *
 * Gunakan file ini di project frontend untuk constants dan helper functions
 * Place this in: src/utils/financial-constants.ts atau src/constants/financial.ts
 */

import {
  AccountType,
  TransactionStatus,
  TransactionType,
  ReportType,
  UserRole
} from '../types/financial-system';

// ==================== API ENDPOINTS ====================

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_ME: '/api/auth/me',
  AUTH_REGISTER: '/api/auth/register',

  // Users
  USERS_LIST: '/api/users',
  USERS_GET: (id: number) => `/api/users/${id}`,
  USERS_CREATE: '/api/users',
  USERS_UPDATE: (id: number) => `/api/users/${id}`,
  USERS_DELETE: (id: number) => `/api/users/${id}`,

  // Chart of Accounts
  COA_LIST: '/api/chart-of-accounts',
  COA_GET: (id: number) => `/api/chart-of-accounts/${id}`,
  COA_CREATE: '/api/chart-of-accounts',
  COA_UPDATE: (id: number) => `/api/chart-of-accounts/${id}`,
  COA_DELETE: (id: number) => `/api/chart-of-accounts/${id}`,
  COA_HIERARCHY: '/api/chart-of-accounts/hierarchy/tree',
  COA_BY_TYPE: (type: AccountType) => `/api/chart-of-accounts/type/${type}`,

  // Transactions
  TRX_LIST: '/api/transactions',
  TRX_GET: (id: number) => `/api/transactions/${id}`,
  TRX_CREATE: '/api/transactions',
  TRX_UPDATE: (id: number) => `/api/transactions/${id}`,
  TRX_DELETE: (id: number) => `/api/transactions/${id}`,
  TRX_APPROVE: (id: number) => `/api/transactions/${id}/approve`,
  TRX_REJECT: (id: number) => `/api/transactions/${id}/reject`,
  TRX_BY_BATCH: (batchId: number) => `/api/transactions/batch/${batchId}`,

  // Dashboard
  DASHBOARD_STATS: '/api/dashboard/stats',
  DASHBOARD_RECENT: '/api/dashboard/recent-transactions',
  DASHBOARD_SUMMARY: '/api/dashboard/summary',

  // Financial Reports
  REPORT_BALANCE_SHEET: '/api/dashboard/balance-sheet',
  REPORT_INCOME_STATEMENT: '/api/dashboard/income-statement',
  REPORT_CASH_FLOW: '/api/dashboard/cash-flow',
  REPORT_RECONCILIATION: '/api/dashboard/reconciliation',
  REPORT_RATIOS: '/api/dashboard/financial-ratios'
} as const;

// ==================== DISPLAY LABELS ====================

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  ASSET: 'Aset',
  LIABILITY: 'Kewajiban',
  EQUITY: 'Ekuitas',
  REVENUE: 'Pendapatan',
  EXPENSE: 'Pengeluaran'
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  PENDAPATAN: 'Pendapatan',
  PENGELUARAN: 'Pengeluaran',
  TRANSFER: 'Transfer',
  ADJUSTMENT: 'Penyesuaian'
};

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  DRAFT: 'Draf',
  PENDING: 'Menunggu Persetujuan',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  POSTED: 'Dipasok'
};

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  BALANCE_SHEET: 'Neraca',
  INCOME_STATEMENT: 'Laporan Laba Rugi',
  CASH_FLOW: 'Arus Kas'
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  Admin: 'Administrator',
  Manager: 'Manajer',
  Owner: 'Direktur'
};

// ==================== COLORS & STYLING ====================

export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  ASSET: '#3B82F6',        // Blue
  LIABILITY: '#EF4444',    // Red
  EQUITY: '#8B5CF6',       // Purple
  REVENUE: '#10B981',      // Green
  EXPENSE: '#F97316'       // Orange
};

export const TRANSACTION_STATUS_COLORS: Record<TransactionStatus, string> = {
  DRAFT: '#6B7280',        // Gray
  PENDING: '#F59E0B',      // Amber
  APPROVED: '#10B981',     // Green
  REJECTED: '#EF4444',     // Red
  POSTED: '#3B82F6'        // Blue
};

export const TRANSACTION_STATUS_BG_COLORS: Record<TransactionStatus, string> = {
  DRAFT: '#F3F4F6',        // Light gray
  PENDING: '#FEF3C7',      // Light amber
  APPROVED: '#ECFDF5',     // Light green
  REJECTED: '#FEE2E2',     // Light red
  POSTED: '#EFF6FF'        // Light blue
};

// ==================== VALIDATION MESSAGES ====================

export const VALIDATION_MESSAGES = {
  REQUIRED: 'Field ini harus diisi',
  EMAIL_INVALID: 'Format email tidak valid',
  PASSWORD_MIN: 'Password minimal 6 karakter',
  AMOUNT_INVALID: 'Jumlah harus angka positif',
  AMOUNT_MIN: 'Jumlah harus lebih dari 0',
  ACCOUNT_REQUIRED: 'Akun harus dipilih',
  ACCOUNT_SAME: 'Akun debit dan kredit tidak boleh sama',
  DATE_INVALID: 'Format tanggal tidak valid',
  DATE_FUTURE: 'Tanggal tidak boleh di masa depan',
  CODE_DUPLICATE: 'Kode sudah digunakan',
  NAME_MIN: 'Nama minimal 3 karakter',
  PHONE_INVALID: 'Format nomor telepon tidak valid',
  GENERAL_ERROR: 'Terjadi kesalahan, silakan coba lagi'
};

// ==================== HTTP STATUS CODES ====================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

// ==================== ERROR TYPES ====================

export const ERROR_TYPES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const;

// ==================== PAGINATION ====================

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE
};

// ==================== DATE FORMATS ====================

export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_TIME: 'DD/MM/YYYY HH:mm',
  MONTH_YEAR: 'MM/YYYY',
  YEAR: 'YYYY'
};

// ==================== CURRENCY ====================

export const CURRENCY = {
  CODE: 'IDR',
  SYMBOL: 'Rp',
  DECIMAL_PLACES: 0  // IDR typically uses no decimal places
};

// ==================== TIMEOUT VALUES ====================

export const TIMEOUT_MS = {
  SHORT: 3000,      // 3 seconds
  MEDIUM: 5000,     // 5 seconds
  LONG: 10000,      // 10 seconds
  VERY_LONG: 30000  // 30 seconds
} as const;

// ==================== STORAGE KEYS ====================

export const STORAGE_KEYS = {
  TOKEN: 'financial_system_token',
  USER: 'financial_system_user',
  COMPANY_ID: 'financial_system_company_id',
  THEME: 'financial_system_theme',
  LANGUAGE: 'financial_system_language',
  LAST_VISITED: 'financial_system_last_visited'
} as const;

// ==================== FEATURE FLAGS ====================

export const FEATURE_FLAGS = {
  ENABLE_BATCH_PROCESSING: false,      // Phase 2
  ENABLE_ADVANCED_REPORTS: false,      // Phase 2
  ENABLE_RBAC: false,                  // Phase 2
  ENABLE_AUDIT_TRAIL_UI: false,        // Phase 2
  ENABLE_MULTI_TENANT: true,           // Phase 1
  ENABLE_TRANSACTION_APPROVAL: true,   // Phase 1
  ENABLE_DOUBLE_ENTRY: true            // Phase 1
} as const;

// ==================== TRANSACTION RULES ====================

export const TRANSACTION_RULES = {
  MIN_AMOUNT: 0,
  MAX_AMOUNT: 999999999999,
  DECIMAL_PLACES: 2,
  APPROVAL_REQUIRED_ABOVE: 100000000  // Above 100 juta
} as const;

// ==================== ACCOUNT LEVEL ====================

export const ACCOUNT_LEVELS = {
  1: 'Level 1 (Kategori Utama)',
  2: 'Level 2 (Sub Kategori)',
  3: 'Level 3 (Detail)'
} as const;

// ==================== MENU ITEMS ====================

export const MENU_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    path: '/dashboard'
  },
  {
    id: 'transactions',
    label: 'Transaksi',
    icon: 'ArrowRightLeft',
    path: '/transactions',
    children: [
      { id: 'transactions-list', label: 'Daftar Transaksi', path: '/transactions' },
      { id: 'transactions-new', label: 'Transaksi Baru', path: '/transactions/new' },
      { id: 'transactions-pending', label: 'Menunggu Persetujuan', path: '/transactions/pending' }
    ]
  },
  {
    id: 'accounts',
    label: 'Chart of Accounts',
    icon: 'BarChart3',
    path: '/accounts'
  },
  {
    id: 'reports',
    label: 'Laporan Keuangan',
    icon: 'FileText',
    path: '/reports',
    children: [
      { id: 'reports-balance', label: 'Neraca', path: '/reports/balance-sheet' },
      { id: 'reports-income', label: 'Laba Rugi', path: '/reports/income-statement' },
      { id: 'reports-cash', label: 'Arus Kas', path: '/reports/cash-flow' }
    ]
  },
  {
    id: 'settings',
    label: 'Pengaturan',
    icon: 'Settings',
    path: '/settings',
    children: [
      { id: 'settings-users', label: 'Kelola Pengguna', path: '/settings/users' },
      { id: 'settings-company', label: 'Informasi Perusahaan', path: '/settings/company' }
    ]
  }
];

// ==================== HELPER FUNCTIONS ====================

/**
 * Format currency untuk display
 */
export function formatCurrency(amount: number, symbol: boolean = true): string {
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: CURRENCY.DECIMAL_PLACES,
    maximumFractionDigits: CURRENCY.DECIMAL_PLACES
  }).format(amount);

  return symbol ? `${CURRENCY.SYMBOL} ${formatted}` : formatted;
}

/**
 * Format date untuk display
 */
export function formatDate(date: string | Date, format: keyof typeof DATE_FORMATS = 'DISPLAY'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  const patterns: Record<keyof typeof DATE_FORMATS, string> = {
    ISO: `${year}-${month}-${day}`,
    DISPLAY: `${day}/${month}/${year}`,
    DISPLAY_TIME: `${day}/${month}/${year} ${hours}:${minutes}`,
    MONTH_YEAR: `${month}/${year}`,
    YEAR: `${year}`
  };

  return patterns[format];
}

/**
 * Parse currency string ke number
 */
export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^\d.-]/g, ''));
}

/**
 * Get account type color
 */
export function getAccountTypeColor(type: AccountType): string {
  return ACCOUNT_TYPE_COLORS[type] || '#6B7280';
}

/**
 * Get transaction status color
 */
export function getTransactionStatusColor(status: TransactionStatus): string {
  return TRANSACTION_STATUS_COLORS[status] || '#6B7280';
}

/**
 * Get transaction status background color
 */
export function getTransactionStatusBgColor(status: TransactionStatus): string {
  return TRANSACTION_STATUS_BG_COLORS[status] || '#F3F4F6';
}

/**
 * Get label untuk account type
 */
export function getAccountTypeLabel(type: AccountType): string {
  return ACCOUNT_TYPE_LABELS[type] || type;
}

/**
 * Get label untuk transaction type
 */
export function getTransactionTypeLabel(type: TransactionType): string {
  return TRANSACTION_TYPE_LABELS[type] || type;
}

/**
 * Get label untuk transaction status
 */
export function getTransactionStatusLabel(status: TransactionStatus): string {
  return TRANSACTION_STATUS_LABELS[status] || status;
}

/**
 * Get label untuk report type
 */
export function getReportTypeLabel(type: ReportType): string {
  return REPORT_TYPE_LABELS[type] || type;
}

/**
 * Validate email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate amount
 */
export function validateAmount(amount: number | string): { valid: boolean; error?: string } {
  const num = typeof amount === 'string' ? parseCurrency(amount) : amount;

  if (isNaN(num)) {
    return { valid: false, error: VALIDATION_MESSAGES.AMOUNT_INVALID };
  }

  if (num <= 0) {
    return { valid: false, error: VALIDATION_MESSAGES.AMOUNT_MIN };
  }

  if (num > TRANSACTION_RULES.MAX_AMOUNT) {
    return { valid: false, error: `Maksimal jumlah adalah ${formatCurrency(TRANSACTION_RULES.MAX_AMOUNT)}` };
  }

  return { valid: true };
}

/**
 * Validate transaction debit/credit accounts are different
 */
export function validateTransactionAccounts(
  debitAccountId: number,
  creditAccountId: number
): { valid: boolean; error?: string } {
  if (debitAccountId === creditAccountId) {
    return { valid: false, error: VALIDATION_MESSAGES.ACCOUNT_SAME };
  }

  return { valid: true };
}

/**
 * Check if user can perform action based on role
 */
export function canUserApproveTransaction(userRole: UserRole): boolean {
  return userRole === 'Manager' || userRole === 'Owner';
}

/**
 * Check if transaction can be edited
 */
export function canEditTransaction(status: TransactionStatus): boolean {
  return status === 'DRAFT';
}

/**
 * Check if transaction can be deleted
 */
export function canDeleteTransaction(status: TransactionStatus): boolean {
  return status === 'DRAFT' || status === 'REJECTED';
}

/**
 * Check if transaction can be approved
 */
export function canApproveTransaction(status: TransactionStatus): boolean {
  return status === 'DRAFT' || status === 'PENDING';
}

/**
 * Get status badge variant untuk UI component
 */
export function getStatusBadgeVariant(status: TransactionStatus): 'default' | 'secondary' | 'success' | 'destructive' | 'outline' {
  const variants: Record<TransactionStatus, 'default' | 'secondary' | 'success' | 'destructive' | 'outline'> = {
    DRAFT: 'secondary',
    PENDING: 'outline',
    APPROVED: 'success',
    REJECTED: 'destructive',
    POSTED: 'default'
  };

  return variants[status] || 'default';
}

/**
 * Get first day of month
 */
export function getFirstDayOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get last day of month
 */
export function getLastDayOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Get date range for current month
 */
export function getCurrentMonthRange(): { start: string; end: string } {
  const today = new Date();
  const start = getFirstDayOfMonth(today);
  const end = getLastDayOfMonth(today);

  return {
    start: formatDate(start, 'ISO'),
    end: formatDate(end, 'ISO')
  };
}

/**
 * Build query string from params
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}

/**
 * Extract token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

/**
 * Save token to localStorage
 */
export function saveAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  }
}

/**
 * Remove token from localStorage
 */
export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  }
}

export default {
  API_ENDPOINTS,
  ACCOUNT_TYPE_LABELS,
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_STATUS_LABELS,
  REPORT_TYPE_LABELS,
  USER_ROLE_LABELS,
  ACCOUNT_TYPE_COLORS,
  TRANSACTION_STATUS_COLORS,
  TRANSACTION_STATUS_BG_COLORS,
  VALIDATION_MESSAGES,
  HTTP_STATUS,
  ERROR_TYPES,
  DEFAULT_PAGINATION,
  DATE_FORMATS,
  CURRENCY,
  TIMEOUT_MS,
  STORAGE_KEYS,
  FEATURE_FLAGS,
  TRANSACTION_RULES,
  MENU_ITEMS,
  formatCurrency,
  formatDate,
  parseCurrency,
  getAccountTypeColor,
  getTransactionStatusColor,
  getTransactionStatusBgColor,
  getAccountTypeLabel,
  getTransactionTypeLabel,
  getTransactionStatusLabel,
  getReportTypeLabel,
  validateEmail,
  validateAmount,
  validateTransactionAccounts,
  canUserApproveTransaction,
  canEditTransaction,
  canDeleteTransaction,
  canApproveTransaction,
  getStatusBadgeVariant,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  getCurrentMonthRange,
  buildQueryString,
  getAuthToken,
  saveAuthToken,
  clearAuthToken
};
