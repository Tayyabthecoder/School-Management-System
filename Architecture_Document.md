# Architecture Document
## School Management System (SMS)

**Version:** 1.0  
**Date:** 2026-08-30  
**Status:** Draft  

---

## 1. Introduction

### 1.1 Purpose
This document describes the technical architecture of the School Management System (SMS). It provides the blueprint for the system's structure, component interactions, technology choices, data flow, security model, and deployment strategy to guide development teams and infrastructure engineers.

### 1.2 Scope
This architecture covers the complete SMS application: frontend, backend API, database, notification services, and deployment infrastructure. It supports 2,000–5,000 students, 5 user roles, and 9 core modules.

### 1.3 Architectural Goals
- **Modularity:** Each domain (academics, finance, HR) is independently maintainable.
- **Scalability:** Horizontal scaling of application services to handle peak loads.
- **Security:** Defense-in-depth — RBAC at all layers, encrypted transport and storage.
- **Maintainability:** Clean separation of concerns; well-documented APIs.
- **Portability:** Deployable on any standard server (cloud VPS or on-premise) without special tooling.

---

## 2. Technology Stack

### 2.1 Recommended Stack

| Layer | Technology | Justification |
|---|---|---|
| **Frontend** | React 18 + Vite | Component-based, fast HMR, large ecosystem |
| **UI Framework** | Tailwind CSS + shadcn/ui | Rapid, accessible UI development |
| **State Management** | Zustand + React Query | Lightweight state + server data caching |
| **Backend** | Node.js + Express.js | JavaScript full-stack consistency, non-blocking I/O |
| **API Style** | RESTful JSON API | Simple, widely understood, tooling support |
| **Database** | MongoDB 7 (Atlas or self-hosted) | Flexible document model, horizontal scalability, native JSON storage |
| **ODM** | Mongoose | Schema validation, middleware hooks, rich query API for MongoDB |
| **Authentication** | JWT (JSON Web Tokens) | Stateless, scalable session management |
| **PDF Generation** | Puppeteer / PDFKit | Server-side PDF for report cards, receipts |
| **Excel Export** | ExcelJS | Full .xlsx generation with formatting |
| **Charts** | Recharts | React-native charting for dashboards |
| **SMS** | Twilio / Jazz SMS API | Reliable SMS gateway with delivery receipts |
| **WhatsApp** | Twilio WhatsApp API | Business API via aggregator |
| **Reverse Proxy** | Nginx | SSL termination, static file serving, API proxying |
| **Hosting** | Any VPS / Cloud VM (AWS EC2, GCP Compute, Azure VM) | Flexibility for cloud or on-premise |

---

## 3. System Architecture Overview

The SMS follows a **3-Tier / N-Tier Architecture**:

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT TIER                            │
│         React SPA (Browser – Desktop / Mobile)           │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐   │
│  │  Auth UI   │  │  Modules   │  │ Dashboard/Reports│   │
│  └────────────┘  └────────────┘  └──────────────────┘   │
└──────────────────────────┬───────────────────────────────┘
                           │ HTTPS / REST API (JSON)
┌──────────────────────────▼───────────────────────────────┐
│                  APPLICATION TIER                         │
│            Node.js + Express.js API Server               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │  Auth    │ │ Academic │ │ Finance  │ │  HR/Payrol │  │
│  │ Service  │ │ Service  │ │ Service  │ │  Service   │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Enrollmt │ │Attendance│ │ Reports  │ │Notification│  │
│  │ Service  │ │ Service  │ │ Service  │ │  Service   │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
│         ┌─────────────────────────────────┐              │
│         │   RBAC Middleware (all routes)  │              │
│         └─────────────────────────────────┘              │
└──────────────────────────┬───────────────────────────────┘
                           │ Mongoose ODM
┌──────────────────────────▼───────────────────────────────┐
│                    DATA TIER                              │
│              MongoDB 7 (Atlas or Self-Hosted)             │
│    ┌──────────────────────────────────────────┐          │
│    │  Collections: users, students, staff,    │          │
│    │  classes, subjects, attendance, grades,  │          │
│    │  fees, payments, payroll, notifications  │          │
│    └──────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│              EXTERNAL SERVICES                            │
│    ┌───────────────────┐  ┌───────────────────┐          │
│    │  SMS Gateway API  │  │ WhatsApp Biz API   │          │
│    │ (Twilio/Jazz SMS) │  │ (Twilio/360dialog) │          │
│    └───────────────────┘  └───────────────────┘          │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Frontend Architecture

### 4.1 Structure

```
/src
  /assets          # Static images, fonts, icons
  /components      # Reusable UI components (Button, Table, Modal, etc.)
  /features        # Feature-based modules (collocated pages + hooks + api)
    /auth
    /students
    /attendance
    /grades
    /finance
    /hr
    /reports
    /notifications
    /settings
  /hooks           # Shared custom hooks
  /layouts         # Page layouts (Sidebar, Header, Auth layout)
  /lib             # Utility functions, formatters
  /routes          # React Router configuration
  /services        # Axios API client and request helpers
  /store           # Zustand global state slices
  /types           # TypeScript type definitions
```

### 4.2 Routing & Guards
- React Router v6 with nested routes.
- Route guards redirect unauthenticated users to `/login`.
- Role-based route guards prevent unauthorized role access (e.g., Students cannot access Finance).

### 4.3 API Communication
- Axios instance with base URL and JWT interceptor (auto-attaches `Authorization: Bearer <token>`).
- React Query manages server state caching, background refetching, and loading/error states.

### 4.4 State Management
- **Server state:** React Query (student lists, grades, fees, etc.)
- **Client/UI state:** Zustand (sidebar toggle, modal open states, current user session)

---

## 5. Backend Architecture

### 5.1 Project Structure

```
/src
  /config          # Environment config, DB connection, constants
  /middleware      # Auth (JWT verify), RBAC, error handler, request logger
  /modules         # Domain-driven modules
    /auth
    /users
    /students
    /classes
    /timetable
    /attendance
    /grades
    /reportcards
    /finance
    /hr
    /payroll
    /notifications
    /reports
  /utils           # Helpers: PDF generator, Excel exporter, SMS sender
  /validators      # Request validation schemas (Zod/Joi)
  /jobs            # Scheduled background jobs (fee reminders, payroll triggers)
  app.js           # Express app setup
  server.js        # HTTP server entry point
```

### 5.2 Request Lifecycle

```
HTTP Request
     │
     ▼
  Nginx (Reverse Proxy / SSL Termination)
     │
     ▼
  Express.js
     │
     ├── Rate Limiter Middleware
     ├── CORS Middleware
     ├── Request Logger
     ├── JWT Authentication Middleware
     │     └── Verifies token, attaches req.user
     ├── RBAC Authorization Middleware
     │     └── Checks role permissions for route
     ├── Request Validation (Zod)
     │
     ▼
  Route Handler → Service Layer → Mongoose ODM → MongoDB
     │
     ▼
  Response (JSON)
```

### 5.3 Module Structure (per module)

Each module follows a consistent internal pattern:

```
/modules/students
  students.routes.js    # Express route definitions
  students.controller.js # Request handlers (thin layer)
  students.service.js   # Business logic
  students.repository.js # Data access (Mongoose calls)
  students.dto.js       # Data transfer objects / validators
```

### 5.4 Background Jobs
- A job scheduler (node-cron) runs scheduled tasks:
  - **Daily at 8 AM:** Send fee overdue reminders via SMS/WhatsApp.
  - **Daily at 4 PM:** Compile attendance summary and flag low-attendance students.
  - **Monthly (1st of month):** Trigger payroll computation notification for HR.

---

## 6. Database Architecture

### 6.1 Database Design Principles
- **Document-oriented:** Data is stored as BSON documents inside collections. Related data is either **embedded** (read-together data) or **referenced** (independently queried data).
- **Soft deletes:** All documents carry a `deletedAt` field (null = active; timestamp = deleted).
- **Audit fields:** All documents include `createdAt`, `updatedAt`, `createdBy`, `updatedBy`.
- **Primary keys:** MongoDB auto-generates `_id` (ObjectId). All cross-references use `ObjectId` references.
- **Schema validation:** Mongoose Schemas enforce structure and data types at the application layer.

### 6.2 Embedding vs. Referencing Strategy

| Relationship | Strategy | Reason |
|---|---|---|
| Student → Guardian details | **Embedded** sub-document | Always read together; small and bounded |
| Student → Class/Section | **Reference** (ObjectId) | Classes queried independently |
| Attendance record → Student | **Reference** | Attendance queried independently by date/class |
| Grade → Exam + Student | **Reference** | Queries span multiple students/exams |
| StudentFee → FeeStructure | **Reference** | Fee structures shared across many students |
| Payment → StudentFee | **Reference** | Payment history queried independently |
| Payroll → Staff | **Reference** | Monthly payroll records queried by month/year |
| Timetable entry | **Embedded** in Class document | Loaded with the class; small and bounded |
| Announcement → Notification | **Embedded** recipients list (if small) / **Reference** (if large broadcast) | Depends on audience size |

### 6.3 Core Collections & Key Fields

| Collection | Key Fields |
|---|---|
| `users` | `_id`, `username`, `passwordHash`, `role` (enum), `isActive`, `staffId` or `studentId` (ref) |
| `students` | `_id`, `studentId`, `fullName`, `dob`, `gender`, `classId` (ref), `sectionId` (ref), `guardian` {name, phone}, `isActive` |
| `staff` | `_id`, `staffId`, `fullName`, `cnic`, `designation`, `departmentId` (ref), `salary`, `isActive` |
| `roles` | `_id`, `name`, `permissions` [{module, actions[]}] |
| `classes` | `_id`, `name`, `level`, `sections` [{name}], `subjects` [{subjectId (ref)}] |
| `subjects` | `_id`, `name`, `classId` (ref) |
| `academicYears` | `_id`, `year`, `startDate`, `endDate`, `isActive`, `terms` [{name, startDate, endDate}] |
| `timetableEntries` | `_id`, `classId` (ref), `sectionId`, `subjectId` (ref), `teacherId` (ref), `day`, `period`, `room` |
| `studentAttendance` | `_id`, `studentId` (ref), `classId` (ref), `date`, `status` (Present/Absent/Late/Excused), `markedBy` (ref) |
| `staffAttendance` | `_id`, `staffId` (ref), `date`, `status`, `markedBy` (ref) |
| `exams` | `_id`, `name`, `termId`, `subjectId` (ref), `classId` (ref), `date`, `maxMarks` |
| `grades` | `_id`, `examId` (ref), `studentId` (ref), `marksObtained`, `percentage`, `gradeLetter` |
| `feeStructures` | `_id`, `feeType`, `classId` (ref), `amount`, `isFixed`, `dueDate` |
| `studentFees` | `_id`, `studentId` (ref), `feeStructureId` (ref), `amountDue`, `discount`, `dueDate`, `status` |
| `payments` | `_id`, `studentFeeId` (ref), `amountPaid`, `paymentDate`, `receiptNo` |
| `payrollRecords` | `_id`, `staffId` (ref), `month`, `year`, `basicPay`, `allowances`, `deductions`, `netPay` |
| `leaveRequests` | `_id`, `staffId` (ref), `leaveType`, `fromDate`, `toDate`, `status` |
| `notificationsLog` | `_id`, `recipientType`, `recipientId` (ref), `channel` (SMS/WhatsApp), `message`, `status`, `sentAt` |
| `auditLogs` | `_id`, `userId` (ref), `action`, `collection`, `documentId`, `oldValues`, `newValues`, `timestamp` |

### 6.4 MongoDB Index Strategy

| Collection | Index | Type | Reason |
|---|---|---|---|
| `users` | `username` | Unique | Login lookup |
| `students` | `studentId` | Unique | ID-based lookup |
| `students` | `classId`, `sectionId` | Compound | Class roster queries |
| `studentAttendance` | `studentId`, `date` | Compound | Per-student history |
| `studentAttendance` | `classId`, `date` | Compound | Daily class attendance |
| `grades` | `studentId`, `examId` | Compound | Grade lookup |
| `studentFees` | `studentId`, `status` | Compound | Fee status filter |
| `payments` | `studentFeeId` | Single | Payment history |
| `payrollRecords` | `staffId`, `month`, `year` | Compound | Payroll lookup |
| `auditLogs` | `userId`, `timestamp` | Compound | Audit queries |

---

## 7. Security Architecture

### 7.1 Authentication Flow
1. User submits username + password.
2. Backend verifies credentials; bcrypt compares hashed password.
3. On success, server issues a **JWT access token** (15-min expiry) and a **refresh token** (7-day expiry, HTTP-only cookie).
4. Client stores access token in memory (not localStorage).
5. Axios interceptor attaches access token to all API requests.
6. On 401, interceptor calls `/auth/refresh` using the refresh token cookie to obtain a new access token.

### 7.2 RBAC Enforcement
- A `roles` collection stores each role's allowed actions (CRUD) per module as an array of permission objects.
- The RBAC middleware checks `req.user.role` against the route's required permission before passing to the controller.
- Frontend route guards mirror backend permission checks for UX (not for security).

### 7.3 Additional Security Controls

| Control | Implementation |
|---|---|
| HTTPS | TLS 1.2+ via Nginx with Let's Encrypt (or purchased cert) |
| NoSQL Injection | `express-mongo-sanitize` strips `$` and `.` from user inputs; Mongoose typed schemas reject unexpected fields |
| XSS | React auto-escaping + Content Security Policy header |
| CSRF | SameSite cookie for refresh token; CSRF token for mutations |
| Rate Limiting | express-rate-limit on login and sensitive routes |
| Input Validation | Zod schema validation on all API inputs |
| Secrets Management | Environment variables via `.env` (never committed) |
| Audit Logging | Middleware logs all write operations to `auditLogs` collection |

---

## 8. Notification Architecture

```
Event Trigger (e.g., student marked Absent)
        │
        ▼
Notification Service (backend)
        │
        ├──▶ Save to `notificationsLog` collection (status: pending)
        │
        ├──▶ SMS Gateway API (HTTP POST → Twilio/Jazz)
        │         └─▶ Update log status (sent/failed)
        │
        └──▶ WhatsApp API (HTTP POST → Twilio/360dialog)
                  └─▶ Update log status (sent/failed)
```

- Failed notifications are retried up to 3 times with exponential backoff.
- Delivery statuses are stored in `notifications_log` for admin review.

---

## 9. Reporting Architecture

- Standard reports: Pre-built **Mongoose aggregation pipelines**, results streamed to PDF/Excel generators.
- Custom report builder: Dynamic aggregation pipeline construction from user-selected filters; results paginated and exportable.
- Dashboard charts: Data aggregated by scheduled queries or real-time lightweight queries, sent as JSON to Recharts on the frontend.
- Large reports (> 1,000 rows) are generated asynchronously and made available for download.

---

## 10. Deployment Architecture

### 10.1 Environment Strategy

| Environment | Purpose |
|---|---|
| **Development** | Developer's local machine — all services run natively |
| **Staging** | A cloud VPS or spare server mirroring production, used for UAT |
| **Production** | Cloud VPS (e.g., AWS Lightsail, DigitalOcean Droplet) or on-premise server |

---

### 10.2 Production Deployment (Direct / No Docker)

All three services — **Nginx**, **Node.js API**, and **MongoDB** — are installed and run directly on the server.

```
┌─────────────────────────────────────────────────────────────────┐
│                      Server / VPS                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Nginx (Port 80 / 443)                                  │   │
│  │  • Serves React build files (static)                    │   │
│  │  • Proxies /api/* requests → Node.js API (Port 5000)    │   │
│  │  • Handles HTTPS (SSL certificate via Certbot)          │   │
│  └───────────────────────────┬─────────────────────────────┘   │
│                              │                                  │
│                    ┌─────────▼──────────┐                       │
│                    │  Node.js API       │                       │
│                    │  (Port 5000)       │                       │
│                    │  Managed by PM2    │                       │
│                    └─────────┬──────────┘                       │
│                              │                                  │
│                    ┌─────────▼──────────┐                       │
│                    │  MongoDB           │                       │
│                    │  (Port 27017)      │                       │
│                    │  Runs as a system  │                       │
│                    │  service           │                       │
│                    └────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

**Key Tools:**
- **PM2** — Process manager that keeps the Node.js API running in the background, restarts it on crash, and starts it automatically on server reboot.
- **Nginx** — Lightweight web server that serves the built React app and forwards API calls to Node.js.
- **Certbot** — Free SSL certificate tool (Let's Encrypt) — makes your site HTTPS with one command.

---

### 10.3 Step-by-Step Production Deployment

#### Step 1 — Install Dependencies on the Server
```bash
# Install Node.js 20 (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# Install MongoDB 7
sudo apt install -y mongodb

# Install Nginx
sudo apt install -y nginx

# Install PM2 (Node.js process manager) globally
sudo npm install -g pm2
```

#### Step 2 — Deploy the Backend API
```bash
# Upload your backend folder to the server (via Git or SCP)
git clone https://github.com/your-org/school-management-system.git /var/www/sms
cd /var/www/sms/backend

# Install dependencies
npm install --production

# Create the .env file and fill in production values
cp .env.example .env
nano .env

# Seed initial data (first time only)
npm run db:seed

# Start the API with PM2
pm2 start src/server.js --name sms-api

# Save PM2 config so it restarts on reboot
pm2 save
pm2 startup
```

#### Step 3 — Build and Deploy the Frontend
```bash
cd /var/www/sms/frontend

# Install dependencies and build
npm install
npm run build

# The built files are in /var/www/sms/frontend/dist/
# Nginx will serve these files directly
```

#### Step 4 — Configure Nginx
Create a config file at `/etc/nginx/sites-available/sms`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Serve React frontend (static files)
    root /var/www/sms/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/sms /etc/nginx/sites-enabled/
sudo nginx -t        # Test config
sudo systemctl reload nginx
```

#### Step 5 — Enable HTTPS (Free SSL)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
# Certbot will automatically update your Nginx config for HTTPS
```

---

### 10.4 CI/CD Workflow (Simple Git-Based)

No complex pipeline tools are required. A simple Git-based deployment works well:

1. Developer pushes code to GitHub/GitLab.
2. On the server, pull the latest changes:
```bash
cd /var/www/sms
git pull origin main

# Restart backend
cd backend && npm install --production
pm2 restart sms-api

# Rebuild frontend
cd ../frontend && npm install && npm run build
```
3. Nginx continues serving the updated React build automatically.

> **Tip:** You can automate Step 2 using a simple bash script or a GitHub Actions workflow that SSH's into your server and runs the commands.

---

### 10.5 Backup Strategy
- **Database:** Run `mongodump` daily via a cron job. Store backups on a separate folder or upload to cloud storage.
  ```bash
  # Add to cron (runs daily at 2 AM):
  0 2 * * * mongodump --out /var/backups/sms/$(date +\%Y-\%m-\%d)
  ```
- **MongoDB Atlas users:** Enable automated daily backups from the Atlas dashboard — no manual setup needed.
- **Application files (uploads):** Copy `/var/www/sms/backend/uploads/` to cloud storage daily.
- **Recovery Time Objective (RTO):** < 4 hours.
- **Recovery Point Objective (RPO):** < 24 hours (daily backup).

---

## 11. Scalability Considerations

- **Horizontal scaling:** Multiple Node.js API instances behind Nginx load balancer.
- **Database connection pooling:** Mongoose's built-in connection pool (configure `maxPoolSize` in the connection string) to prevent connection exhaustion.
- **Caching:** Redis for session data and frequently-read reference data (class lists, subjects) — added in v1.1.
- **CDN:** Static React assets served via CDN for faster global delivery.
- **Async processing:** Report generation and bulk notifications processed via job queue (BullMQ + Redis) to avoid blocking API responses.
