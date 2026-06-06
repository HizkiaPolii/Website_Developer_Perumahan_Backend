/**
 * Frontend-Backend API Compatibility Guide
 * Dokumentasi lengkap untuk kompatibilitas antara frontend dan backend
 * 
 * Path: docs/API_COMPATIBILITY.md
 */

# API Compatibility & Migration Guide

Panduan lengkap untuk memastikan kompatibilitas antara frontend dan backend API.

## 📋 Versioning

**Current Versions:**
- Backend API: v1.0.0
- Frontend Types: v1.0.0
- Minimum Node.js: 18.0.0
- Minimum Backend: 1.0.0

---

## 🔄 Breaking Changes

### Version History

#### v1.0.0 (Current)
- ✅ Initial release
- ✅ 23 API endpoints
- ✅ Chart of Accounts management
- ✅ Transaction processing with double-entry bookkeeping
- ✅ Financial reports generation
- ✅ Dashboard analytics
- ℹ️ No breaking changes (initial version)

---

## 🔗 API Endpoint Compatibility

### Authentication Endpoints

| Endpoint | Method | Status | Tested |
|----------|--------|--------|--------|
| `/api/auth/login` | POST | ✅ Active | ✅ Yes |
| `/api/auth/logout` | POST | ✅ Active | ✅ Yes |
| `/api/auth/me` | GET | ✅ Active | ✅ Yes |

### Chart of Accounts Endpoints

| Endpoint | Method | Status | Tested |
|----------|--------|--------|--------|
| `/api/chart-of-accounts` | GET | ✅ Active | ✅ Yes |
| `/api/chart-of-accounts/:id` | GET | ✅ Active | ✅ Yes |
| `/api/chart-of-accounts` | POST | ✅ Active | ✅ Yes |
| `/api/chart-of-accounts/:id` | PUT | ✅ Active | ✅ Yes |
| `/api/chart-of-accounts/:id` | DELETE | ✅ Active | ✅ Yes |
| `/api/chart-of-accounts/hierarchy/tree` | GET | ✅ Active | ✅ Yes |
| `/api/chart-of-accounts/type/:type` | GET | ✅ Active | ✅ Yes |

### Transaction Endpoints

| Endpoint | Method | Status | Tested |
|----------|--------|--------|--------|
| `/api/transactions` | GET | ✅ Active | ✅ Yes |
| `/api/transactions/:id` | GET | ✅ Active | ✅ Yes |
| `/api/transactions` | POST | ✅ Active | ✅ Yes |
| `/api/transactions/:id` | PUT | ✅ Active | ✅ Yes |
| `/api/transactions/:id` | DELETE | ✅ Active | ✅ Yes |
| `/api/transactions/:id/approve` | POST | ✅ Active | ✅ Yes |
| `/api/transactions/:id/reject` | POST | ✅ Active | ✅ Yes |
| `/api/transactions/batch/:batchId` | GET | ⏳ Phase 2 | ❌ No |

### Dashboard Endpoints

| Endpoint | Method | Status | Tested |
|----------|--------|--------|--------|
| `/api/dashboard/stats` | GET | ✅ Active | ✅ Yes |
| `/api/dashboard/recent-transactions` | GET | ✅ Active | ✅ Yes |
| `/api/dashboard/summary` | GET | ✅ Active | ✅ Yes |

### Financial Reports Endpoints

| Endpoint | Method | Status | Tested |
|----------|--------|--------|--------|
| `/api/dashboard/balance-sheet` | GET | ✅ Active | ✅ Yes |
| `/api/dashboard/income-statement` | GET | ✅ Active | ✅ Yes |
| `/api/dashboard/cash-flow` | GET | ✅ Active | ✅ Yes |
| `/api/dashboard/reconciliation` | GET | ✅ Active | ✅ Yes |
| `/api/dashboard/financial-ratios` | GET | ✅ Active | ✅ Yes |

---

## 📝 Request/Response Format Compatibility

### Standard Success Response

**Frontend Expectation:**
```typescript
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
```

**Backend Actual Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": 1,
    "name": "Example"
  }
}
```

✅ **Compatible:** Yes

---

### Paginated Response

**Frontend Expectation:**
```typescript
interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
```

**Backend Actual Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

✅ **Compatible:** Yes

---

### Error Response

**Frontend Expectation:**
```typescript
{
  success: false,
  message: "Error message",
  error?: "ERROR_CODE"
}
```

**Backend Actual Response (400):**
```json
{
  "success": false,
  "message": "Invalid request data",
  "error": "VALIDATION_ERROR"
}
```

✅ **Compatible:** Yes

---

### Authentication Error Response (401)

**Backend Response:**
```json
{
  "success": false,
  "message": "Unauthorized",
  "error": "UNAUTHORIZED"
}
```

**Frontend Action:**
- Clear token: `localStorage.removeItem('financial_system_token')`
- Redirect to login: `window.location.href = '/login'`

✅ **Compatible:** Yes

---

## 🔐 Authentication Compatibility

### Login Flow

**Frontend Request:**
```typescript
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Backend Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "Admin"
    }
  }
}
```

**Frontend Action:**
```typescript
localStorage.setItem('financial_system_token', response.data.token);
```

✅ **Compatible:** Yes

---

### Authorization Header Format

**Frontend Sends:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Backend Expects:**
```
Authorization: Bearer <token>
```

✅ **Compatible:** Yes

---

## 📊 Data Type Compatibility

### Transaction Status Values

**Frontend Expected:**
```typescript
type TransactionStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'POSTED';
```

**Backend Actual Values:**
```
DRAFT
PENDING
APPROVED
REJECTED
POSTED
```

✅ **Compatible:** Yes

---

### Account Type Values

**Frontend Expected:**
```typescript
type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
```

**Backend Actual Values:**
```
ASSET
LIABILITY
EQUITY
REVENUE
EXPENSE
```

✅ **Compatible:** Yes

---

### Date Format

**Frontend Expected:** ISO 8601 (YYYY-MM-DD)
```
2024-04-29
```

**Backend Sends:** ISO 8601 datetime
```
2024-04-29T10:30:00Z
```

**Frontend Action:**
```typescript
new Date('2024-04-29T10:30:00Z').toISOString().split('T')[0] // "2024-04-29"
```

✅ **Compatible:** Yes (with conversion)

---

### Currency Format

**Frontend Expected:** Number (no currency symbol)
```
1500000
```

**Backend Sends:** Number
```json
{
  "amount": 1500000
}
```

**Frontend Display:**
```typescript
formatCurrency(1500000, true) // "Rp 1.500.000"
```

✅ **Compatible:** Yes

---

## 🔍 Parameter Compatibility

### Pagination Parameters

**Frontend Sends:**
```
GET /api/transactions?companyId=1&page=1&limit=10
```

**Backend Expects:**
```typescript
{
  companyId: number;
  page?: number;  // Default: 1
  limit?: number; // Default: 10
}
```

✅ **Compatible:** Yes

---

### Filtering Parameters

**Frontend Sends:**
```
GET /api/transactions?companyId=1&status=APPROVED&from=2024-01-01&to=2024-04-29
```

**Backend Expected:**
```typescript
{
  companyId: number;
  status?: TransactionStatus;
  type?: TransactionType;
  category?: string;
  from?: string;  // ISO date YYYY-MM-DD
  to?: string;    // ISO date YYYY-MM-DD
  page?: number;
  limit?: number;
}
```

✅ **Compatible:** Yes

---

## 🛡️ Error Code Compatibility

### Common Error Codes

| Code | Status | Frontend Handling |
|------|--------|-------------------|
| `VALIDATION_ERROR` | 400 | Show field errors |
| `AUTHENTICATION_ERROR` | 401 | Redirect to login |
| `AUTHORIZATION_ERROR` | 403 | Show forbidden message |
| `NOT_FOUND_ERROR` | 404 | Show not found message |
| `CONFLICT_ERROR` | 409 | Show duplicate error |
| `SERVER_ERROR` | 500 | Show generic error |

---

## 🔄 Transaction Workflow Compatibility

### State Machine

**Expected Flow:**
```
DRAFT → (approve) → PENDING → (approve) → APPROVED → (post) → POSTED
     ↓
   (reject)
     ↓
   REJECTED → (re-edit) → DRAFT
```

**Frontend Validation:**
```typescript
canEditTransaction(status: TransactionStatus): boolean {
  return status === 'DRAFT';
}

canApproveTransaction(status: TransactionStatus): boolean {
  return status === 'DRAFT' || status === 'PENDING';
}
```

✅ **Compatible:** Yes

---

## 📦 Response Payload Compatibility

### Transaction Response

**Frontend Expected Structure:**
```typescript
{
  id: number;
  transactionCode: string;
  transactionDate: string;
  transactionType: TransactionType;
  description: string;
  debitAccountId: number;
  creditAccountId: number;
  amount: number;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
}
```

**Backend Actual Response:**
```json
{
  "id": 1,
  "companyId": 1,
  "userId": 1,
  "transactionCode": "TRX-20260429-00001",
  "transactionDate": "2024-04-29",
  "transactionType": "PENDAPATAN",
  "description": "Penjualan Produk",
  "debitAccountId": 5,
  "creditAccountId": 24,
  "amount": 1000000,
  "status": "DRAFT",
  "createdAt": "2024-04-29T10:30:00Z",
  "updatedAt": "2024-04-29T10:30:00Z"
}
```

✅ **Compatible:** Yes (extra fields ignored by frontend)

---

### Chart of Account Response

**Frontend Expected:**
```typescript
{
  id: number;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  level: AccountLevel;
}
```

**Backend Actual:**
```json
{
  "id": 1,
  "companyId": 1,
  "accountCode": "1.1.01",
  "accountName": "Kas",
  "accountType": "ASSET",
  "parentId": null,
  "level": 3,
  "isActive": true,
  "isCashFlow": true,
  "createdAt": "2024-04-26T09:00:43Z",
  "updatedAt": "2024-04-26T09:00:43Z"
}
```

✅ **Compatible:** Yes (extra fields ignored by frontend)

---

## 🚀 Deployment Compatibility

### Environment Variables

**Development:**
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

**Production:**
- Backend: `https://api.example.com`
- Frontend: `https://app.example.com`

**Frontend .env.production:**
```
VITE_API_URL=https://api.example.com
VITE_PROD_API_URL=https://api.example.com
```

✅ **Compatible:** Yes

---

## 🔗 CORS Compatibility

### Backend CORS Configuration

**Required Headers (Backend sends):**
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization
```

**Frontend CORS Request (with credentials):**
```typescript
fetch(url, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  credentials: 'include'
})
```

✅ **Compatible:** Yes

---

## 🧪 Testing Compatibility

### Test Data

**Default Test Account:**
- Email: `admin@example.com`
- Password: (check backend seed file)

**Default Company:** `PT. PERUMAHAN INDONESIA`

**Default Accounts:** 39 seeded Chart of Accounts

---

## ⚠️ Known Issues

### Issue #1: CORS Errors

**Symptoms:**
```
Access to XMLHttpRequest at 'http://localhost:5000' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Solution:**
- Ensure backend has CORS middleware enabled
- Check `app.use(cors())` in backend
- Verify correct API URL in frontend .env

---

### Issue #2: Token Undefined

**Symptoms:**
```
Authorization header: Bearer undefined
401 Unauthorized
```

**Solution:**
- Verify login response includes token
- Check localStorage saved correctly
- Test with browser DevTools: `localStorage.getItem('financial_system_token')`

---

### Issue #3: Date Formatting Issues

**Symptoms:**
```
Invalid date: 2024-04-29T10:30:00Z
```

**Solution:**
```typescript
// Correct way to parse ISO datetime
const date = new Date('2024-04-29T10:30:00Z');
const isoDate = date.toISOString().split('T')[0]; // "2024-04-29"
```

---

## 📞 Support & Troubleshooting

### Check API Health

**Frontend:**
```typescript
// Quick health check
const response = await fetch('http://localhost:5000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('financial_system_token')}`
  }
});

console.log('API Status:', response.status);
console.log('Response:', await response.json());
```

### Debug Network Requests

**Browser DevTools:**
1. Open Network tab (F12 → Network)
2. Perform API call
3. Check request headers and response
4. Look for CORS errors or auth failures

### Backend Logs

**Check Backend Server:**
```bash
cd backend
npm run dev
# Watch console for errors
```

---

## 🎯 Migration Checklist

When upgrading versions:

- [ ] Update backend dependencies
- [ ] Update frontend dependencies
- [ ] Test all endpoints with new version
- [ ] Verify response formats
- [ ] Check error codes
- [ ] Test authentication flow
- [ ] Test transaction workflow
- [ ] Verify pagination
- [ ] Check date/currency formatting
- [ ] Run full test suite
- [ ] Deploy to staging
- [ ] Run UAT
- [ ] Deploy to production

---

## 📞 Contact

For API compatibility issues:
1. Check this documentation
2. Review API Reference
3. Check Browser DevTools Network tab
4. Check Backend Console logs
5. Contact backend team if needed

---

**Last Updated:** April 2024
**API Version:** 1.0.0
**Frontend Types Version:** 1.0.0
