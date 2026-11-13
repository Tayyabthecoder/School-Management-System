# SMS (School Management System): Project Report

*Compiled 2026-11-13 from four parallel read-only sub-agent audits (backend, security, frontend, tests/infra). Nothing was installed or run. Items cited with file:line come from the agents' code reading; a few line numbers are approximate. Verify before fixing.*

## 1. Overview

A full-stack school management platform (built for a Pakistani school: PKT timezone, EOBI/SESSI payroll, challans).

| Layer | Stack |
|---|---|
| Backend | Node 20, Express 4, Mongoose 8 (MongoDB 7), Redis 7 + BullMQ, Zod 4, JWT, bcryptjs, helmet, pdfkit, exceljs, winston, node-cron |
| Frontend | React 18, Vite 5, Tailwind 3, Zustand, react-router 7, axios, recharts (JavaScript, no TypeScript) |
| Infra | docker-compose (mongo, redis, backend, nginx TLS front end), GitHub Actions CI |

Roles: `super_admin`, `teacher`, `accountant`, `hr_manager`, `guardian`, `student`.

## 2. Folder structure

```
SMS/
├── README.md, docker-compose.yml, .env.example
├── .github/workflows/ci.yml        CI: backend + frontend jobs
├── certs/                          self-signed TLS pair (gitignored)
├── docs/                           7 audit/design docs (gitignored, ~3.2k lines)
├── backend/
│   ├── Dockerfile, jest.config.js
│   ├── scripts/create-admin.js     first-admin bootstrap
│   ├── seed/seed.js                demo data (not in image)
│   ├── test/integration-db.js      throwaway-DB helper
│   └── src/
│       ├── app.js, server.js
│       ├── config/                 env, database, redis, roles, constants
│       ├── middleware/             auth, rbac, validate, upload, error, logger, rate-limit
│       ├── models/                 24 Mongoose models
│       ├── modules/                16 feature modules (routes/controller/dto/service)
│       ├── services/               academic-year, monthly-challan
│       ├── jobs/                   fee-overdue worker, monthly-challan cron, queues
│       ├── utils/                  pdf/, excel, cache, audit-log, guardian-auth, ...
│       └── __tests__/              35 Jest suites
└── frontend/
    ├── Dockerfile, nginx.conf, nginx/security-headers.conf
    ├── vite.config.js, tailwind.config.js
    ├── tests/                      6 node:test files
    └── src/
        ├── App.jsx, main.jsx
        ├── routes/                 router, ProtectedRoute, RoleRoute
        ├── store/                  auth, ui, toast (Zustand)
        ├── lib/                    axios (single-flight refresh), SSE client, formatters
        ├── components/             layout/ and ui/ primitives
        └── features/               academics, attendance, auth, dashboard, finance, grades,
                                    guardian, hr, reports, settings, students, teachers
```

## 3. Key features

- **Auth and sessions:** login, rotating refresh tokens (HttpOnly, SameSite=Strict cookie), `tokenVersion` revocation, lockout after 5 failures, forced password change, per-weekday access lock.
- **Students:** CRUD, auto IDs (`STU-YYYY-NNNN`), 5-step registration wizard, Excel/JSON import, documents, ID card, section change, status, yearly promotion engine.
- **Academics:** classes, sections, subjects, academic years, timetable, teacher workspace and schedules.
- **Attendance:** per-period student registers, staff attendance, low-attendance alerts, student leave requests.
- **Grades:** exams, mark entry, publishing, report cards, transcripts, bulk class PDFs, configurable grading scale.
- **Finance:** fee structures, per-student fees, payments and receipts, concessions, challan builder, monthly challan cron, overdue job, defaulter aging.
- **HR:** staff, leave, payroll with payslip PDFs, staff attendance register.
- **Reports and analytics:** live dashboard over SSE, trends, demographics, teacher performance, cash-flow forecast, concession ROI, 7+ export entities, custom report builder, audit logs.
- **Portals:** guardian (children, attendance, grades, fees, leave) and student.
- **UX:** dark mode, command palette (Ctrl+K), keyboard shortcuts.
- **Background:** fee-overdue daily at 01:00 PKT, monthly challans on the 1st at 00:00 PKT, Redis cache with in-memory fallback.

## 4. What is solid

- Previous hardening held up. Every route group is behind `verifyToken` plus `checkPermission`. The only open routes are login, refresh, logout, health and `allowed-days`.
- Guardian and student IDOR protection (`assertStudentAccess`) covers profile, documents, fees, grades and report cards.
- NoSQL injection is mitigated (`express-mongo-sanitize`, `escapeRegex`, Zod stripping).
- The access token lives in memory only. There is no `dangerouslySetInnerHTML` or `eval`. The refresh path rotates tokens and is single-flight.
- Strict CSP and HSTS, a non-root backend container, and an env guard that rejects placeholder secrets in production.
- Compose refuses to start without secrets. Certs and `.env` files are not tracked.
- 35 backend suites with RBAC matrix, security and finance coverage, plus a coverage gate (stmts 84 / lines 86 / fn 80 / branches 62).

## 5. Bugs (by impact)

### Money and data integrity
1. **Payroll flags dropped:** `runPayrollSchema` (hr.dto.js:37-41) strips `applyIncomeTax/Eobi/Sessi`, so income tax and SESSI can never apply and EOBI is always on. `providentFund` is always 0 and `paymentStatus` is never updated.
2. **Concession race:** `applyConcession` (finance.controller.js:465-474) is a read-modify-save and can overwrite a concurrent payment.
3. **Commit failure swallowed:** `withOptionalTransaction` (finance.controller.js:39) ignores commit errors, so the API can return 201 for an unsaved payment. Without a replica set it silently runs without a transaction.
4. **Overdue job race:** `fee-overdue.worker.js:11-24` does find then `updateMany` with no status filter, so a fee paid in between is flipped to Overdue.
5. **Overdue/queue startup order:** jobs init before the async Redis connect (server.js ~30-33), so BullMQ is effectively never used and the cron fallback always runs. `redis.js:16-22` gives up permanently after 2 retries.
6. **Monthly challan:**
   - The month is read in server-local time, so on a UTC host the cron bills the wrong month (monthly-challan.service.js:60-62).
   - The `refDate+10d` due date lets a late manual run cause the next month to be skipped (:114-122).
   - There is no unique (student, structure) index, so cron plus a manual run double-bills.
   - Old concessions are copied forward forever (:210-230).
   - The 'Play Jouior' typo key is at :65.
7. **Student create is not transactional** across Student, User, StudentFee and Payment. It also doesn't validate `classId`, section or fee IDs.
8. **Promotion:** a retry after a partial `bulkWrite` can double-promote. The top class has no mapping, so nobody graduates. Unresolved students are counted as retained (promotion.controller.js:256-271).
9. **Grades:** edits after publish are not audited. Mark writes are a sequential upsert loop, so a failure leaves a partial save. `passMarks` defaults to 40 and rejects exams with `maxMarks < 40`. Pass logic is inconsistent: pass marks vs a letter-grade fail below 50 vs "not F" in analytics.

### Functional
- `status`, `rollNumber`, `transferReason` and `transportOption` are stripped by `updateStudentSchema`, so students **cannot be marked Transferred or Graduated** via the API (students.controller.js:25-31).
- Partial guardian update replaces the whole subdocument (students.controller.js:327).
- `GET /reports/custom/export` always ignores its query (reports.controller.js:898, 920).
- Unknown custom-report entities silently fall back to a students report (reports.builder.js:76).
- Export row caps run after the rows are built, and a school with over 10k students or grades cannot export at all (413).
- Report card ignores `termName` (grades.controller.js:125-166) and duplicates the reportcards module.
- Timetable: days sort alphabetically, periods 9-12 show 08:00-08:45, the teacher-conflict check isn't atomic, and POST returns 201 on an update.
- Attendance: find-then-create races end in E11000. Low-attendance alerts are written on every save with N+1 audit writes. "Days" is counted per period. Student leave approval updates only the first attendance doc, and re-marking attendance drops Excused.
- HR leave: a decided request can be flipped, there is no overlap check, and approved leave doesn't touch attendance or payroll.
- Excel import fabricates DOB 2010-01-01, gender Male and a placeholder phone. It auto-adds unknown sections and overwrites matches by name+class+phone.
- Several settings are stored but never enforced: `passingPercentage`, `autoFeeOverdueAlerts`, `maxStudentsPerSection`, `minAttendancePercentage`.
- Force-deleting a class orphans exams, fee structures and students.
- Draft payslips can be downloaded. The hr_manager dashboard shows fee totals. Collection-by-class shifts after promotion. The staff export lacks `deletedAt:null`.
- Frontend: on phones, the closed sidebar (`w-20`, fixed) overlaps content (Sidebar.jsx ~66). The role is resolved inconsistently across Sidebar, Header, CommandPalette and the route guards. The accountant has a `/students` route but no sidebar link. `window.confirm`/`alert` are used in about 10 places and `.catch(() => {})` in 5. The school name "Al-Haq Model Academy" is hardcoded. The SSE token isn't re-read after a refresh.
- Possibly missing Tailwind shades (indigo-300/400/950). This is unverified, so check visually.
- README advertises WhatsApp/SMS hooks, but no client exists.

## 6. Security findings (remaining)

**High**
1. **Teachers can write the timetable, assign themselves to any class and read any teacher's schedule:**
   - Affected: `timetable.routes.js:12-13`, `POST /teachers/assign` (`teachers.routes.js:26`, upsert), `subjects.routes.js:13-14`, `GET /teachers/:id/schedule`.
   - Because "assigned class" scope is derived from `TimetableEntry`, a teacher can grant themselves access to any class's students and grades.
   - Fix: restrict writes to `super_admin`, or verify the teacher's own assignment as `grades.controller.js:108-111` does.
2. **Lockout DoS:** 5 wrong passwords lock any username for 15 min (`auth.service.js:62-70`), while the IP limiter allows 10 attempts per 15 min, so the admin can be kept locked out. Use per-(username+IP) throttling, or alert instead of hard-locking `super_admin`.
3. **Limiter depends on `trust proxy 1`:** behind an extra proxy or CDN everyone shares one bucket. Set an explicit `keyGenerator`.

**Medium**
4. `/uploads/photos|general/*` is readable by any staff role that knows the filename (UUID limits risk). Add an ownership lookup (`serve.routes.js:19-33`).
5. `photoUrl` accepts any string (`students.dto.js:32,87`). Validate against `^/uploads/(photos|general)/[\w.-]+$`.
6. Upload checks are weak: `.txt/.csv` need only no NUL bytes, and docx/xlsx accept any ZIP. Files are served inline. Force `Content-Disposition: attachment` and add `CSP: sandbox`.
7. A 10 MB JSON body limit applies globally. Use ~100 KB, with a larger limit only on photo routes.
8. nginx lacks rate limits, `server_tokens off` and timeouts. Add `limit_req` on `/api/v1/auth/`.
9. CSP keeps `style-src 'unsafe-inline'`, and COOP/CORP headers are missing.
10. `GET /settings/allowed-days` is unauthenticated (intentional). Rate-limit it.
11. `checkPermission` fails open when a role's permission array is empty (rbac.middleware.js:32).
12. Unvalidated payloads: `updateChallanSettings` spreads `req.body` (finance.controller.js:515-534). Promotion config and the manual challan trigger have no schema.
13. Staff login role is guessed by regex on free text (hr.controller.js:86-97). "Accounts Teacher" becomes an accountant.
14. Several GETs lack `checkPermission`: grades/exams, timetable, classes, settings, subjects.
15. The custom students report exposes blood group and B-form/CNIC to accountant and hr_manager, unlike `getStudentById`.

**Low / hardening**
- No refresh-token reuse detection. Call `invalidateUserSessions` on a replayed rotated token.
- The HTTP log records full URLs including query strings (PII). Confirm audit `oldValues/newValues` never hold `passwordHash`.
- SSE streams aren't re-validated after the token expires or a user is deactivated, and the in-memory client set works on a single instance only.
- Compose has no `:?` guard on `JWT_SECRET` and `JWT_REFRESH_SECRET`. Mongo and Redis publish loopback ports, so remove them in production.
- README publishes seed credentials. Add a "dev only" note. Check `rel="noopener noreferrer"` at `ProfileHeader.jsx:125`.
- Pin `axios`, add Dependabot, make audits gate on moderate, and pin CI actions by SHA.
- Add a `permissions: contents: read` block to the workflow, plus CodeQL, secret scanning and Trivy.

## 7. Testing, CI and infrastructure

- **Backend tests:** strong on RBAC, security, finance, students, reports and uploads. Gaps: timetable, guardian, users, subjects, middleware, and the jobs and queues. `server.js` is excluded from coverage, and the branch gate of 62% is low.
- **Frontend tests:** only 6 unit files. There are no component, router or E2E tests and no coverage. This is the largest gap.
- **CI:** lint (max-warnings 0), tests, build, a demo-credential leak grep, and `npm audit` (high only). Missing: a Redis service, a Docker/compose build, an image scan, backend lint, CodeQL, concurrency control and a deploy job.
- **Docker:**
  - Node 20 reached EOL in April 2026, so move to 22 or 24.
  - Base images float. Pin them by digest.
  - There are no healthchecks, and `depends_on` has no health condition.
  - The compose `version` key is obsolete.
  - There is no backup strategy and no resource limits or log rotation.
  - The self-signed cert needs a real certificate and renewal for production.
- **Docs:** the README is accurate and detailed. `docs/` is gitignored, so collaborators and CI never see it. The README uses v1 `docker-compose` syntax and has no production, backup, upgrade or rollback guidance.
- **Dependencies:** the oldest or riskiest are `lucide-react 0.368`, `pdfkit 0.15`, eslint 8 (EOL), Vite 5, and `exceljs` (old transitive packages).

## 8. Frontend quality

- `@tanstack/react-query` is installed and wired in `App.jsx` but **never used**. About 155 `api.get` call sites hand-roll `useEffect`/`useState`, with no cache, dedupe or shared error handling. `allowed-days` is fetched in 3 places.
- Oversized components: FinancePage 1159 lines (31 `useState`), ChallanBuilderTab 1078, ClassesPage 807, AnalyticsIntelligenceTab 801, and others over 650.
- Code splitting is partial. Login and Dashboard are eager, so recharts lands in the initial bundle.
- Accessibility: 4 `aria-label`s in the whole app. Sortable `<th>` and clickable rows have no keyboard support. Modal lacks `aria-labelledby` and focus restore, and stacked modals all react to Escape. Three `<img>` tags lack `alt`. Contrast is low in places, and toasts have no `aria-live`.
- nginx: gzip omits `application/json` and has a 10 KB minimum. The SSE location needs `proxy_buffering off` and a long read timeout, and `Connection: upgrade` is sent unconditionally.

## 9. Improvement roadmap

**Do first (correctness and security)**
1. Lock down timetable, teacher-assign and subject writes to `super_admin` (or verify ownership).
2. Fix the payroll DTO, the concession and overdue races, commit-error handling, and the monthly-challan timezone and duplicate logic with a unique index.
3. Allow `status` updates so students can be marked Transferred or Graduated. Fix the partial guardian update.
4. Rework the lockout policy. Add refresh-token reuse detection.
5. Harden uploads: ownership check, `attachment` disposition, `photoUrl` regex, smaller body limit.
6. Add Zod schemas for challan settings, promotion config and the manual challan trigger. Make `checkPermission` fail closed.

**Next (quality)**
7. Start Redis and BullMQ before scheduling the jobs, and make Redis reconnect indefinitely.
8. Add tests for timetable, guardian, users, jobs and middleware. Raise the branch gate to 75% or more.
9. Add frontend Vitest/RTL tests and a Playwright smoke test.
10. Move the frontend to react-query. Add a `useRole()` hook and a single route/nav config. Build a `ConfirmDialog` and remove the swallowed catches.
11. Fix the mobile sidebar. Do an accessibility pass. Lazy-load the Dashboard and recharts. Split the giant pages.
12. Unify the pass-mark logic. Wire up or remove the unused settings. Audit grade edits.

**Ops**
13. Upgrade to Node 22/24, pin images, add healthchecks and `.dockerignore`, and drop host DB ports in production.
14. Extend CI with Redis, a Docker build, Trivy, CodeQL, Dependabot and least-privilege `permissions`.
15. Write production docs for TLS, backups, secret rotation and upgrades. Decide whether `docs/` should be tracked.
16. Update the old dependencies (lucide-react, pdfkit, eslint 9, Vite 6+).

## 10. Caveats
These are static-analysis findings from sub-agents. The agents read the code but ran no tests, builds or exploits. The frontend agent only grepped most feature pages. The Tailwind colour and Express-version claims are unverified. Confirm each item before acting.
