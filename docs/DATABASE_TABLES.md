# Database Tables - Quick Reference

## 📊 12 Tables Overview

### Core Management (4 tables)
| Table | Fungsi | Key Fields |
|-------|--------|-----------|
| **companies** | Multi-tenant support | companyCode, companyName, fiscalYearStart |
| **users** | User & auth | email, password, role, companyId |
| **activity_logs** | Audit trail | userId, action, details |
| **_prisma_migrations** | Migration history | (auto-managed) |

### Booking System - LEGACY (2 tables)
| Table | Fungsi | Key Fields |
|-------|--------|-----------|
| **units** | Property data | name, location, price, status |
| **bookings** | Booking records | userId, unitId, status |

### Accounting System (6 tables)
| Table | Fungsi | Key Fields |
|-------|--------|-----------|
| **chart_of_accounts** | Account master | accountCode, accountName, accountType, parentId (hierarchy) |
| **transactions** | Financial transactions | transactionCode, debitAccountId, creditAccountId, amount, status |
| **journal_entries** | Journal header | journalNo, journalDate, isPosted, transactionId |
| **journal_entry_lines** | Journal detail lines | journalEntryId, accountId, debit, credit |
| **account_balances** | Period balances | accountId, periodDate, openingBalance, closingBalance |
| **financial_reports** | Generated reports | reportType (BALANCE_SHEET/INCOME_STATEMENT/CASH_FLOW), reportData (JSON) |

---

## 🔑 Field Patterns

### Chart of Accounts Hierarchy
```
Level 1: 1 (ASSET), 2 (LIABILITY), 3 (EQUITY), 4 (REVENUE), 5 (EXPENSE)
Level 2: 1.1 (Current Assets), 1.2 (Fixed Assets), etc.
Level 3: 1.1.01 (Cash), 1.1.02 (Bank), etc.
```

### Transaction Status Flow
```
DRAFT → PENDING → APPROVED → POSTED
            ↓
         REJECTED → DRAFT (re-edit)
```

### Amount Fields
- Type: `Decimal(15,2)` for precision
- Used in: transactions, journal_entry_lines, account_balances

---

## 📋 Record Counts (Current)
- **Chart of Accounts:** 39 (seeded)
- **Companies:** 1 (PT. PERUMAHAN INDONESIA)
- **Users:** Variable
- **Transactions:** Depends on entries
- **Journal Entries:** Auto-generated from approved transactions

---

## 🔗 Key Relationships

```
companies (1) ──┬─ users (many)
                ├─ chart_of_accounts (many)
                ├─ transactions (many)
                ├─ journal_entries (many)
                ├─ account_balances (many)
                └─ financial_reports (many)

transactions (1:1) ─── journal_entries
                          └── journal_entry_lines (many)

chart_of_accounts (1) ├─ children (self-join for hierarchy)
                      ├─ transactions (many) 
                      ├─ journal_entry_lines (many)
                      └─ account_balances (many)
```

---

## 💾 Total Size Estimate
- Schema: ~8 tables for financial system
- Indexes: accountType, companyId, transactionDate, status
- Constraints: Unique codes, referential integrity

---

**Last Updated:** April 30, 2026
