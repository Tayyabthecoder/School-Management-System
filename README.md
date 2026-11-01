# 🎓 School Management System (SMS)

[![Node.js Version](https://img.shields.io/badge/Node.js-20.x_LTS-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7.2-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Jest](https://img.shields.io/badge/Jest-Tested-C21325?style=for-the-badge&logo=jest&logoColor=white)](https://jestjs.io/)

> **A modern, enterprise-grade educational ERP platform engineered for large K-12 institutions (2,000–5,000+ students). Unifying academic management, student lifecycles, fee collection, human resources, payroll, and real-time institutional analytics into a high-performance web solution.**

---

## 📑 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Key Features & Modules](#-key-features--modules)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Demo Credentials](#-demo-credentials)
- [Technology Stack](#-technology-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Method 1: Docker Compose (Recommended)](#method-1-docker-compose-recommended)
  - [Method 2: Local Development Setup](#method-2-local-development-setup)
- [Database Seeding](#-database-seeding)
- [Environment Configuration](#-environment-configuration)
- [REST API Reference](#-rest-api-reference)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Security & Production Hardening](#-security--production-hardening)
- [System Documentation](#-system-documentation)
- [License](#-license)

---

## 🌟 Overview

The **School Management System (SMS)** eliminates fragmented spreadsheets and paper trails by centralizing every administrative, pedagogical, and financial workflow in one unified system. Designed with precision for primary and secondary education operations, the platform features:

- **Complete Student Lifecycle:** Admissions, enrollment, section assignment, document repository, automated annual grade promotion, and exit management.
- **Academic Administration:** Curriculum planning, grade-wise subject assignments, timetable scheduling, and term-based academic year definitions.
- **Attendance & Communication:** Daily student attendance with instant notification hooks (SMS/WhatsApp) and biometric/manual staff attendance logging.
- **Exams & Report Cards:** Comprehensive grading engines supporting marks, percentages, GPA calculations, and one-click printable PDF report cards.
- **Financial Accounting:** Fee structure definition, batch monthly fee challan generation, partial payment reconciliation, arrears tracking, and overdue penalties.
- **Human Resources & Payroll:** Faculty and administrative staff directory, leave request workflows with approvals, and monthly net salary slip generation.
- **Dedicated Portals:** Tailored user interfaces for School Administrators, Teachers, Students, Parents/Guardians, Accountants, and HR Managers.

---

## 🏛 System Architecture

The SMS application follows a modular, secure, **3-Tier Architecture** backed by distributed asynchronous job workers and memory caching.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT / PRESENTATION TIER                      │
│        React 18 Single Page Application (Vite + Tailwind CSS)          │
│  ┌───────────────────────┐ ┌───────────────────┐ ┌──────────────────┐  │
│  │ Administrative Portal │ │ Teacher Workspace │ │ Guardian/Student │  │
│  └───────────────────────┘ └───────────────────┘ └──────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST API (JSON)
┌───────────────────────────────────▼────────────────────────────────────┐
│                        APPLICATION / LOGIC TIER                        │
│                     Node.js & Express RESTful API                      │
│                                                                        │
│  [Helmet / CORS] ──▶ [Rate Limiter (Redis)] ──▶ [JWT Auth & RBAC]      │
│                                                                        │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌────────────┐  │
│  │ Students & SIS│ │ Academics & TT│ │ Finance & Fee │ │  HR & Staff│  │
│  ├───────────────┤ ├───────────────┤ ├───────────────┤ ├────────────┤  │
│  │ Attendance    │ │ Grades & Exams│ │ Report Engine │ │ Settings   │  │
│  └───────────────┘ └───────────────┘ └───────────────┘ └────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ BullMQ Background Workers (Monthly Challans & Overdue Fees Cron) │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────┬────────────────────────────┬───────────────────┘
                        │                            │
┌───────────────────────▼───────────┐    ┌───────────▼───────────────────┐
│           DATA PERSISTENCE        │    │        CACHE & QUEUES         │
│               MongoDB 7           │    │            Redis 7            │
│   Document Store & Audit Trails   │    │ Rate Limit Store & BullMQ     │
└───────────────────────────────────┘    └───────────────────────────────┘
```

---

## 🚀 Key Features & Modules

### 1. Student Information System (SIS)
- Student directory with advanced filters (Grade, Section, Status, Gender).
- Full student profiling: National ID/B-Form, Guardian details, contact records, emergency numbers, and avatar uploads.
- **Bulk Enrollment:** Import and validate student cohorts in bulk using Excel (`.xlsx`) or CSV files.
- **Annual Promotion Engine:** Rule-based student progression to the next grade or retention with configurable promotion criteria.

### 2. Academics & Timetables
- Academic calendar definition with multiple active terms/semesters.
- Grade/Class management (Grades 1 through 12) with multi-section support (A, B, C, etc.).
- Subject allocation with designated teacher assignments and weekly period allotments.
- Visual, clash-free timetable scheduler for classes and faculty.

### 3. Attendance Management
- Real-time mark-entry interface for teachers per class/section.
- Support for multiple statuses: `Present`, `Absent`, `Late`, `Half Day`, and `Excused`.
- Staff and faculty attendance management with check-in/out tracking.
- Automated absence digest reporting and alert hooks for guardians.

### 4. Examination & Report Cards
- Configurable examination cycles (Term 1, Midterms, Final Examinations).
- Custom grading scales (Marks, Percentages, Letter Grades, and GPA).
- Batch mark sheet entry per class and subject.
- Automated generation of professional, print-ready PDF Report Cards with school letterhead, rankings, and teacher remarks.

### 5. Fee Collection & Finance
- Tiered fee structures by class, including tuition, lab, sports, admission, and exam charges.
- **Automated Monthly Challan Engine:** Scheduled cron job generates invoices with unique challan numbers for all enrolled students.
- Support for discounts, scholarships, late-fee surcharges, and carry-forward arrears.
- Payment tracking for Cash, Bank Transfer, and Online vouchers with printable fee receipts.

### 6. Human Resources & Payroll
- Complete staff records: Designation, department, CNIC, employment type, contract status, and salary scale.
- Employee leave management: Leave quotas, application submission, and approval workflows.
- One-click monthly payroll calculation with allowances, tax deductions, and unpaid leave offsets.

### 7. Portals & Workspaces
- **Admin Dashboard:** High-level KPIs, revenue charts, attendance percentages, and audit logs.
- **Teacher Workspace:** Quick daily tasks (take attendance, enter grades, review timetable).
- **Student Portal:** Personalized schedule, examination results, and attendance records.
- **Guardian Portal:** Multi-child progress monitoring, fee dues, and attendance summary.

---

## 🔐 Role-Based Access Control (RBAC)

The system enforces strict permission gates at both API route and UI levels across six user personas:

| Role | Access Scope & Capabilities |
|---|---|
| **Super Admin** (`super_admin`) | Unrestricted access: system configuration, user provisioning, global audit logs, promotion engine, and all functional modules. |
| **Teacher** (`teacher`) | Academic roster, class attendance, marks/grade submission, subject timetables, and student academic profiles. |
| **Accountant** (`accountant`) | Fee schedules, invoice/challan generation, payment entries, financial statements, and fee collection reports. |
| **HR Manager** (`hr_manager`) | Staff records, employee leave approvals, staff attendance monitoring, and monthly payroll processing. |
| **Guardian** (`guardian`) | Read-only access to enrolled children's academic results, daily attendance, fee dues, and school announcements. |
| **Student** (`student`) | Read-only access to own timetable, grades, report cards, and attendance record. |

---

## 🔑 Demo Credentials

When seeded using `npm run db:seed`, the database is populated with sample datasets and ready-to-use accounts:

| Role | Username | Password | Notes |
|---|---|---|---|
| **Super Admin** | `admin` | `Admin@1234` | System administrator with full privileges |
| **Teacher** | `teacher1` | `Staff@1234` | Senior Mathematics Teacher (`teacher1` to `teacher7`) |
| **Accountant** | `accountant1` | `Staff@1234` | Chief Accountant (`accountant1`, `accountant2`) |
| **HR Manager** | `hr_manager` | `Staff@1234` | Head of Human Resources |
| **Student** | `student1` | `Student@1234` | Sample Enrolled Student (`student1` to `student50`) |
| **Guardian** | `guardian_student1` | `Student@1234` | Parent account linked to student |

---

## 💻 Technology Stack

### Frontend
- **Framework:** [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/)
- **Routing:** [React Router v6](https://reactrouter.com/) (Protected & Role-based routes)
- **Styling:** [Tailwind CSS 3](https://tailwindcss.com/) + PostCSS + Autoprefixer
- **State & Server Cache:** [Zustand](https://github.com/pmndrs/zustand) & [TanStack React Query v5](https://tanstack.com/query/latest)
- **Data Visualization:** [Recharts](https://recharts.org/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **HTTP Client:** [Axios](https://axios-http.com/) with global auth interceptors

### Backend
- **Runtime:** [Node.js 20 LTS](https://nodejs.org/)
- **Web Framework:** [Express.js 4](https://expressjs.com/)
- **Database & ODM:** [MongoDB 7](https://www.mongodb.com/) via [Mongoose 8](https://mongoosejs.com/)
- **In-Memory Store & Queues:** [Redis 7](https://redis.io/) via [ioredis](https://github.com/redis/ioredis) & [BullMQ](https://bullmq.io/)
- **Scheduling:** [node-cron](https://github.com/node-cron/node-cron)
- **Authentication:** Stateless JSON Web Tokens ([jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)) + [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Validation:** [Zod](https://zod.dev/) schema validation
- **File & Document Processing:** [ExcelJS](https://github.com/exceljs/exceljs) (Spreadsheets), [PDFKit](https://pdfkit.org/) / [Puppeteer](https://pptr.dev/) (PDF Reports), [Multer](https://github.com/expressjs/multer) (Uploads)
- **Security:** [Helmet](https://helmetjs.github.io/), [express-mongo-sanitize](https://github.com/fiznool/express-mongo-sanitize), [express-rate-limit](https://express-rate-limit.mintlify.app/) + [rate-limit-redis](https://github.com/express-rate-limit/rate-limit-redis)
- **Logging:** [Winston](https://github.com/winstonjs/winston) + [Morgan](https://github.com/expressjs/morgan)

---

## 📁 Project Directory Structure

```text
School-Management-System/
├── .github/                     # CI/CD workflows and actions
├── backend/                     # Node.js Express REST API
│   ├── logs/                    # Runtime Winston logs (combined & error)
│   ├── seed/                    # Database seeding engines & sample data
│   │   └── seed.js              # Comprehensive demo dataset generator
│   ├── src/
│   │   ├── config/              # Database, Redis, and environment configs
│   │   ├── jobs/                # BullMQ queue workers & cron schedules
│   │   ├── middleware/          # Auth, RBAC, error handling, rate limiting
│   │   ├── models/              # Mongoose schemas & data models
│   │   ├── modules/             # Domain modules (auth, students, finance, etc.)
│   │   │   ├── attendance/      # Attendance controller, services, and routes
│   │   │   ├── auth/            # Authentication & token endpoints
│   │   │   ├── classes/         # Class and grade management
│   │   │   ├── finance/         # Invoicing, fee structures, payments
│   │   │   ├── grades/          # Marks, grading rules, exam controllers
│   │   │   ├── hr/              # Staff, leaves, payroll
│   │   │   ├── reportcards/     # PDF report card compilation
│   │   │   ├── reports/         # Dynamic tabular and analytical reporting
│   │   │   ├── settings/        # System configuration & school details
│   │   │   ├── students/        # Student admissions, profile, promotion
│   │   │   ├── timetable/       # Class and teacher schedule planning
│   │   │   └── uploads/         # Authenticated document & media storage
│   │   ├── services/            # Shared business services (Audit, PDF, Excel)
│   │   ├── utils/               # Sanitizers, response helpers, validators
│   │   ├── __tests__/           # Jest unit, integration, and security test suites
│   │   ├── app.js               # Express application initialization
│   │   └── server.js            # HTTP server entry point & worker bootstrap
│   ├── .env.example             # Backend environment template
│   ├── Dockerfile               # Multi-stage production container for API
│   ├── jest.config.js           # Jest test runner configuration
│   └── package.json             # Backend dependencies & scripts
├── docs/                        # Complete project documentation
│   ├── Architecture_Document.md # Technical architecture blueprint
│   ├── Development_Document.md  # Engineering workflows & guides
│   ├── PRD.md                   # Product requirements document
│   ├── SRS.md                   # Software requirements specification
│   └── UIUX_Document.md         # Design system & user journey guidelines
├── frontend/                    # React 18 + Vite Web Application
│   ├── src/
│   │   ├── components/          # Reusable UI components & layouts (AppShell, Tables, Modals)
│   │   ├── constants/           # Route names, navigation items, role configs
│   │   ├── features/            # Feature-sliced components and views
│   │   │   ├── academics/       # Classes, subjects, and timetable views
│   │   │   ├── attendance/      # Daily roll call and summary dashboards
│   │   │   ├── auth/            # Login, password reset, profile
│   │   │   ├── dashboard/       # Metric cards, statistics, and charts
│   │   │   ├── finance/         # Fee collection, challans, records
│   │   │   ├── grades/          # Marks entry and report card printing
│   │   │   ├── guardian/        # Dedicated parent portal screens
│   │   │   ├── hr/              # Staff list, payroll records, leave approval
│   │   │   ├── reports/         # Custom query report builders
│   │   │   ├── settings/        # School branding, academic years, rules
│   │   │   └── students/        # Student directory, profile, promotion
│   │   ├── lib/                 # Axios instance and query client utilities
│   │   ├── routes/              # Protected and role-gated route definitions
│   │   ├── store/               # Zustand auth and UI stores
│   │   ├── App.jsx              # Main React component
│   │   └── main.jsx             # React DOM entry point
│   ├── Dockerfile               # Multi-stage build + Nginx runner
│   ├── nginx.conf               # Production Nginx reverse proxy & security headers
│   ├── package.json             # Frontend dependencies & scripts
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   └── vite.config.js           # Vite build config & dev API proxy
├── docker-compose.yml           # Unified orchestration (MongoDB, Redis, Backend, Frontend)
└── README.md                    # Project documentation
```

---

## ⚡ Getting Started

### Prerequisites

Ensure you have the following installed on your host system:
- **Node.js**: `v20.x LTS` or higher
- **npm**: `v10.x` or higher
- **MongoDB**: `v7.0+` (local service or MongoDB Atlas)
- **Redis**: `v7.0+` (optional for local basic dev, required for background queues & production rate limiting)
- **Docker & Docker Compose** *(Optional, recommended for turnkey deployment)*

---

### Method 1: Docker Compose (Recommended)

Run the full stack (MongoDB, Redis, Backend, and Frontend reverse-proxied by Nginx) with a single command:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/School-Management-System.git
   cd School-Management-System
   ```

2. **Launch all services:**
   ```bash
   docker-compose up -d --build
   ```

3. **Seed demo data into the containerized MongoDB:**
   ```bash
   docker exec -it sms-backend npm run db:seed
   ```

4. **Access the application:**
   - **Frontend Application:** [http://localhost](http://localhost) (Port 80)
   - **Backend REST API:** [http://localhost/api/v1/health](http://localhost/api/v1/health)

To view real-time logs:
```bash
docker-compose logs -f
```

To stop containers:
```bash
docker-compose down
```

---

### Method 2: Local Development Setup

#### 1. Start Database Services
Ensure MongoDB and Redis are running locally:
```bash
# Windows (PowerShell)
net start MongoDB

# macOS (Homebrew)
brew services start mongodb-community
brew services start redis

# Linux (systemd)
sudo systemctl start mongod
sudo systemctl start redis-server
```

#### 2. Backend Setup
```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Populate database with roles, classes, subjects, staff, and students
npm run db:seed

# Start backend development server (with nodemon hot-reload)
npm run dev
```
The backend API will be available at: **`http://localhost:5000`**

#### 3. Frontend Setup
In a new terminal window:
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
The frontend application will be available at: **`http://localhost:3000`**

*(Requests from the frontend to `/api` are automatically proxied to `http://localhost:5000` via `vite.config.js`.)*

---

## 🗄 Database Seeding

The platform includes an automated seed engine that populates an empty database with an authentic school environment:

```bash
cd backend
npm run db:seed
```

**What gets seeded:**
1. **System Roles:** `super_admin`, `teacher`, `student`, `guardian`, `accountant`, `hr_manager` with granular permissions.
2. **Academic Year 2026:** Configured with Term 1, Term 2 (Midterm), and Term 3 (Final).
3. **Grades 1 to 12:** Sections A & B for each class with core subjects (English, Mathematics, Science, Computer Studies, Urdu, Physics, Chemistry, Biology).
4. **Staff Members:** 10 faculty and staff profiles across Academics, Finance, and HR departments with pre-configured salaries.
5. **50 Students:** Distributed across grades with realistic enrollment data, guardians, and fee structures.
6. **Attendance & Academic History:** Realistic historical records, exam schedules, marks, challans, and payroll items.

---

## ⚙️ Environment Configuration

### Backend Configuration (`backend/.env`)

| Variable | Default Value | Description |
|---|---|---|
| `PORT` | `5000` | Port on which the Express server listens |
| `NODE_ENV` | `development` | Environment mode (`development`, `production`, `test`) |
| `MONGODB_URI` | `mongodb://localhost:27017/sms_dev` | Connection string for MongoDB database |
| `MONGODB_DB_NAME` | `sms_dev` | MongoDB database name |
| `REDIS_URL` | `redis://localhost:6379` | Connection string for Redis cache & BullMQ |
| `JWT_SECRET` | *(Required)* | Secret key for signing Access Tokens (15m expiry) |
| `JWT_EXPIRES_IN` | `15m` | Lifetime of access tokens |
| `JWT_REFRESH_SECRET` | *(Required)* | Secret key for signing Refresh Tokens (7d expiry) |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Lifetime of refresh tokens |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed client origin for CORS |
| `UPLOAD_DIR` | `./uploads` | Storage directory for student photos and documents |
| `MAX_FILE_SIZE_MB` | `10` | Maximum file upload size in megabytes |

---

## 📡 REST API Reference

All API routes are prefixed with `/api/v1` and return predictable JSON responses conforming to `{ success: boolean, data?: any, error?: any }`.

### Core Endpoints

#### Authentication & Profile
- `POST /api/v1/auth/login` - Authenticate user, receive JWT & HTTP-only refresh cookie
- `POST /api/v1/auth/refresh` - Exchange refresh token for fresh access token
- `POST /api/v1/auth/logout` - Invalidate session & clear cookies
- `GET /api/v1/auth/me` - Retrieve current authenticated profile & permissions
- `PUT /api/v1/auth/change-password` - Update account password

#### Student Management
- `GET /api/v1/students` - Paginated student directory with search & filters
- `POST /api/v1/students` - Register a new student
- `GET /api/v1/students/:id` - Retrieve full student profile, history & fees
- `PUT /api/v1/students/:id` - Update student information
- `POST /api/v1/students/bulk-import` - Bulk import students from spreadsheet
- `POST /api/v1/students/promotion` - Process grade promotion batch

#### Academic & Timetables
- `GET /api/v1/classes` - List all grades and active sections
- `POST /api/v1/classes` - Create class and section configuration
- `GET /api/v1/subjects` - List subjects filtered by grade
- `GET /api/v1/timetable` - Retrieve weekly timetable for class or teacher
- `POST /api/v1/timetable` - Save timetable grid entries

#### Attendance
- `GET /api/v1/attendance/students` - Query student attendance by date & section
- `POST /api/v1/attendance/students` - Submit or batch-update student roll call
- `GET /api/v1/attendance/staff` - Query staff attendance records
- `POST /api/v1/attendance/staff` - Record staff check-in/out

#### Grades & Report Cards
- `GET /api/v1/grades/exams` - List scheduled examination terms
- `POST /api/v1/grades/marks` - Submit batch exam marks for a subject
- `GET /api/v1/report-cards/generate/:studentId` - Compile and stream printable PDF report card

#### Finance & Fees
- `GET /api/v1/finance/challans` - List fee challans with payment status
- `POST /api/v1/finance/challans/generate` - Trigger bulk monthly challan run
- `POST /api/v1/finance/payments` - Record fee payment transaction
- `GET /api/v1/finance/fee-structures` - View fee configuration per class

#### Human Resources & Payroll
- `GET /api/v1/hr/staff` - Faculty and staff directory
- `POST /api/v1/hr/staff` - Add new employee record
- `GET /api/v1/hr/leaves` - List leave applications
- `PUT /api/v1/hr/leaves/:id/status` - Approve or reject staff leave request
- `POST /api/v1/hr/payroll/process` - Generate monthly payroll ledger

#### System & Health
- `GET /api/v1/health` - Health check endpoint (service status & timestamp)
- `GET /api/v1/settings` - Retrieve institutional settings, logo, and active year

---

## 🧪 Testing & Quality Assurance

The backend includes a comprehensive test suite built with **Jest** and **Supertest**, covering business logic, security middleware, and controller integrations.

```bash
cd backend

# Run the test suite
npm test

# Run tests with code coverage analysis
npm run test:coverage

# Run integration tests sequentially
npm run test:integration
```

### Test Coverage Highlights:
- **Authentication & RBAC:** Verification of role barriers, forbidden actions, and expired token rejection.
- **Security Tests:** Sanitization of NoSQL injections (`$gt`, `$ne`), rate limiter enforcement, and authenticated upload protections.
- **Finance Engine:** Challan calculations, discount applications, and payment reconciliations.
- **Promotion & Roster:** Section transitions and student record updates.

For the frontend:
```bash
cd frontend

# Run ESLint validation
npm run lint

# Verify production production bundle build
npm run build
```

---

## 🛡️ Security & Production Hardening

- **Stateless Authentication:** Short-lived JWTs (15 minutes) coupled with secure, `httpOnly`, `sameSite` refresh tokens.
- **Brute Force & DDoS Mitigation:** Granular rate limiting on sensitive routes (`/login`, `/refresh`, `/change-password`, and bulk file imports) with fallback to an in-memory or Redis store.
- **NoSQL Injection Defense:** `express-mongo-sanitize` scrubs all incoming `req.body`, `req.query`, and `req.params` for dangerous Mongo operators.
- **Hardened HTTP Headers:** [Helmet](https://helmetjs.github.io/) configured on the backend; production Nginx proxy injects strict Content Security Policy (CSP), HSTS (`max-age=31536000`), X-Frame-Options, and referrer headers.
- **Secure File Uploads:** Uploaded media and documents are validated by MIME type, size-checked, stored outside public paths, and served exclusively through authenticated routes (`/api/v1/uploads/files`).
- **Least-Privilege Containers:** Dockerfiles compile code under multi-stage builds and execute under a non-root unprivileged system user (`appuser`).

---

## 📚 System Documentation

Comprehensive architecture, requirement, and developer documents are available in the [`docs/`](./docs) folder:

- **[Architecture Document](./docs/Architecture_Document.md):** In-depth technical specification, data flow diagrams, schema design, and deployment topology.
- **[Development Document](./docs/Development_Document.md):** Developer guide, coding conventions, Git branching strategy, and contribution workflows.
- **[Product Requirements Document (PRD)](./docs/PRD.md):** Stakeholder requirements, user personas, and target outcomes.
- **[Software Requirements Specification (SRS)](./docs/SRS.md):** Detailed functional and non-functional requirements.
- **[UI/UX Design Document](./docs/UIUX_Document.md):** Design systems, color palettes, responsive layouts, and user flows.

---

## 📄 License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute it in accordance with the license conditions.

---

<div align="center">
  <sub>Built with ❤️ for educational institutions worldwide.</sub>
</div>
