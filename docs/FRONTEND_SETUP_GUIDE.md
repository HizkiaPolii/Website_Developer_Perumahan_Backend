/**
 * README untuk Setup Frontend Project
 * Path: docs/FRONTEND_SETUP_GUIDE.md
 */

# Frontend Setup Guide - Sistem Pengelolaan Keuangan

Panduan lengkap untuk setup dan integrasi frontend dengan backend financial management system.

## 📋 Persyaratan

### Prerequisites
- Node.js 18+ atau 20+
- npm atau yarn
- Git
- Modern browser (Chrome, Firefox, Safari, Edge)
- Backend server running pada http://localhost:5000

### Backend Requirements
Pastikan backend sudah running sebelum mulai development:
```bash
# Di folder backend
npm install
npm run prisma:migrate
npm run seed:chart-of-accounts
npm run dev
```

Backend akan running di: http://localhost:5000

---

## 🚀 Quick Start (5 Menit)

### 1. Create React App / Next.js Project

**Untuk React (Vite):**
```bash
npm create vite@latest frontend-app -- --template react-ts
cd frontend-app
npm install
```

**Untuk Next.js:**
```bash
npx create-next-app@latest frontend-app --typescript
cd frontend-app
```

### 2. Install Dependencies

```bash
# Required
npm install axios react-router-dom zustand tailwindcss

# Optional but recommended
npm install date-fns clsx lucide-react react-hot-toast

# Development
npm install -D @types/react @types/react-dom
```

### 3. Copy Integration Files

Copy files dari backend ke frontend project:

```bash
# Copy TypeScript types
cp backend/src/types/financial-system.ts frontend/src/types/

# Copy constants dan utilities
cp backend/src/utils/financial-constants.ts frontend/src/utils/

# Copy API client
cp backend/src/services/api-client.ts frontend/src/services/
```

### 4. Setup Environment

Create `.env.local` file:

```env
# API Configuration
VITE_API_URL=http://localhost:5000
REACT_APP_API_URL=http://localhost:5000
NEXT_PUBLIC_API_URL=http://localhost:5000

# App Configuration
VITE_APP_NAME=Sistem Pengelolaan Keuangan
VITE_APP_VERSION=1.0.0

# Features
VITE_ENABLE_BATCH_PROCESSING=false
VITE_ENABLE_ADVANCED_REPORTS=false
VITE_ENABLE_RBAC=false
```

### 5. Start Development

```bash
npm run dev
```

Visit: http://localhost:5173 atau http://localhost:3000

---

## 📁 Project Structure

```
frontend-app/
├── src/
│   ├── components/           # React components
│   │   ├── Layout/
│   │   ├── Dashboard/
│   │   ├── Transactions/
│   │   ├── ChartOfAccounts/
│   │   └── Reports/
│   ├── pages/                # Page components (React Router / Next.js)
│   │   ├── Dashboard.tsx
│   │   ├── Transactions.tsx
│   │   ├── Accounts.tsx
│   │   ├── Reports.tsx
│   │   └── Settings.tsx
│   ├── services/             # API client
│   │   └── api-client.ts     # ✅ Copied from backend
│   ├── types/                # TypeScript types
│   │   └── financial-system.ts  # ✅ Copied from backend
│   ├── utils/                # Utilities & constants
│   │   └── financial-constants.ts  # ✅ Copied from backend
│   ├── stores/               # State management (Zustand/Redux)
│   ├── hooks/                # Custom React hooks
│   ├── styles/               # Global styles
│   ├── App.tsx               # Main app component
│   └── main.tsx              # Entry point
├── public/                   # Static assets
├── .env.local                # Environment variables
├── tsconfig.json             # TypeScript config
├── vite.config.ts            # Vite config (if using Vite)
└── package.json              # Dependencies
```

---

## 🔑 Key Integration Files

### 1. TypeScript Types (`src/types/financial-system.ts`)

File ini berisi semua TypeScript interfaces untuk type safety:

```typescript
// Import types
import {
  ChartOfAccount,
  Transaction,
  TransactionStatus,
  DashboardStats,
  ApiResponse
} from '@/types/financial-system';

// Use in components
const handleCreateTransaction = (data: CreateTransactionInput) => {
  // TypeScript will warn if you use wrong types
};
```

### 2. API Client (`src/services/api-client.ts`)

Centralized HTTP client untuk semua API calls:

```typescript
import { apiClient } from '@/services/api-client';

// Get transactions
const { data } = await apiClient.transactions.getAll({ 
  companyId: 1,
  page: 1,
  limit: 10 
});

// Create transaction
const newTrx = await apiClient.transactions.create({
  companyId: 1,
  userId: 1,
  transactionDate: '2024-04-29',
  // ... other fields
});

// Approve transaction
await apiClient.transactions.approve(transactionId, {
  approvedBy: userId
});
```

### 3. Constants & Utilities (`src/utils/financial-constants.ts`)

Helper functions dan constants untuk UI:

```typescript
import {
  formatCurrency,
  formatDate,
  getTransactionStatusLabel,
  getTransactionStatusColor,
  TRANSACTION_STATUS_LABELS,
  ACCOUNT_TYPES,
  API_ENDPOINTS
} from '@/utils/financial-constants';

// Format currency
const formatted = formatCurrency(1500000, true); // "Rp 1.500.000"

// Format date
const date = formatDate('2024-04-29', 'DISPLAY'); // "29/04/2024"

// Get labels
const label = getTransactionStatusLabel('APPROVED'); // "Disetujui"

// Get colors
const color = getTransactionStatusColor('APPROVED'); // "#10B981"
```

---

## 🧩 Component Examples

### Example 1: Dashboard Component

```typescript
// src/components/Dashboard/DashboardPage.tsx
import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api-client';
import { DashboardStats } from '@/types/financial-system';
import { formatCurrency } from '@/utils/financial-constants';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const response = await apiClient.dashboard.getStats(1); // companyId: 1
        
        if (response.success && response.data) {
          setStats(response.data);
        } else {
          setError(response.message || 'Failed to load stats');
        }
      } catch (err: any) {
        setError(err.message || 'Error loading dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!stats) return <div>No data</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        label="Total Revenue"
        value={formatCurrency(stats.totalRevenue)}
        color="green"
      />
      <StatCard
        label="Total Expense"
        value={formatCurrency(stats.totalExpense)}
        color="red"
      />
      <StatCard
        label="Net Profit"
        value={formatCurrency(stats.netProfit)}
        color="blue"
      />
      <StatCard
        label="Profit Margin"
        value={`${(stats.profitMargin * 100).toFixed(2)}%`}
        color="purple"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  color
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={`p-6 rounded-lg bg-${color}-50 border border-${color}-200`}>
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`text-2xl font-bold text-${color}-600 mt-2`}>{value}</p>
    </div>
  );
}
```

### Example 2: Transaction Form

```typescript
// src/components/Transactions/TransactionForm.tsx
import { useState } from 'react';
import { apiClient } from '@/services/api-client';
import {
  CreateTransactionInput,
  ChartOfAccount,
  TransactionType
} from '@/types/financial-system';
import {
  TRANSACTION_TYPES,
  validateAmount,
  validateTransactionAccounts,
  VALIDATION_MESSAGES
} from '@/utils/financial-constants';

export function TransactionForm({
  companyId,
  accounts,
  onSuccess
}: {
  companyId: number;
  accounts: ChartOfAccount[];
  onSuccess?: () => void;
}) {
  const [formData, setFormData] = useState<CreateTransactionInput>({
    companyId,
    userId: 1, // Get from auth context
    transactionDate: new Date().toISOString().split('T')[0],
    transactionType: 'PENDAPATAN',
    description: '',
    debitAccountId: 0,
    creditAccountId: 0,
    amount: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description) {
      newErrors.description = VALIDATION_MESSAGES.REQUIRED;
    }

    if (!formData.debitAccountId) {
      newErrors.debitAccountId = VALIDATION_MESSAGES.ACCOUNT_REQUIRED;
    }

    if (!formData.creditAccountId) {
      newErrors.creditAccountId = VALIDATION_MESSAGES.ACCOUNT_REQUIRED;
    }

    const amountValidation = validateAmount(formData.amount);
    if (!amountValidation.valid) {
      newErrors.amount = amountValidation.error || '';
    }

    const accountsValidation = validateTransactionAccounts(
      formData.debitAccountId,
      formData.creditAccountId
    );
    if (!accountsValidation.valid) {
      newErrors.accounts = accountsValidation.error || '';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.transactions.create(formData);

      if (response.success) {
        setFormData({
          companyId,
          userId: 1,
          transactionDate: new Date().toISOString().split('T')[0],
          transactionType: 'PENDAPATAN',
          description: '',
          debitAccountId: 0,
          creditAccountId: 0,
          amount: 0
        });
        onSuccess?.();
      } else {
        setErrors({ submit: response.message || 'Failed to create transaction' });
      }
    } catch (error: any) {
      setErrors({ submit: error.message || 'Error creating transaction' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Transaction Type */}
      <div>
        <label className="block text-sm font-medium mb-2">Tipe Transaksi</label>
        <select
          value={formData.transactionType}
          onChange={(e) =>
            setFormData({ ...formData, transactionType: e.target.value as TransactionType })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          {Object.entries(TRANSACTION_TYPES).map(([key, value]) => (
            <option key={key} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      {/* Transaction Date */}
      <div>
        <label className="block text-sm font-medium mb-2">Tanggal Transaksi</label>
        <input
          type="date"
          value={formData.transactionDate}
          onChange={(e) =>
            setFormData({ ...formData, transactionDate: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2">Deskripsi</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Masukkan deskripsi transaksi"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
        {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
      </div>

      {/* Debit Account */}
      <div>
        <label className="block text-sm font-medium mb-2">Akun Debit</label>
        <select
          value={formData.debitAccountId}
          onChange={(e) =>
            setFormData({ ...formData, debitAccountId: parseInt(e.target.value) })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Pilih Akun Debit</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.accountCode} - {account.accountName}
            </option>
          ))}
        </select>
        {errors.debitAccountId && <p className="text-red-500 text-sm">{errors.debitAccountId}</p>}
      </div>

      {/* Credit Account */}
      <div>
        <label className="block text-sm font-medium mb-2">Akun Kredit</label>
        <select
          value={formData.creditAccountId}
          onChange={(e) =>
            setFormData({ ...formData, creditAccountId: parseInt(e.target.value) })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Pilih Akun Kredit</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.accountCode} - {account.accountName}
            </option>
          ))}
        </select>
        {errors.creditAccountId && <p className="text-red-500 text-sm">{errors.creditAccountId}</p>}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium mb-2">Jumlah</label>
        <input
          type="number"
          value={formData.amount}
          onChange={(e) =>
            setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
          }
          placeholder="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
        {errors.amount && <p className="text-red-500 text-sm">{errors.amount}</p>}
      </div>

      {/* Error Message */}
      {errors.submit && <p className="text-red-500 text-sm">{errors.submit}</p>}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Create Transaction'}
      </button>
    </form>
  );
}
```

### Example 3: Transactions List

```typescript
// src/components/Transactions/TransactionsList.tsx
import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api-client';
import { Transaction, Pagination } from '@/types/financial-system';
import {
  formatDate,
  formatCurrency,
  getTransactionStatusLabel,
  getTransactionStatusColor,
  TRANSACTION_STATUS_LABELS
} from '@/utils/financial-constants';

export function TransactionsList({ companyId }: { companyId: number }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await apiClient.transactions.getAll({
        companyId,
        page,
        limit: pagination.limit
      });

      if (response.success && response.data) {
        setTransactions(response.data);
        setPagination(response.pagination);
      } else {
        setError(response.message || 'Failed to load transactions');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [companyId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Transaction Code</th>
            <th className="border p-2 text-left">Date</th>
            <th className="border p-2 text-left">Description</th>
            <th className="border p-2 text-right">Amount</th>
            <th className="border p-2 text-left">Status</th>
            <th className="border p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((trx) => (
            <tr key={trx.id} className="border-b">
              <td className="border p-2">{trx.transactionCode}</td>
              <td className="border p-2">{formatDate(trx.transactionDate, 'DISPLAY')}</td>
              <td className="border p-2">{trx.description}</td>
              <td className="border p-2 text-right">{formatCurrency(trx.amount)}</td>
              <td className="border p-2">
                <span
                  className="px-3 py-1 rounded-full text-sm"
                  style={{
                    backgroundColor: getTransactionStatusColor(trx.status),
                    color: 'white'
                  }}
                >
                  {getTransactionStatusLabel(trx.status)}
                </span>
              </td>
              <td className="border p-2">
                <button className="text-blue-600 hover:underline">View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-4">
        {Array.from({ length: pagination.pages }).map((_, i) => (
          <button
            key={i}
            onClick={() => loadTransactions(i + 1)}
            className={`px-3 py-1 rounded ${
              pagination.page === i + 1
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔐 Authentication Setup

### 1. Create Auth Context

```typescript
// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/services/api-client';
import { CurrentUser } from '@/types/financial-system';

interface AuthContextType {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists and get current user
    const checkAuth = async () => {
      const token = localStorage.getItem('financial_system_token');
      if (token) {
        try {
          const response = await apiClient.auth.getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data);
          }
        } catch {
          localStorage.removeItem('financial_system_token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.auth.login({ email, password });

    if (response.success && response.data) {
      localStorage.setItem('financial_system_token', response.data.token);
      setUser(response.data.user);
    } else {
      throw new Error(response.message || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await apiClient.auth.logout();
    } finally {
      localStorage.removeItem('financial_system_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### 2. Create Login Page

```typescript
// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { validateEmail, VALIDATION_MESSAGES } from '@/utils/financial-constants';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError(VALIDATION_MESSAGES.REQUIRED);
      return;
    }

    if (!validateEmail(email)) {
      setError(VALIDATION_MESSAGES.EMAIL_INVALID);
      return;
    }

    if (!password) {
      setError(VALIDATION_MESSAGES.REQUIRED);
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6">Login</h1>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
```

---

## 🧪 Testing

### Testing API Calls

```typescript
// src/__tests__/api.test.ts
import { apiClient } from '@/services/api-client';

describe('API Client', () => {
  beforeEach(() => {
    // Mock localStorage
    localStorage.setItem('financial_system_token', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('should get transactions', async () => {
    const response = await apiClient.transactions.getAll({
      companyId: 1,
      page: 1
    });

    expect(response.success).toBe(true);
    expect(Array.isArray(response.data)).toBe(true);
  });

  test('should create transaction', async () => {
    const response = await apiClient.transactions.create({
      companyId: 1,
      userId: 1,
      transactionDate: '2024-04-29',
      transactionType: 'PENDAPATAN',
      description: 'Test',
      debitAccountId: 1,
      creditAccountId: 2,
      amount: 100000
    });

    expect(response.success).toBe(true);
    expect(response.data?.id).toBeDefined();
  });
});
```

---

## 🚨 Error Handling

### Global Error Handler

```typescript
// src/utils/error-handler.ts
import { HttpError } from '@/services/api-client';
import { ERROR_TYPES, VALIDATION_MESSAGES } from '@/utils/financial-constants';

export function handleApiError(error: any): string {
  if (error instanceof HttpError) {
    switch (error.status) {
      case 400:
        return error.data?.message || VALIDATION_MESSAGES.GENERAL_ERROR;
      case 401:
        return 'Unauthorized - Please login again';
      case 403:
        return 'You do not have permission';
      case 404:
        return 'Resource not found';
      case 409:
        return error.data?.message || 'Conflict - Data already exists';
      case 500:
        return 'Server error - Please try again later';
      default:
        return error.message || VALIDATION_MESSAGES.GENERAL_ERROR;
    }
  }

  if (error.message === 'Failed to fetch') {
    return 'Connection error - Please check your network';
  }

  return error.message || VALIDATION_MESSAGES.GENERAL_ERROR;
}
```

---

## 📊 State Management (Zustand Example)

```typescript
// src/stores/transactionStore.ts
import { create } from 'zustand';
import { Transaction } from '@/types/financial-system';
import { apiClient } from '@/services/api-client';

interface TransactionStore {
  transactions: Transaction[];
  selectedTransaction: Transaction | null;
  loading: boolean;
  error: string | null;

  fetchTransactions: (companyId: number, page?: number) => Promise<void>;
  selectTransaction: (transaction: Transaction) => void;
  createTransaction: (data: any) => Promise<void>;
  approveTransaction: (id: number) => Promise<void>;
}

export const useTransactionStore = create<TransactionStore>((set) => ({
  transactions: [],
  selectedTransaction: null,
  loading: false,
  error: null,

  fetchTransactions: async (companyId: number, page = 1) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.transactions.getAll({ companyId, page });
      if (response.success && response.data) {
        set({ transactions: response.data });
      }
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  selectTransaction: (transaction: Transaction) => {
    set({ selectedTransaction: transaction });
  },

  createTransaction: async (data: any) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.transactions.create(data);
      if (response.success) {
        // Refetch transactions
      }
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  approveTransaction: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await apiClient.transactions.approve(id);
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  }
}));

// Usage in component:
// const { transactions, fetchTransactions } = useTransactionStore();
```

---

## 🔧 Troubleshooting

### CORS Error

**Problem:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution:** Pastikan backend sudah enable CORS:

```typescript
// Backend src/index.ts
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### Token Undefined

**Problem:** `Bearer undefined` dalam Authorization header

**Solution:** Pastikan token tersimpan dengan benar:

```typescript
// Check localStorage
console.log(localStorage.getItem('financial_system_token'));

// Login first
await apiClient.auth.login({ email, password });
```

### API Not Responding

**Problem:** Request hangs atau timeout

**Solution:**
1. Pastikan backend running: `npm run dev`
2. Check console untuk error messages
3. Verify `VITE_API_URL` environment variable
4. Check network tab di DevTools

---

## 📚 Resources

- [Frontend Integration Guide](./FRONTEND_INTEGRATION_GUIDE.md) - Detailed API specs
- [API Reference](./API_REFERENCE.md) - Backend API documentation
- [TypeScript Types](./src/types/financial-system.ts) - All available types
- [Constants & Utilities](./src/utils/financial-constants.ts) - Helper functions

---

## ✅ Checklist

Frontend Setup Checklist:

- [ ] Node.js 18+ installed
- [ ] Project created (React/Next.js)
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] TypeScript types copied
- [ ] API client copied
- [ ] Constants utilities copied
- [ ] Auth context created
- [ ] Login page created
- [ ] Dashboard page created
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173/3000
- [ ] Test login with demo credentials
- [ ] Test API calls in browser DevTools

---

## 🆘 Support

Jika ada masalah:

1. Check log di backend terminal
2. Check network requests di Browser DevTools
3. Verify environment variables
4. Restart frontend dev server
5. Clear browser cache
6. Check backend API response format

---

**Last Updated:** April 2024
**Version:** 1.0.0
**Backend Required:** >= 1.0.0
