# 📖 API Reference Documentation

**Complete API Endpoint Reference for Sistem Pengelolaan Keuangan**

---

## 📋 Table of Contents
1. [Authentication](#authentication)
2. [Chart of Accounts](#chart-of-accounts)
3. [Transactions](#transactions)
4. [Dashboard](#dashboard)
5. [Financial Reports](#financial-reports)
6. [Response Format](#response-format)
7. [Error Codes](#error-codes)

---

## Authentication

### POST `/api/auth/login`
Login user dan dapatkan JWT token.

**Request:**
```json
{
  "email": "user@company.com",
  "password": "password123"
}
```

**Response:** (200 OK)
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@company.com",
    "name": "John Doe",
    "role": "admin"
  }
}
```

### POST `/api/auth/logout`
Logout user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** (200 OK)
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### GET `/api/auth/profile`
Get current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@company.com",
    "name": "John Doe",
    "role": "admin",
    "companyId": 1,
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

---

## Chart of Accounts

### GET `/api/accounts`
Get all chart of accounts dengan filters.

**Query Parameters:**
```
companyId=1         (required)
accountType=ASSET   (optional: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)
isActive=true       (optional: true/false)
parentId=2          (optional)
```

**Response:** (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "companyId": 1,
      "accountCode": "1.0.00",
      "accountName": "ASET",
      "accountType": "ASSET",
      "level": 1,
      "parentId": null,
      "isCashFlow": false,
      "isActive": true,
      "description": "Total Aset",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z",
      "parent": null,
      "children": [...]
    }
  ],
  "count": 39
}
```

### GET `/api/accounts/:id`
Get account detail by ID.

**Parameters:**
```
:id - Account ID (required)
```

**Response:** (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "accountCode": "1.0.00",
    "accountName": "ASET",
    "accountType": "ASSET",
    "level": 1,
    "isCashFlow": false,
    "isActive": true,
    "description": "Total Aset",
    "parent": null,
    "children": [
      {
        "id": 2,
        "accountCode": "1.1.00",
        "accountName": "ASET LANCAR",
        ...
      }
    ],
    "debitTransactions": [...],
    "creditTransactions": [...]
  }
}
```

### POST `/api/accounts`
Create new account.

**Request Body:**
```json
{
  "companyId": 1,
  "accountCode": "1.1.01",
  "accountName": "Kas",
  "accountType": "ASSET",
  "level": 3,
  "parentId": 2,
  "description": "Kas besar dan petty cash",
  "isCashFlow": true
}
```

**Response:** (201 Created)
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "id": 40,
    "companyId": 1,
    "accountCode": "1.1.01",
    "accountName": "Kas",
    ...
  }
}
```

### PUT `/api/accounts/:id`
Update account.

**Request Body:**
```json
{
  "accountName": "Kas Baru",
  "description": "Updated description",
  "isCashFlow": true,
  "isActive": true
}
```

**Response:** (200 OK)
```json
{
  "success": true,
  "message": "Account updated successfully",
  "data": { ... }
}
```

### DELETE `/api/accounts/:id`
Delete account.

**Validation:**
- Account tidak memiliki child accounts
- Account tidak memiliki transactions

**Response:** (200 OK)
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

### GET `/api/accounts/hierarchy?companyId=1`
Get account hierarchy structure.

**Query Parameters:**
```
companyId=1 (required)
```

**Response:** (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "accountCode": "1.0.00",
      "accountName": "ASET",
      "level": 1,
      "children": [
        {
          "id": 2,
          "accountCode": "1.1.00",
          "accountName": "ASET LANCAR",
          "level": 2,
          "children": [
            {
              "id": 3,
              "accountCode": "1.1.01",
              "accountName": "Kas",
              "level": 3,
              "children": []
            }
          ]
        }
      ]
    }
  ]
}
```

### GET `/api/accounts/by-type/:type?companyId=1`
Get accounts by type.

**Parameters:**
```
:type - ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE (required)
```

**Query Parameters:**
```
companyId=1 (optional)
```

**Response:** (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "accountCode": "1.0.00",
      "accountName": "ASET",
      "accountType": "ASSET",
      ...
    }
  ],
  "count": 10
}
```

---

## Transactions

### GET `/api/transactions`
Get list of transactions (paginated, filterable).

**Query Parameters:**
```
companyId=1              (required)
status=APPROVED          (optional: DRAFT, PENDING, APPROVED, REJECTED, POSTED)
type=PENDAPATAN          (optional: PENDAPATAN, PENGELUARAN, TRANSFER, ADJUSTMENT)
category=Penjualan       (optional)
from=2026-04-01          (optional: ISO date)
to=2026-04-30            (optional: ISO date)
page=1                   (optional: page number, default 1)
limit=10                 (optional: items per page, default 10)
```

**Response:** (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "companyId": 1,
      "transactionCode": "PEN/20260429/0001",
      "transactionDate": "2026-04-29T00:00:00Z",
      "transactionType": "PENDAPATAN",
      "description": "Penjualan Produk ABC",
      "category": "Penjualan",
      "referenceNo": "INV-001",
      "debitAccountId": 2,
      "creditAccountId": 9,
      "amount": "1000000.00",
      "status": "POSTED",
      "approvedBy": 2,
      "approvedAt": "2026-04-29T10:00:00Z",
      "createdAt": "2026-04-29T09:00:00Z",
      "debitAccount": { ... },
      "creditAccount": { ... },
      "user": { ... },
      "approver": { ... }
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

### GET `/api/transactions/:id`
Get transaction detail.

**Parameters:**
```
:id - Transaction ID (required)
```

**Response:** (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "transactionCode": "PEN/20260429/0001",
    ...
    "journalEntry": {
      "id": 1,
      "journalNo": "JE/1/123456",
      "lines": [
        {
          "id": 1,
          "accountId": 2,
          "debit": "1000000.00",
          "credit": "0.00",
          "account": { ... }
        },
        {
          "id": 2,
          "accountId": 9,
          "debit": "0.00",
          "credit": "1000000.00",
          "account": { ... }
        }
      ]
    }
  }
}
```

### POST `/api/transactions`
Create new transaction (DRAFT status).

**Request Body:**
```json
{
  "companyId": 1,
  "userId": 1,
  "transactionDate": "2026-04-29",
  "transactionType": "PENDAPATAN",
  "description": "Penjualan Produk ABC",
  "category": "Penjualan",
  "referenceNo": "INV-001",
  "debitAccountId": 2,
  "creditAccountId": 9,
  "amount": 1000000
}
```

**Response:** (201 Created)
```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "id": 1,
    "transactionCode": "PEN/20260429/0001",
    "status": "DRAFT",
    ...
  }
}
```

### PUT `/api/transactions/:id`
Update transaction (DRAFT status only).

**Request Body:**
```json
{
  "description": "Updated description",
  "amount": 1500000,
  "debitAccountId": 3,
  "creditAccountId": 9
}
```

**Response:** (200 OK)
```json
{
  "success": true,
  "message": "Transaction updated successfully",
  "data": { ... }
}
```

### DELETE `/api/transactions/:id`
Delete transaction (DRAFT status only).

**Response:** (200 OK)
```json
{
  "success": true,
  "message": "Transaction deleted successfully"
}
```

### POST `/api/transactions/:id/approve`
Approve transaction (PENDING → APPROVED).

**Request Body:**
```json
{
  "approvedBy": 2
}
```

**Response:** (200 OK)
```json
{
  "success": true,
  "message": "Transaction approved successfully",
  "data": {
    "id": 1,
    "status": "APPROVED",
    "approvedBy": 2,
    "approvedAt": "2026-04-29T10:30:00Z",
    ...
  }
}
```

### POST `/api/transactions/:id/reject`
Reject transaction (PENDING → REJECTED).

**Request Body:**
```json
{
  "rejectionReason": "Tidak sesuai dengan policy"
}
```

**Response:** (200 OK)
```json
{
  "success": true,
  "message": "Transaction rejected successfully",
  "data": {
    "id": 1,
    "status": "REJECTED",
    "rejectionReason": "Tidak sesuai dengan policy",
    ...
  }
}
```

### POST `/api/transactions/:id/post`
Post transaction to journal (APPROVED → POSTED).

**Response:** (200 OK)
```json
{
  "success": true,
  "message": "Transaction posted successfully",
  "data": {
    "transaction": {
      "id": 1,
      "status": "POSTED",
      "journalEntry": { ... }
    },
    "journalEntry": {
      "id": 1,
      "journalNo": "JE/1/123456",
      "lines": [...]
    }
  }
}
```

---

## Dashboard

### GET `/api/dashboard/stats`
Get financial statistics.

**Query Parameters:**
```
companyId=1              (required)
startDate=2026-04-01     (optional)
endDate=2026-04-30       (optional)
```

**Response:** (200 OK)
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2026-04-01T00:00:00Z",
      "endDate": "2026-04-30T23:59:59Z"
    },
    "totalRevenue": 5000000,
    "totalExpense": 2000000,
    "netProfit": 3000000,
    "profitMargin": 60.00,
    "cashBalance": 7500000
  }
}
```

### GET `/api/dashboard/recent-transactions`
Get recent transactions.

**Query Parameters:**
```
companyId=1  (required)
limit=10     (optional)
```

**Response:** (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "transactionCode": "PEN/20260429/0001",
      "transactionDate": "2026-04-29T00:00:00Z",
      "description": "Penjualan Produk ABC",
      "amount": "1000000.00",
      "transactionType": "PENDAPATAN",
      "status": "POSTED",
      "debitAccount": {
        "accountName": "Kas",
        "accountCode": "1.1.01"
      },
      "creditAccount": {
        "accountName": "Pendapatan Penjualan",
        "accountCode": "4.1.00"
      },
      "user": {
        "name": "John Doe"
      }
    }
  ],
  "count": 5
}
```

### GET `/api/dashboard/summary`
Get comprehensive dashboard summary.

**Query Parameters:**
```
companyId=1 (required)
```

**Response:** (200 OK)
```json
{
  "success": true,
  "data": {
    "month": {
      "year": 2026,
      "month": 4
    },
    "stats": {
      "totalRevenue": 5000000,
      "totalExpense": 2000000,
      "netProfit": 3000000,
      "transactionCount": 42
    },
    "pending": {
      "transactions": 3,
      "journals": 0
    },
    "recentTransactions": [...],
    "balanceByType": {
      "ASSET": 8000000,
      "LIABILITY": 3000000,
      "EQUITY": 5000000,
      "REVENUE": 5000000,
      "EXPENSE": 2000000
    }
  }
}
```

---

## Financial Reports

### POST `/api/dashboard/reports/balance-sheet/generate`
Generate Balance Sheet.

**Request Body:**
```json
{
  "companyId": 1,
  "periodEnd": "2026-04-30",
  "createdBy": 1
}
```

**Response:** (201 Created)
```json
{
  "success": true,
  "message": "Balance Sheet generated successfully",
  "data": {
    "report": {
      "id": 1,
      "companyId": 1,
      "reportType": "BALANCE_SHEET",
      "reportDate": "2026-04-29T15:30:00Z",
      "periodEnd": "2026-04-30T00:00:00Z",
      "status": "DRAFT",
      "createdBy": 1
    },
    "balanceSheet": {
      "companyId": 1,
      "period": "2026-04-30T00:00:00Z",
      "assets": {
        "current": 3000000,
        "nonCurrent": 5000000,
        "total": 8000000,
        "details": [...]
      },
      "liabilities": {
        "current": 1000000,
        "nonCurrent": 2000000,
        "total": 3000000,
        "details": [...]
      },
      "equity": {
        "total": 5000000,
        "details": [...]
      }
    }
  }
}
```

### POST `/api/dashboard/reports/income-statement/generate`
Generate Income Statement.

**Request Body:**
```json
{
  "companyId": 1,
  "periodStart": "2026-04-01",
  "periodEnd": "2026-04-30",
  "createdBy": 1
}
```

**Response:** (201 Created)
```json
{
  "success": true,
  "message": "Income Statement generated successfully",
  "data": {
    "report": {
      "id": 2,
      "reportType": "INCOME_STATEMENT",
      "status": "DRAFT"
    },
    "incomeStatement": {
      "period": {
        "start": "2026-04-01T00:00:00Z",
        "end": "2026-04-30T00:00:00Z"
      },
      "revenue": {
        "sales": 4500000,
        "other": 500000,
        "total": 5000000,
        "details": [...]
      },
      "expenses": {
        "operational": 1500000,
        "nonOperational": 500000,
        "total": 2000000,
        "details": [...]
      },
      "netProfit": 3000000,
      "profitMargin": 60.00
    }
  }
}
```

### GET `/api/dashboard/reports`
Get all financial reports with filters.

**Query Parameters:**
```
companyId=1              (required)
reportType=BALANCE_SHEET (optional)
status=DRAFT             (optional: DRAFT, FINALIZED, ARCHIVED)
startDate=2026-01-01     (optional)
endDate=2026-12-31       (optional)
```

**Response:** (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "companyId": 1,
      "reportType": "BALANCE_SHEET",
      "reportDate": "2026-04-29T15:30:00Z",
      "periodStart": "2026-04-01T00:00:00Z",
      "periodEnd": "2026-04-30T00:00:00Z",
      "status": "DRAFT",
      "creator": {
        "id": 1,
        "name": "John Doe"
      },
      "finalizer": null
    }
  ],
  "count": 2
}
```

### GET `/api/dashboard/reports/:id`
Get report detail.

**Parameters:**
```
:id - Report ID (required)
```

**Response:** (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "companyId": 1,
    "reportType": "BALANCE_SHEET",
    "reportData": {
      "assets": { ... },
      "liabilities": { ... },
      "equity": { ... }
    },
    "status": "DRAFT",
    "creator": { ... }
  }
}
```

### POST `/api/dashboard/reports/:id/finalize`
Finalize financial report.

**Request Body:**
```json
{
  "finalizedBy": 2,
  "notes": "Laporan sudah direview"
}
```

**Response:** (200 OK)
```json
{
  "success": true,
  "message": "Report finalized successfully",
  "data": {
    "id": 1,
    "status": "FINALIZED",
    "finalizedBy": 2,
    "finalizedAt": "2026-04-29T16:00:00Z",
    "notes": "Laporan sudah direview"
  }
}
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Technical error details"
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Missing/invalid field |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permission |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal error |

### Common Error Messages

```json
{
  "success": false,
  "message": "Missing required fields",
  "error": "Missing fields: accountCode, accountName"
}
```

```json
{
  "success": false,
  "message": "Account code already exists",
  "error": "Duplicate account code"
}
```

```json
{
  "success": false,
  "message": "Can only update DRAFT transactions",
  "error": "Transaction status is POSTED"
}
```

```json
{
  "success": false,
  "message": "Cannot delete account with child accounts",
  "error": "Account has 3 child accounts"
}
```

---

## Authentication

Semua endpoint (kecuali `/api/auth/login`) memerlukan JWT token.

**Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

**Last Updated**: April 29, 2026
**Version**: 1.0.0
