# Development Document
## School Management System (SMS)

**Version:** 1.0  
**Date:** 2026-08-30  
**Status:** Draft  

---

## 1. Introduction

### 1.1 Purpose
This Development Document provides a comprehensive technical guide for developers working on the School Management System (SMS). It covers environment setup, project structure, coding conventions, API standards, database management, testing strategy, Git workflow, CI/CD pipeline, and a phased sprint plan.

### 1.2 Audience
- Frontend developers
- Backend developers
- DevOps/infrastructure engineers
- QA engineers
- Technical project leads

---

## 2. Development Environment Setup

### 2.1 Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20 LTS | Backend runtime |
| npm | 10+ | Package management |
| MongoDB | 7 (Community Edition) | Document database |
| Git | 2.40+ | Version control |
| PM2 | Latest | Node.js process manager (for running the API) |
| VS Code (recommended) | Latest | IDE |

### 2.2 Recommended VS Code Extensions
- ESLint
- Prettier – Code Formatter
- MongoDB for VS Code (official extension — browse collections, run queries)
- Tailwind CSS IntelliSense
- GitLens
- REST Client (for `.http` API testing files)
- DotENV

### 2.3 Local Setup

Everything runs directly on your machine — no Docker needed.

```bash
# 1. Clone the repository
git clone https://github.com/your-org/school-management-system.git
cd school-management-system

# 2. Start MongoDB (Windows — run as Administrator if needed)
net start MongoDB
# On macOS: brew services start mongodb-community
# On Linux: sudo systemctl start mongod

# 3. Setup and start the Backend API
cd backend
npm install
cp .env.example .env   # Open .env and fill in your values (see Section 2.5)
npm run db:seed        # Seed roles, default admin user, and sample data
npm run dev            # Starts on http://localhost:5000 (with auto-restart via nodemon)

# 4. Setup and start the Frontend (open a new terminal)
cd ../frontend
npm install
cp .env.example .env
npm run dev            # Starts on http://localhost:3000
```

**Access the app:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- MongoDB: Connect via MongoDB Compass at `mongodb://localhost:27017/sms_dev`



### 2.5 Environment Variables

**Backend (`backend/.env`):**
```env
# Database
MONGODB_URI="mongodb://localhost:27017/sms_dev"
# For MongoDB Atlas: MONGODB_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net/sms_dev?retryWrites=true&w=majority"
MONGODB_DB_NAME="sms_dev"

# JWT
JWT_SECRET="your-very-long-random-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="another-very-long-random-secret"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN="http://localhost:3000"

# SMS Gateway (Twilio)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+923xxxxxxxxx"

# WhatsApp (Twilio)
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"

# File Storage
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE_MB=10
```

**Frontend (`frontend/.env`):**
```env
VITE_API_BASE_URL="http://localhost:5000/api/v1"
VITE_APP_NAME="School Management System"
```

---

## 3. Project Structure

### 3.1 Repository Structure (Monorepo)

```
school-management-system/
├── backend/                    # Node.js + Express API
├── frontend/                   # React + Vite SPA
├── docs/                       # Project documentation (PRD, SRS, etc.)
├── .github/                    # GitHub Actions CI/CD workflows
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
└── README.md
```

### 3.2 Backend Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Mongoose connection setup
│   │   ├── env.js               # Validated env vars (zod)
│   │   └── constants.js         # App-wide constants
│   ├── models/                  # Mongoose schemas & models
│   │   ├── User.model.js
│   │   ├── Student.model.js
│   │   ├── Staff.model.js
│   │   ├── Class.model.js
│   │   ├── Subject.model.js
│   │   ├── AcademicYear.model.js
│   │   ├── TimetableEntry.model.js
│   │   ├── StudentAttendance.model.js
│   │   ├── StaffAttendance.model.js
│   │   ├── Exam.model.js
│   │   ├── Grade.model.js
│   │   ├── FeeStructure.model.js
│   │   ├── StudentFee.model.js
│   │   ├── Payment.model.js
│   │   ├── PayrollRecord.model.js
│   │   ├── LeaveRequest.model.js
│   │   ├── NotificationLog.model.js
│   │   └── AuditLog.model.js
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT verification
│   │   ├── rbac.middleware.js   # Role/permission guard
│   │   ├── error.middleware.js  # Global error handler
│   │   ├── validate.middleware.js # Request validation
│   │   └── logger.middleware.js # Request logging (morgan)
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   └── auth.service.js
│   │   ├── users/
│   │   ├── students/
│   │   ├── classes/
│   │   ├── subjects/
│   │   ├── timetable/
│   │   ├── attendance/
│   │   ├── grades/
│   │   ├── report-cards/
│   │   ├── finance/
│   │   ├── hr/
│   │   ├── payroll/
│   │   ├── notifications/
│   │   └── reports/
│   ├── jobs/
│   │   ├── scheduler.js         # node-cron job runner
│   │   ├── fee-reminder.job.js
│   │   ├── attendance-summary.job.js
│   │   └── payroll-notify.job.js
│   ├── utils/
│   │   ├── pdf.util.js          # PDF generation helper
│   │   ├── excel.util.js        # Excel export helper
│   │   ├── sms.util.js          # SMS sending helper
│   │   ├── whatsapp.util.js     # WhatsApp sending helper
│   │   ├── pagination.util.js   # Pagination helpers
│   │   └── audit-log.util.js   # Audit log writer
│   ├── validators/
│   │   ├── student.validator.js
│   │   ├── grade.validator.js
│   │   └── ...
│   ├── app.js                   # Express app setup
│   └── server.js                # Server entry point
├── src/
│   └── ...
├── seed/
│   └── seed.js                  # Database seeder (Mongoose-based)
├── uploads/                     # Local file storage (gitignored)
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── package.json
└── jest.config.js
```

### 3.3 Frontend Structure

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/
│   │   ├── images/
│   │   └── fonts/
│   ├── components/              # Shared, reusable UI components
│   │   ├── ui/                  # Base: Button, Input, Modal, Table, Badge...
│   │   ├── layout/              # AppShell, Sidebar, Header, Breadcrumb
│   │   └── common/              # DataTable, StatCard, PageHeader, EmptyState
│   ├── features/                # Feature modules (collocated)
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   └── useAuth.js
│   │   ├── students/
│   │   │   ├── StudentListPage.jsx
│   │   │   ├── StudentProfilePage.jsx
│   │   │   ├── StudentFormPage.jsx
│   │   │   ├── useStudents.js   # React Query hooks
│   │   │   └── students.api.js  # Axios calls
│   │   ├── attendance/
│   │   ├── grades/
│   │   ├── finance/
│   │   ├── hr/
│   │   ├── reports/
│   │   └── notifications/
│   ├── hooks/                   # Shared custom hooks
│   │   ├── useDebounce.js
│   │   ├── usePagination.js
│   │   └── usePermission.js
│   ├── lib/
│   │   ├── axios.js             # Axios instance + interceptors
│   │   ├── formatters.js        # Date, currency, number formatters
│   │   └── validators.js        # Client-side validation helpers
│   ├── routes/
│   │   ├── index.jsx            # Root router
│   │   ├── ProtectedRoute.jsx   # Auth guard
│   │   └── RoleRoute.jsx        # RBAC guard
│   ├── store/
│   │   ├── authStore.js         # Zustand: current user, token
│   │   └── uiStore.js           # Zustand: sidebar state, theme
│   ├── types/                   # JSDoc typedefs (or TypeScript .d.ts)
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## 4. Coding Standards

### 4.1 General
- **Language:** JavaScript (ES2022+) with JSDoc annotations. TypeScript migration planned for v2.0.
- **Linting:** ESLint with Airbnb config + Prettier for formatting.
- **Line length:** 100 characters max.
- **Quotes:** Single quotes (`'`) in JS; double quotes in JSX attributes.
- **Semicolons:** Omitted (Prettier configured with `semi: false`).
- All files must end with a newline.

### 4.2 Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Variables / functions | `camelCase` | `studentList`, `getAttendance` |
| React components | `PascalCase` | `StudentListPage`, `DataTable` |
| Files (components) | `PascalCase.jsx` | `StudentListPage.jsx` |
| Files (utils/hooks) | `camelCase.js` | `useStudents.js`, `pdf.util.js` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE_MB` |
| Database collections | `camelCase` (Mongoose convention) | `studentAttendance`, `feeStructures` |
| API routes | `kebab-case` | `/api/v1/student-fees` |
| Environment vars | `UPPER_SNAKE_CASE` | `JWT_SECRET` |

### 4.3 Backend Standards
- All async route handlers must be wrapped in `try-catch` or use an `asyncHandler` wrapper.
- Business logic belongs in the **service layer** — controllers must remain thin.
- Never put raw query logic in controllers; all DB access goes through repositories using Mongoose models.
- All Mongoose queries must use typed schemas; avoid using the `lean()` shortcut unless necessary for performance.
- Always return consistent response shapes (see API conventions below).

### 4.4 Frontend Standards
- Components must be **functional** (no class components).
- All data fetching via **React Query** (`useQuery`, `useMutation`).
- No direct `localStorage` usage for auth tokens (use in-memory state).
- Use `useCallback` and `useMemo` only when profiling identifies a real performance issue.
- Avoid prop drilling beyond 2 levels — use Zustand or React Context.
- Every page component includes a `<title>` update (via `react-helmet-async`).

---

## 5. API Design Conventions

### 5.1 Base URL
```
/api/v1/
```

### 5.2 HTTP Methods

| Method | Usage |
|---|---|
| GET | Read/list resources |
| POST | Create a new resource |
| PUT | Full update of a resource |
| PATCH | Partial update of a resource |
| DELETE | Soft-delete a resource |

### 5.3 URL Patterns

```
GET    /api/v1/students              # List all students (paginated)
POST   /api/v1/students              # Create new student
GET    /api/v1/students/:id          # Get student by ID
PUT    /api/v1/students/:id          # Update student
DELETE /api/v1/students/:id          # Soft-delete student
GET    /api/v1/students/:id/grades   # Nested: student's grades
POST   /api/v1/students/import       # Bulk import
```

### 5.4 Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 340,
    "totalPages": 14
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "guardian_phone", "message": "Must be a valid phone number" }
    ]
  }
}
```

### 5.5 HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | Success (GET, PUT, PATCH) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (valid token, insufficient permissions) |
| 404 | Resource Not Found |
| 409 | Conflict (duplicate record) |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |

### 5.6 Pagination Parameters
```
GET /api/v1/students?page=1&limit=25&sort=full_name&order=asc&search=ahmed&class_id=uuid
```

### 5.7 Authentication Headers
```
Authorization: Bearer <access_token>
```

---

## 6. Database Management

### 6.1 Mongoose Connection Setup

Mongoose connects to MongoDB once at application startup:

```js
// src/config/database.js
const mongoose = require('mongoose')

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 20,          // Max simultaneous connections
    serverSelectionTimeoutMS: 5000,
  })
  console.log(`MongoDB connected: ${conn.connection.host}`)
}

module.exports = connectDB
```

Call `connectDB()` in `server.js` before starting the HTTP server.

### 6.2 Schema Definition with Mongoose

Each collection has a dedicated Mongoose Schema in `src/models/`:

```js
// src/models/Student.model.js
const mongoose = require('mongoose')

const guardianSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  phone:        { type: String, required: true },
  relationship: { type: String },
})

const studentSchema = new mongoose.Schema({
  studentId:  { type: String, required: true, unique: true },
  fullName:   { type: String, required: true },
  dob:        { type: Date, required: true },
  gender:     { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  classId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  sectionId:  { type: mongoose.Schema.Types.ObjectId, required: true },
  guardian:   { type: guardianSchema, required: true },
  bloodGroup: { type: String },
  address:    { type: String },
  isActive:   { type: Boolean, default: true },
  deletedAt:  { type: Date, default: null },
}, {
  timestamps: true,   // adds createdAt, updatedAt automatically
})

// Define indexes
studentSchema.index({ classId: 1, sectionId: 1 })

module.exports = mongoose.model('Student', studentSchema)
```

**Key Mongoose Schema Rules:**
- All models use `{ timestamps: true }` for automatic `createdAt`/`updatedAt`.
- Soft-delete with `deletedAt: null` (active) vs. timestamp (deleted).
- All cross-collection references use `mongoose.Schema.Types.ObjectId` with `ref`.
- Embedded sub-documents (e.g., guardian, timetable entries) are nested schemas.
- Enums are enforced via the `enum` validator.
- Never use `mongoose.Schema({}, { strict: false })` — always enforce strict mode.

### 6.3 Schema Migrations

MongoDB is schemaless at the database level; Mongoose enforces structure at the application layer.  
For **breaking schema changes** (renaming fields, restructuring embedded documents), use a migration script:

```bash
# Run a one-time migration script
node scripts/migrations/2026-09-rename-guardian-fields.js
```

Migration scripts are stored in `scripts/migrations/`, named with a date prefix, and tracked in a `_migrations` collection to prevent double-runs:

```js
// Pattern for a migration script
const mongoose = require('mongoose')
const connectDB = require('../../src/config/database')

async function run() {
  await connectDB()
  // Example: rename field 'guardianName' → 'guardian.name'
  await mongoose.connection.collection('students').updateMany(
    { guardianName: { $exists: true } },
    [{ $set: { 'guardian.name': '$guardianName' } }, { $unset: 'guardianName' }]
  )
  console.log('Migration complete')
  process.exit(0)
}
run()
```

### 6.4 Seed Data

The seed script (`seed/seed.js`) initializes:
- Default roles: `super_admin`, `teacher`, `student`, `accountant`, `hr_manager` with their permissions arrays.
- Default super admin user (username: `admin`, password: `Admin@1234` — must be changed immediately).
- Sample academic year and term.

```bash
npm run db:seed
```

### 6.5 Index Management

Indexes are defined in Mongoose schemas (see Section 6.2) and auto-created on application startup. To create or review indexes manually:

```js
// In MongoDB shell or Compass
db.students.getIndexes()
db.studentAttendance.createIndex({ studentId: 1, date: 1 })
db.grades.createIndex({ studentId: 1, examId: 1 })
db.users.createIndex({ username: 1 }, { unique: true })
```

| Collection | Index Fields | Type | Reason |
|---|---|---|---|
| `users` | `username` | Unique | Login lookup |
| `students` | `studentId` | Unique | ID lookup |
| `students` | `classId`, `sectionId` | Compound | Class roster |
| `studentAttendance` | `studentId`, `date` | Compound | Per-student history |
| `studentAttendance` | `classId`, `date` | Compound | Daily class attendance |
| `grades` | `studentId`, `examId` | Compound | Grade lookup |
| `studentFees` | `studentId`, `status` | Compound | Fee status filter |
| `payments` | `studentFeeId` | Single | Payment history |
| `payrollRecords` | `staffId`, `month`, `year` | Compound | Payroll lookup |
| `auditLogs` | `userId`, `timestamp` | Compound | Audit queries |

---

## 7. Testing Strategy

### 7.1 Testing Pyramid

```
         /\
        /E2E\         (Cypress — critical user flows)
       /──────\
      /Integr. \      (Supertest — API route + DB)
     /──────────\
    / Unit Tests \    (Jest — services, utils, validators)
   /______________\
```

### 7.2 Unit Tests (Jest)
- Test all **service layer** functions in isolation.
- Mock Mongoose models using `jest.mock()` or `mongoose-mock` to avoid hitting the real DB.
- Test all **utility functions** (formatters, validators, PDF generator stubs).
- Coverage target: **≥ 80%** on service and utility files.

```bash
# Run all unit tests
npm test

# Run with coverage report
npm run test:coverage

# Watch mode during development
npm run test:watch
```

### 7.3 Integration Tests (Supertest)
- Test complete API request-response cycles.
- Use **`mongodb-memory-server`** (an in-memory MongoDB instance) — no external DB required.
- Seed a clean database state before each test suite using `beforeEach`/`afterEach` hooks.
- Test all CRUD endpoints for each module.
- Test authentication and RBAC (unauthorized and forbidden scenarios).

```bash
npm run test:integration
```

### 7.4 End-to-End Tests (Cypress)
Key flows to cover:
- Login and logout.
- Register a new student → assign to class → view profile.
- Teacher marks attendance → verify guardian notification logged.
- Enter grades → generate report card → download PDF.
- Record fee payment → verify balance update.
- Create announcement → verify notification center.

```bash
# Run Cypress in headless mode (CI)
npm run test:e2e

# Open Cypress interactive runner
npm run cypress:open
```

### 7.5 Manual / UAT Testing
Conducted in the **Staging** environment before each production release:
- School admin staff follow test scripts covering all core workflows.
- Bug reports logged in the issue tracker with severity classification.
- Sign-off required from designated school representative before production deployment.

---

## 8. Git Workflow

### 8.1 Branching Strategy (Git Flow)

```
main          ─── Production-ready code (protected; no direct push)
develop       ─── Integration branch for completed features
feature/*     ─── Feature development branches
bugfix/*      ─── Bug fix branches
hotfix/*      ─── Emergency production fixes (branch from main)
release/*     ─── Pre-release stabilization
```

### 8.2 Branch Naming

```
feature/student-enrollment-form
feature/fee-payment-recording
bugfix/attendance-duplicate-entry
hotfix/grade-calculation-error
```

### 8.3 Commit Message Convention (Conventional Commits)

```
<type>(<scope>): <short description>

Types: feat | fix | docs | style | refactor | test | chore | perf

Examples:
feat(students): add bulk CSV import endpoint
fix(grades): prevent marks exceeding max_marks
test(finance): add payment recording integration tests
docs(api): update student endpoints documentation
chore(deps): upgrade prisma to 5.14.0
```

### 8.4 Pull Request (PR) Process
1. Developer creates a feature/bugfix branch from `develop`.
2. Commits work with conventional commit messages.
3. Pushes branch and opens a Pull Request to `develop`.
4. PR checklist:
   - [ ] Code follows coding standards
   - [ ] All new code is covered by tests
   - [ ] All tests pass locally
   - [ ] No console.log statements left
   - [ ] Environment variables documented in `.env.example`
5. At least **1 peer review approval** required before merge.
6. CI pipeline must pass (lint + tests) before merge is allowed.
7. Merge via **Squash and Merge** to keep clean history on `develop`.

---

## 9. CI/CD Pipeline

### 9.1 CI Pipeline (GitHub Actions — triggered on every PR)

The CI pipeline runs automated checks on every pull request. No Docker required — tests run natively using Node.js.

```yaml
# .github/workflows/ci.yml (summary)
jobs:
  lint:
    - Checkout code
    - Install Node.js 20
    - Install dependencies (backend + frontend)
    - Run ESLint on both

  test-backend:
    - Install Node.js 20
    - Install backend dependencies
    - Run Jest unit + integration tests
      (mongodb-memory-server spins up an in-memory MongoDB — no external DB needed)
    - Upload coverage report

  test-frontend:
    - Install Node.js 20
    - Install frontend dependencies
    - Run Vitest unit tests
    - Run Cypress component tests

  build-check:
    - Run `npm run build` on the frontend to confirm it compiles without errors
```

### 9.2 CD Pipeline — Deployment to Server (SSH-based)

When code is merged to `main`, a GitHub Actions workflow SSH's into the server and runs the update:

```yaml
# .github/workflows/deploy.yml (summary)
on:
  push:
    branches: [main]

jobs:
  deploy:
    - SSH into the production server (using a stored SSH key secret)
    - Pull latest code: git pull origin main
    - Backend: npm install --production && pm2 restart sms-api
    - Frontend: npm install && npm run build
    - Nginx picks up the new frontend build automatically
```

**CD Flow Diagram:**
```
Push / Merge to main
        │
        ▼
GitHub Actions CI passes (lint + tests)
        │
        ▼
SSH into Production Server
        │
        ├── git pull origin main
        ├── cd backend → npm install --production → pm2 restart sms-api
        └── cd frontend → npm run build  (Nginx serves updated files)
        │
        ▼
Run migration scripts (if any schema changes)
        │
        ▼
Health check (GET /api/v1/health → 200)
        │
        ▼
Notify team via Slack/Email
```

> **Tip:** For staging, use a separate branch (e.g., `staging`) and a separate server. The same GitHub Actions workflow can deploy to staging on merge to `staging` and to production on merge to `main`.

---

## 10. Performance Guidelines

### 10.1 Backend
- Use **projection** in Mongoose queries to return only needed fields: `.select('fullName classId guardian.phone')`.
- Use `.lean()` on read-only queries that don't need Mongoose document methods (returns plain JS objects, faster).
- Use database **indexes** on all frequently-filtered and referenced fields (see Section 6.5).
- Paginate all list endpoints (default: 25 records, max: 100) using `.skip()` and `.limit()`.
- Use **aggregation pipelines** for complex reports rather than fetching data and processing in JS.
- Generate large reports (PDFs, Excel) **asynchronously** — return a job ID, poll for completion.
- Cache frequently-read reference data (class list, subject list) in memory with a short TTL (5 min).

### 10.2 Frontend
- Use React Query's `staleTime` and `cacheTime` to prevent redundant API calls.
- Lazy-load routes using `React.lazy()` and `Suspense`.
- Virtualize long lists (> 200 rows) using `@tanstack/react-virtual`.
- Use `debounce` (300ms) on search inputs to limit API calls.
- Compress assets: Vite's built-in Rollup minification + gzip via Nginx.
- Images: use WebP format, proper sizing, and lazy loading.

### 10.3 Database
- Use `explain()` to investigate slow queries: `db.students.find({classId: ...}).explain('executionStats')`.
- Avoid unbounded queries on large collections — always paginate or apply a filter.
- Use MongoDB Compass or Atlas Performance Advisor to identify missing indexes.
- Configure `maxPoolSize` in the Mongoose connection to match available server resources.

---

## 11. Logging & Monitoring

### 11.1 Application Logging
- **Library:** Winston (backend) with daily log rotation.
- **Log levels:** `error` | `warn` | `info` | `debug`.
- **Log format:** Structured JSON with: `timestamp`, `level`, `message`, `userId`, `requestId`, `method`, `path`, `statusCode`, `responseTime`.
- `debug` logs disabled in production.
- Logs stored in `/var/log/sms/` with 14-day retention.

### 11.2 Health Check Endpoint
```
GET /api/v1/health
Response: { "status": "ok", "uptime": 12345, "db": "connected" }
```

### 11.3 Monitoring (Recommended)
- **Uptime monitoring:** UptimeRobot or Better Uptime (free tier).
- **Error tracking:** Sentry (captures unhandled exceptions with context).
- **Resource monitoring:** Netdata or Prometheus + Grafana on production server.

---

## 12. Phased Sprint Plan

### Phase 1 — Foundation (Weeks 1–4)
| Week | Tasks |
|---|---|
| 1 | Project setup, monorepo config, CI pipeline skeleton, local dev environment |
| 2 | Mongoose schemas & models, seed data, Auth API (login, refresh, logout) |
| 3 | RBAC system (roles, permissions table, middleware), User management CRUD |
| 4 | Frontend shell (layout, sidebar, routing, auth pages, protected routes) |

### Phase 2 — Academic Core (Weeks 5–10)
| Week | Tasks |
|---|---|
| 5 | Student enrollment API + frontend (registration form, list, profile) |
| 6 | Student bulk import, transfer/withdrawal, audit logging |
| 7 | Academic year/term, classes, sections, subjects management |
| 8 | Timetable management (API + UI) |
| 9 | Student attendance (mark API + Teacher UI) |
| 10 | Staff attendance, Grade entry API + Teacher UI |

### Phase 3 — Finance & HR (Weeks 11–16)
| Week | Tasks |
|---|---|
| 11 | Exam management, grade ledger, grading scale config |
| 12 | Report card generation (PDF) + transcript |
| 13 | Fee structure and fee assignment API + UI |
| 14 | Payment recording, receipt PDF, overdue calculation |
| 15 | Staff management API + UI (profile, departments) |
| 16 | Leave management, payroll calculation, payslip PDF |

### Phase 4 — Reports & Notifications (Weeks 17–20)
| Week | Tasks |
|---|---|
| 17 | SMS + WhatsApp gateway integration, automated triggers |
| 18 | In-system notification center, announcements |
| 19 | Analytics dashboards (role-specific, charts) |
| 20 | Standard reports + custom report builder + PDF/Excel export |

### Phase 5 — QA & Launch (Weeks 21–24)
| Week | Tasks |
|---|---|
| 21 | End-to-end test coverage (Cypress), performance testing, security review |
| 22 | UAT with school staff (staging environment), bug fixes |
| 23 | Final bug fixes, production environment setup, data migration plan |
| 24 | Production deployment, staff training, go-live, post-launch monitoring |

---

## 13. Security Checklist (Pre-Launch)

- [ ] All API endpoints protected by JWT + RBAC middleware.
- [ ] HTTPS enforced via Nginx (HTTP redirects to HTTPS).
- [ ] All passwords hashed with bcrypt (cost factor 12).
- [ ] No secrets or credentials committed to the repository.
- [ ] All environment variables documented in `.env.example`.
- [ ] Rate limiting applied to `/auth/login` (max 10 req/min per IP).
- [ ] Input validation on all API endpoints (Zod schemas).
- [ ] NoSQL injection prevention: `express-mongo-sanitize` installed and applied to all routes.
- [ ] XSS prevention verified (CSP headers, React escaping).
- [ ] CSRF protection on state-changing endpoints.
- [ ] Audit log captures all create/update/delete operations.
- [ ] File upload validates type (whitelist: pdf, jpg, png) and size (max 10MB).
- [ ] OWASP ZAP or similar tool run against staging environment.
- [ ] Default admin password changed before go-live.
- [ ] Database not publicly accessible (firewall rules restrict to app server only).
