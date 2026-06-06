/**
 * API Service untuk Frontend Integration
 * Gunakan file ini untuk semua HTTP requests ke backend
 * 
 * Place this in: src/services/api-client.ts atau src/api/client.ts
 * 
 * Usage:
 * import { apiClient } from '@/services/api-client';
 * 
 * const transactions = await apiClient.transactions.getAll({ companyId: 1 });
 * const transaction = await apiClient.transactions.create(data);
 */

import {
  ApiResponse,
  PaginatedResponse,
  LoginCredentials,
  LoginResponse,
  CurrentUser,
  User,
  ChartOfAccount,
  CreateAccountInput,
  UpdateAccountInput,
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionWorkflowInput,
  DashboardStats,
  DashboardSummary,
  BalanceSheet,
  IncomeStatement,
  FinancialReport,
  AccountBalance,
  Pagination,
  TransactionQueryParams,
  AccountsQueryParams,
  ReportsQueryParams
} from '../types/financial-system';

import { API_ENDPOINTS, TIMEOUT_MS, buildQueryString } from '../utils/financial-constants';

// ==================== TYPE DEFINITIONS ====================

export interface HttpClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface HttpError extends Error {
  status?: number;
  statusText?: string;
  data?: any;
}

// ==================== MAIN API CLIENT ====================

export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(config: HttpClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || TIMEOUT_MS.MEDIUM;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...(config.headers || {})
    };
  }

  /**
   * Get authorization token
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('financial_system_token');
  }

  /**
   * Build full URL with base
   */
  private buildUrl(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    return `${this.baseURL}${endpoint}`;
  }

  /**
   * Make HTTP request
   */
  private async request<T = any>(config: RequestConfig): Promise<T> {
    const url = this.buildUrl(config.url);
    const headers = {
      ...this.defaultHeaders,
      ...(config.headers || {})
    };

    // Add authorization header
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Build query string
    let fullUrl = url;
    if (config.params) {
      const queryString = buildQueryString(config.params);
      if (queryString) {
        fullUrl = `${url}?${queryString}`;
      }
    }

    const fetchConfig: RequestInit = {
      method: config.method,
      headers,
      signal: AbortSignal.timeout(config.timeout || this.timeout)
    };

    // Add body for non-GET requests
    if (config.data && config.method !== 'GET') {
      fetchConfig.body = JSON.stringify(config.data);
    }

    try {
      const response = await fetch(fullUrl, fetchConfig);

      // Parse response
      let data: any;
      try {
        data = await response.json();
      } catch {
        data = await response.text();
      }

      // Handle error responses
      if (!response.ok) {
        const error: HttpError = new Error(
          data?.message || `HTTP ${response.status}: ${response.statusText}`
        );
        error.status = response.status;
        error.statusText = response.statusText;
        error.data = data;

        // If 401, clear token and redirect to login
        if (response.status === 401) {
          localStorage.removeItem('financial_system_token');
          window.location.href = '/login';
        }

        throw error;
      }

      return data as T;
    } catch (error: any) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Gagal terhubung ke server');
      }
      throw error;
    }
  }

  /**
   * GET request
   */
  protected async get<T = any>(url: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>({
      method: 'GET',
      url,
      params
    });
  }

  /**
   * POST request
   */
  protected async post<T = any>(url: string, data?: any): Promise<T> {
    return this.request<T>({
      method: 'POST',
      url,
      data
    });
  }

  /**
   * PUT request
   */
  protected async put<T = any>(url: string, data?: any): Promise<T> {
    return this.request<T>({
      method: 'PUT',
      url,
      data
    });
  }

  /**
   * DELETE request
   */
  protected async delete<T = any>(url: string): Promise<T> {
    return this.request<T>({
      method: 'DELETE',
      url
    });
  }

  /**
   * PATCH request
   */
  protected async patch<T = any>(url: string, data?: any): Promise<T> {
    return this.request<T>({
      method: 'PATCH',
      url,
      data
    });
  }

  // ==================== AUTH ENDPOINTS ====================

  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    return this.post(API_ENDPOINTS.AUTH_LOGIN, credentials);
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.post(API_ENDPOINTS.AUTH_LOGOUT);
  }

  async getCurrentUser(): Promise<ApiResponse<CurrentUser>> {
    return this.get(API_ENDPOINTS.AUTH_ME);
  }

  // ==================== USER ENDPOINTS ====================

  async getUsers(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<User>> {
    return this.get(API_ENDPOINTS.USERS_LIST, params);
  }

  async getUser(id: number): Promise<ApiResponse<User>> {
    return this.get(API_ENDPOINTS.USERS_GET(id));
  }

  async createUser(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.post(API_ENDPOINTS.USERS_CREATE, data);
  }

  async updateUser(id: number, data: Partial<User>): Promise<ApiResponse<User>> {
    return this.put(API_ENDPOINTS.USERS_UPDATE(id), data);
  }

  async deleteUser(id: number): Promise<ApiResponse<void>> {
    return this.delete(API_ENDPOINTS.USERS_DELETE(id));
  }

  // ==================== CHART OF ACCOUNTS ENDPOINTS ====================

  async getChartOfAccounts(params?: AccountsQueryParams): Promise<PaginatedResponse<ChartOfAccount>> {
    return this.get(API_ENDPOINTS.COA_LIST, params as any);
  }

  async getChartOfAccount(id: number): Promise<ApiResponse<ChartOfAccount>> {
    return this.get(API_ENDPOINTS.COA_GET(id));
  }

  async createChartOfAccount(data: CreateAccountInput): Promise<ApiResponse<ChartOfAccount>> {
    return this.post(API_ENDPOINTS.COA_CREATE, data);
  }

  async updateChartOfAccount(id: number, data: UpdateAccountInput): Promise<ApiResponse<ChartOfAccount>> {
    return this.put(API_ENDPOINTS.COA_UPDATE(id), data);
  }

  async deleteChartOfAccount(id: number): Promise<ApiResponse<void>> {
    return this.delete(API_ENDPOINTS.COA_DELETE(id));
  }

  async getAccountHierarchy(companyId: number): Promise<ApiResponse<any>> {
    return this.get(API_ENDPOINTS.COA_HIERARCHY, { companyId });
  }

  async getAccountsByType(type: string, companyId: number): Promise<PaginatedResponse<ChartOfAccount>> {
    return this.get(API_ENDPOINTS.COA_BY_TYPE(type as any), { companyId });
  }

  // ==================== TRANSACTION ENDPOINTS ====================

  async getTransactions(params?: TransactionQueryParams): Promise<PaginatedResponse<Transaction>> {
    return this.get(API_ENDPOINTS.TRX_LIST, params as any);
  }

  async getTransaction(id: number): Promise<ApiResponse<Transaction>> {
    return this.get(API_ENDPOINTS.TRX_GET(id));
  }

  async createTransaction(data: CreateTransactionInput): Promise<ApiResponse<Transaction>> {
    return this.post(API_ENDPOINTS.TRX_CREATE, data);
  }

  async updateTransaction(id: number, data: UpdateTransactionInput): Promise<ApiResponse<Transaction>> {
    return this.put(API_ENDPOINTS.TRX_UPDATE(id), data);
  }

  async deleteTransaction(id: number): Promise<ApiResponse<void>> {
    return this.delete(API_ENDPOINTS.TRX_DELETE(id));
  }

  async approveTransaction(id: number, data?: TransactionWorkflowInput): Promise<ApiResponse<Transaction>> {
    return this.post(API_ENDPOINTS.TRX_APPROVE(id), data);
  }

  async rejectTransaction(id: number, data?: TransactionWorkflowInput): Promise<ApiResponse<Transaction>> {
    return this.post(API_ENDPOINTS.TRX_REJECT(id), data);
  }

  async getTransactionsByBatch(batchId: number): Promise<ApiResponse<Transaction[]>> {
    return this.get(API_ENDPOINTS.TRX_BY_BATCH(batchId));
  }

  // ==================== DASHBOARD ENDPOINTS ====================

  async getDashboardStats(companyId: number, params?: any): Promise<ApiResponse<DashboardStats>> {
    return this.get(API_ENDPOINTS.DASHBOARD_STATS, { companyId, ...params });
  }

  async getRecentTransactions(companyId: number): Promise<ApiResponse<any>> {
    return this.get(API_ENDPOINTS.DASHBOARD_RECENT, { companyId });
  }

  async getDashboardSummary(companyId: number): Promise<ApiResponse<DashboardSummary>> {
    return this.get(API_ENDPOINTS.DASHBOARD_SUMMARY, { companyId });
  }

  // ==================== FINANCIAL REPORTS ENDPOINTS ====================

  async generateBalanceSheet(companyId: number, periodEnd: string): Promise<ApiResponse<BalanceSheet>> {
    return this.get(API_ENDPOINTS.REPORT_BALANCE_SHEET, { companyId, periodEnd });
  }

  async generateIncomeStatement(
    companyId: number,
    periodStart: string,
    periodEnd: string
  ): Promise<ApiResponse<IncomeStatement>> {
    return this.get(API_ENDPOINTS.REPORT_INCOME_STATEMENT, { companyId, periodStart, periodEnd });
  }

  async generateCashFlow(
    companyId: number,
    periodStart: string,
    periodEnd: string
  ): Promise<ApiResponse<any>> {
    return this.get(API_ENDPOINTS.REPORT_CASH_FLOW, { companyId, periodStart, periodEnd });
  }

  async getReconciliation(companyId: number): Promise<ApiResponse<any>> {
    return this.get(API_ENDPOINTS.REPORT_RECONCILIATION, { companyId });
  }

  async getFinancialRatios(companyId: number, periodEnd: string): Promise<ApiResponse<any>> {
    return this.get(API_ENDPOINTS.REPORT_RATIOS, { companyId, periodEnd });
  }
}

// ==================== SINGLETON INSTANCE ====================

const apiClientInstance = new ApiClient({
  baseURL: process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  timeout: TIMEOUT_MS.MEDIUM
});

export { apiClientInstance };

/**
 * Export convenience object
 */
export const apiClient = {
  auth: {
    login: (credentials: LoginCredentials) => apiClientInstance.login(credentials),
    logout: () => apiClientInstance.logout(),
    getCurrentUser: () => apiClientInstance.getCurrentUser()
  },

  users: {
    getAll: (params?: any) => apiClientInstance.getUsers(params),
    get: (id: number) => apiClientInstance.getUser(id),
    create: (data: any) => apiClientInstance.createUser(data),
    update: (id: number, data: any) => apiClientInstance.updateUser(id, data),
    delete: (id: number) => apiClientInstance.deleteUser(id)
  },

  chartOfAccounts: {
    getAll: (params?: any) => apiClientInstance.getChartOfAccounts(params),
    get: (id: number) => apiClientInstance.getChartOfAccount(id),
    create: (data: any) => apiClientInstance.createChartOfAccount(data),
    update: (id: number, data: any) => apiClientInstance.updateChartOfAccount(id, data),
    delete: (id: number) => apiClientInstance.deleteChartOfAccount(id),
    getHierarchy: (companyId: number) => apiClientInstance.getAccountHierarchy(companyId),
    getByType: (type: string, companyId: number) => apiClientInstance.getAccountsByType(type, companyId)
  },

  transactions: {
    getAll: (params?: any) => apiClientInstance.getTransactions(params),
    get: (id: number) => apiClientInstance.getTransaction(id),
    create: (data: any) => apiClientInstance.createTransaction(data),
    update: (id: number, data: any) => apiClientInstance.updateTransaction(id, data),
    delete: (id: number) => apiClientInstance.deleteTransaction(id),
    approve: (id: number, data?: any) => apiClientInstance.approveTransaction(id, data),
    reject: (id: number, data?: any) => apiClientInstance.rejectTransaction(id, data),
    getByBatch: (batchId: number) => apiClientInstance.getTransactionsByBatch(batchId)
  },

  dashboard: {
    getStats: (companyId: number, params?: any) => apiClientInstance.getDashboardStats(companyId, params),
    getRecentTransactions: (companyId: number) => apiClientInstance.getRecentTransactions(companyId),
    getSummary: (companyId: number) => apiClientInstance.getDashboardSummary(companyId)
  },

  reports: {
    generateBalanceSheet: (companyId: number, periodEnd: string) =>
      apiClientInstance.generateBalanceSheet(companyId, periodEnd),
    generateIncomeStatement: (companyId: number, periodStart: string, periodEnd: string) =>
      apiClientInstance.generateIncomeStatement(companyId, periodStart, periodEnd),
    generateCashFlow: (companyId: number, periodStart: string, periodEnd: string) =>
      apiClientInstance.generateCashFlow(companyId, periodStart, periodEnd),
    getReconciliation: (companyId: number) => apiClientInstance.getReconciliation(companyId),
    getFinancialRatios: (companyId: number, periodEnd: string) =>
      apiClientInstance.getFinancialRatios(companyId, periodEnd)
  }
};

export default apiClient;

/**
 * Custom hook untuk API calls (untuk React) - Commented out in backend
 * 
 * Usage:
 * const { data, loading, error } = useApi(() => apiClient.transactions.getAll({ companyId: 1 }));
 */
/*
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        throw new Error(response.message || 'Request failed');
      }
    } catch (err: any) {
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  React.useEffect(() => {
    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
}

// Make React available for hook
declare global {
  namespace JSX {}
}

import * as React from 'react';
*/
