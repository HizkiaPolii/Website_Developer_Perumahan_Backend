# Agent Instructions — Backend Developer Perumahan (Housing Finance API)

## Project Overview

This is an **Express.js** backend API server for a Housing Company Financial Management System ("Sistem Pengelolaan Keuangan Perusahaan Perumahan"). It serves as the backend for a separate **Next.js frontend** running on `http://localhost:3000`.

The application provides RESTful APIs for:
- **Authentication** — JWT-based login, registration, and token verification
- **Chart of Accounts** — Hierarchical account structure (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE) with 4-level depth
- **Transactions** — Double-entry accounting with full lifecycle (DRAFT → PENDING → APPROVED/REJECTED → POSTED)
- **Journal Entries** — Auto-generated from posted transactions with debit/credit lines
- **Financial Reports** — Balance sheet, income statement generation, finalization, and archiving
- **Dashboard** — Financial statistics, recent transactions, and summary overviews
- **User Management** — CRUD with role-based access (admin, marketing, manager, owner)
- **Activity Logging** — System-wide audit trail for all user actions
- **Booking System (Legacy)** — Unit booking management (housing units)

## Tech Stack

| Layer         | Technology                          |
|---------------|-------------------------------------|
| Framework     | Express.js 5                        |
| Language      | TypeScript 6                        |
| Database      | PostgreSQL (via `pg` driver)        |
| ORM           | Prisma 6.19 (with `@prisma/adapter-pg`) |
| Auth          | JWT (`jsonwebtoken`) + bcrypt       |
| CORS          | `cors` package                      |
| Environment   | `dotenv`                            |
| Runtime       | Node.js (ts-node for dev)           |

## Project Structure

```
backend-developer-perumahan/
├── src/
│   ├── index.ts                          # App entry — Express setup, middleware, route mounting
│   ├── controllers/
│   │   ├── authController.ts             # Login, register, token verification
│   │   ├── userController.ts             # User CRUD operations
│   │   ├── chartOfAccountsController.ts  # CoA CRUD + hierarchy + filter by type
│   │   ├── transactionController.ts      # Transaction CRUD + approve/reject/post workflow
│   │   ├── dashboardController.ts        # Financial stats, recent txns, summary
│   │   ├── financialReportController.ts  # Balance sheet & income statement generation
│   │   ├── activityLogController.ts      # Activity log queries
│   │   ├── bookingController.ts          # Booking CRUD (legacy)
│   │   └── unitController.ts             # Unit CRUD (legacy)
│   ├── routes/
│   │   ├── index.ts                      # Base route (unused, routes mounted in index.ts)
│   │   ├── auth.ts                       # /api/auth/*
│   │   ├── users.ts                      # /api/users/*
│   │   ├── chartOfAccounts.ts            # /api/chart-of-accounts/*
│   │   ├── transactions.ts               # /api/transactions/*
│   │   ├── dashboard.ts                  # /api/dashboard/* (includes financial reports)
│   │   ├── activityLog.ts                # /api/activity-logs/*
│   │   ├── bookings.ts                   # /api/bookings/* (legacy)
│   │   └── units.ts                      # /api/units/* (legacy)
│   ├── middleware/
│   │   └── auth.ts                       # JWT auth middleware (Bearer token extraction)
│   ├── services/
│   │   └── api-client.ts                 # API client utilities
│   ├── types/
│   │   └── financial-system.ts           # TypeScript interfaces & types
│   └── utils/
│       ├── database.ts                   # Prisma client singleton (PrismaPg adapter)
│       ├── activityLogger.ts             # Activity logging helper functions
│       └── financial-constants.ts        # Financial constants and configurations
├── prisma/
│   ├── schema.prisma                     # Database schema (all models)
│   ├── prisma.config.ts                  # Prisma configuration
│   └── migrations/                       # Migration history
│       ├── 20260426090043_init/
│       ├── 20260427123919_add_phone_field/
│       └── 20260429065955_add_financial_accounting_system/
├── seed.ts                               # Database seeder
├── seed-chart-of-accounts.ts             # CoA seeder with full account hierarchy
├── migrate-passwords.ts                  # Password migration utility (plaintext → bcrypt)
├── test-api.ts                           # API test script
├── test-db.ts                            # Database connection test
├── view-coa-balances.ts                  # Utility to view CoA balances
├── package.json
├── tsconfig.json
├── .env / .env.example
└── API_REFERENCE.md                      # Full API documentation
```

## Architecture & Patterns

### Layered Architecture
The project follows a simple **Controller → Prisma** pattern:
- **Routes** define URL paths and apply middleware
- **Controllers** contain all business logic and database queries (via Prisma)
- **Middleware** handles cross-cutting concerns (auth)
- **Utils** provide shared helpers (database client, activity logging)

> **Note:** There is no dedicated service layer. Controllers interact directly with the Prisma client.

### Authentication Flow
1. Client sends `POST /api/auth/login` with `{ email, password }`
2. Server validates credentials using `bcrypt.compare()`
3. On success, generates JWT token with payload: `{ id, email, role }`
4. Token expires based on `JWT_EXPIRE` env var (default: `7d`)
5. Protected routes use `authMiddleware` which:
   - Extracts token from `Authorization: Bearer <token>` header
   - Verifies token with `jwt.verify()`
   - Attaches decoded user to `req.user`
   - Returns 401 if token is missing or invalid

### Database Access
- **Singleton Prisma Client** exported from `src/utils/database.ts`
- Uses `@prisma/adapter-pg` (PrismaPg) for PostgreSQL connection
- All controllers import `prisma` from `../utils/database`
- Connection string from `DATABASE_URL` environment variable

### Activity Logging
- All significant actions are logged via `logActivity(userId, action, details)`
- Logged to `activity_logs` table in database
- Helper `createActivityDetails()` formats structured details per action type
- Logging failures are caught silently — they don't break the main operation

### Transaction Lifecycle
```
DRAFT → PENDING → APPROVED → POSTED (with JournalEntry)
                 → REJECTED
```
- **DRAFT**: Editable and deletable
- **PENDING**: Submitted for approval
- **APPROVED**: Approved by manager/owner, ready to post
- **REJECTED**: Rejected with reason, can be revised
- **POSTED**: Creates a `JournalEntry` with debit/credit `JournalEntryLine`s

### Response Format
All API responses follow this standard structure:
```typescript
// Success
{ success: true, message?: string, data: any, count?: number, pagination?: object }

// Error
{ success: false, message: string, error?: string }
```

## Database Schema

### Models & Table Mappings

| Model              | Table Name            | Purpose                              |
|--------------------|-----------------------|--------------------------------------|
| Company            | `companies`           | Company/organization management      |
| User               | `users`               | User accounts with roles             |
| ActivityLog        | `activity_logs`       | Audit trail for user actions         |
| Unit               | `units`               | Housing units (legacy)               |
| Booking            | `bookings`            | Unit bookings (legacy)               |
| ChartOfAccounts    | `chart_of_accounts`   | Hierarchical account structure       |
| Transaction        | `transactions`        | Financial transactions               |
| JournalEntry       | `journal_entries`     | General journal entries              |
| JournalEntryLine   | `journal_entry_lines` | Journal entry debit/credit lines     |
| AccountBalance     | `account_balances`    | Period-based account balances        |
| FinancialReport    | `financial_reports`   | Generated financial reports          |

### Key Enumerations (stored as strings)

```typescript
// Account types
type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

// Account levels (1=category, 2=subcategory, 3=detail, 4=sub-detail)
type AccountLevel = 1 | 2 | 3 | 4;

// Transaction types
type TransactionType = 'PENDAPATAN' | 'PENGELUARAN' | 'TRANSFER' | 'ADJUSTMENT';

// Transaction statuses
type TransactionStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'POSTED';

// Report types
type ReportType = 'BALANCE_SHEET' | 'INCOME_STATEMENT' | 'CASH_FLOW';

// Report statuses
type ReportStatus = 'DRAFT' | 'FINALIZED' | 'ARCHIVED';

// User roles
type Role = 'admin' | 'marketing' | 'manager' | 'owner' | 'user';

// Account balance period types
type PeriodType = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
```

### Important Relationships
- **ChartOfAccounts** has a self-referencing hierarchy (`parent`/`children` via `AccountHierarchy`)
- **Transaction** links to two accounts: `debitAccount` and `creditAccount`
- **Transaction** → **JournalEntry** is 1:1 (created when transaction is POSTED)
- **JournalEntry** → **JournalEntryLine** is 1:many (debit/credit lines)
- **User** has dual relations to Transaction: `transactions` (creator) and `approvedTransactions` (approver)
- All financial entities are scoped by `companyId`
- Monetary values use `Decimal(15, 2)` precision

## API Endpoints

### Route Mounting (from `src/index.ts`)

| Prefix                    | Route File                      | Auth Required |
|---------------------------|---------------------------------|:---:|
| `/api/health`             | Inline handler                  | ❌  |
| `/api/auth`               | `routes/auth.ts`                | Partial (login/register: ❌, verify: ✅) |
| `/api/users`              | `routes/users.ts`               | ✅  |
| `/api/activity-logs`      | `routes/activityLog.ts`         | ✅  |
| `/api/bookings`           | `routes/bookings.ts`            | ✅  |
| `/api/units`              | `routes/units.ts`               | ✅  |
| `/api/chart-of-accounts`  | `routes/chartOfAccounts.ts`     | ✅  |
| `/api/transactions`       | `routes/transactions.ts`        | ✅  |
| `/api/dashboard`          | `routes/dashboard.ts`           | ✅  |

### Auth
- `POST /api/auth/login` — Login with email/password → returns JWT token + user
- `POST /api/auth/register` — Register new user (email, name, password, role)
- `GET  /api/auth/profile` — Get current user profile (requires auth)

### Users
- `GET    /api/users` — List all users
- `GET    /api/users/:id` — Get user by ID
- `POST   /api/users` — Create user
- `PUT    /api/users/:id` — Update user
- `DELETE /api/users/:id` — Delete user

### Chart of Accounts
- `GET    /api/accounts` — List all (with `companyId`, `accountType`, `isActive`, `parentId` filters)
- `GET    /api/accounts/:id` — Get by ID (includes children, debit/credit transactions)
- `POST   /api/accounts` — Create account
- `PUT    /api/accounts/:id` — Update account
- `DELETE /api/accounts/:id` — Delete (validates no children or transactions)
- `GET    /api/accounts/hierarchy` — Get full tree structure (`companyId` required)
- `GET    /api/accounts/by-type/:type` — Filter by account type

### Transactions
- `GET    /api/transactions` — List (paginated, filterable by status/type/category/date range)
- `GET    /api/transactions/:id` — Get by ID (includes journal entry details)
- `POST   /api/transactions` — Create (starts as DRAFT)
- `PUT    /api/transactions/:id` — Update (DRAFT only)
- `DELETE /api/transactions/:id` — Delete (DRAFT only)
- `POST   /api/transactions/:id/approve` — Approve (PENDING → APPROVED)
- `POST   /api/transactions/:id/reject` — Reject with reason (PENDING → REJECTED)
- `POST   /api/transactions/:id/post` — Post to journal (APPROVED → POSTED, creates JournalEntry)

### Dashboard
- `GET /api/dashboard/stats` — Financial statistics (revenue, expense, profit, cash balance)
- `GET /api/dashboard/recent-transactions` — Recent transactions list
- `GET /api/dashboard/summary` — Comprehensive summary (stats + pending + balances by type)

### Financial Reports
- `POST /api/dashboard/reports/balance-sheet/generate` — Generate balance sheet
- `POST /api/dashboard/reports/income-statement/generate` — Generate income statement
- `GET  /api/dashboard/reports` — List all reports (filterable by type/status/date)
- `GET  /api/dashboard/reports/:id` — Get report detail with full report data
- `PUT  /api/dashboard/reports/:id` — Update report (DRAFT only)
- `POST /api/dashboard/reports/:id/finalize` — Finalize a report

> **Note:** Some report routes have shortcut aliases for frontend compatibility (e.g., `POST /api/dashboard/balance-sheet` also calls `generateBalanceSheet`).

### Activity Logs
- `GET /api/activity-logs` — List activity logs with pagination and filters

### Units (Legacy)
- `GET    /api/units` — List all units
- `GET    /api/units/:id` — Get unit by ID
- `POST   /api/units` — Create unit
- `PUT    /api/units/:id` — Update unit
- `DELETE /api/units/:id` — Delete unit

### Bookings (Legacy)
- `GET    /api/bookings` — List all bookings
- `GET    /api/bookings/:id` — Get booking by ID
- `POST   /api/bookings` — Create booking
- `PUT    /api/bookings/:id/status` — Update booking status
- `DELETE /api/bookings/:id` — Delete booking

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/perumahan_db"

# Server
PORT=5000
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:3000"

# JWT (used in auth controller & middleware)
JWT_SECRET="your-secret-key"    # Signing secret for JWT tokens
JWT_EXPIRE="7d"                 # Token expiration duration
```

## Development

### Running the App
```bash
npm run dev                     # Start dev server with ts-node (http://localhost:5000)
npm run build                   # Compile TypeScript to dist/
npm start                       # Run production build from dist/
```

### Prisma Commands
```bash
npm run prisma:generate         # Generate Prisma Client from schema
npm run prisma:migrate          # Create and run migrations
npm run prisma:studio           # Open Prisma Studio GUI
```

### Seed Scripts
```bash
npm run seed:chart-of-accounts  # Seed full chart of accounts hierarchy
npx ts-node seed.ts             # Run general database seeder
```

### Utility Scripts
```bash
npx ts-node test-db.ts          # Test database connection
npx ts-node test-api.ts         # Test API endpoints
npx ts-node view-coa-balances.ts # View chart of accounts balances
npx ts-node migrate-passwords.ts # Migrate plaintext passwords to bcrypt hashes
```

## Conventions & Guidelines

### Code Style
- Controllers are written as **async arrow functions** exported individually
- All routes use `express.Router()` and are mounted in `src/index.ts`
- `authMiddleware` is applied at the router level (all routes in a file), not per-route
- Indonesian language used in user-facing messages (e.g., "Email atau password salah")
- English used in code identifiers and comments

### Adding New Routes
1. Create a controller file in `src/controllers/` with exported handler functions
2. Create a route file in `src/routes/` that imports the controller and sets up routes
3. Mount the router in `src/index.ts` with `app.use("/api/<path>", routeModule)`
4. Apply `authMiddleware` at the router level if the routes require authentication

### Adding New Database Models
1. Add the model to `prisma/schema.prisma` with `@@map("table_name")` for the table mapping
2. Run `npm run prisma:migrate` to create the migration
3. Run `npm run prisma:generate` to regenerate the Prisma client
4. Create the corresponding controller, route, and type files

### Error Handling
- Controllers wrap logic in try/catch blocks
- Validation errors return `400` with descriptive messages
- Auth failures return `401`
- Not found returns `404`
- Server errors return `500` with generic message
- A global error handler is defined in `src/index.ts`
- `unhandledRejection` and `uncaughtException` handlers are registered

### Financial Calculations
- All monetary values use `Decimal(15, 2)` precision in the database
- Double-entry accounting: every transaction has a debit account and credit account
- Journal entries must balance (total debits = total credits)
- Account balances track opening/closing balance + debit/credit totals per period

## Frontend Integration

This backend serves the **Pengelolaan-Perusahaan** Next.js frontend application:
- Frontend runs on `http://localhost:3000`
- Backend runs on `http://localhost:5000`
- CORS is configured to accept requests from `FRONTEND_URL`
- All API responses use `{ success, message, data }` format for consistent parsing
- `companyId` is sent as a query parameter or in the request body by the frontend
