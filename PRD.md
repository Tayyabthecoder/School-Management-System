# Product Requirements Document (PRD)
## School Management System (SMS)

**Version:** 1.0  
**Date:** 2026-08-30  
**Status:** Draft  

---

## 1. Executive Summary

The School Management System (SMS) is a comprehensive, web-based platform designed to streamline and digitize administrative, academic, financial, and human resource operations for a large K-12 school (serving 2,000–5,000 students). The system will serve five primary user roles — Super Admin, Teachers, Students, Accountant/Finance Staff, and HR/Staff Manager — and will be accessible via a responsive web application on any modern browser and device. The platform uses SMS and WhatsApp for external notifications, supports PKR currency, and follows a January–December academic year structure.

---

## 2. Problem Statement

Large K-12 schools currently face significant operational challenges:

- **Manual, paper-based processes** for enrollment, attendance, and grade recording are error-prone and slow.
- **Fragmented systems** for finance, HR, and academics result in data silos and duplication.
- **Lack of real-time communication** between administration, teachers, and stakeholders.
- **Insufficient analytics** make it difficult for leadership to make informed decisions.
- **No centralized platform** to manage the full student and staff lifecycle.

The SMS addresses all of these pain points in a single, integrated solution.

---

## 3. Goals & Objectives

| Goal | Measurable Outcome |
|---|---|
| Digitize student enrollment | 100% of student records stored digitally within one academic year |
| Automate attendance tracking | Daily attendance submitted by teachers within the system by end of each day |
| Streamline fee collection | Finance staff can generate fee statements and record payments in < 2 minutes |
| Improve grade management | Report cards generated automatically from entered grades |
| Enhance communication | Notifications delivered via SMS and WhatsApp within 60 seconds of trigger |
| Provide actionable analytics | Dashboards updated in real-time with key KPIs for school leadership |
| Reduce administrative overhead | Reduce manual paperwork by at least 70% within the first year |

---

## 4. Target Users & Personas

### 4.1 Super Admin / System Administrator
- **Profile:** IT personnel or senior school administrator.
- **Needs:** Full control over system configuration, user management, data backup, and audit logs.
- **Pain Point:** Currently manages data across multiple disconnected tools.

### 4.2 Teacher / Instructor
- **Profile:** Academic staff responsible for one or more classes/subjects.
- **Needs:** Quick attendance entry, grade submission, timetable access, and announcements.
- **Pain Point:** Spends excessive time on paperwork instead of teaching.

### 4.3 Student
- **Profile:** K-12 student aged 5–18.
- **Needs:** Access to own timetable, grades, attendance record, and school announcements.
- **Pain Point:** Often unaware of their academic standing until formal reports.

### 4.4 Accountant / Finance Staff
- **Profile:** Financial officer responsible for fee collection and financial reporting.
- **Needs:** Fee schedule management, payment recording, overdue tracking, and financial reporting.
- **Pain Point:** Manual reconciliation of payments is time-consuming and error-prone.

### 4.5 HR / Staff Manager
- **Profile:** Human resources officer managing staff records, payroll, and leave.
- **Needs:** Staff registration, payroll processing, leave management, and staff attendance.
- **Pain Point:** Payroll calculations are manual and subject to frequent errors.

---

## 5. Core Modules & Features

### 5.1 Student Enrollment & Registration
- Online and offline student registration form.
- Student profile management (personal info, guardian details, documents).
- Class/grade assignment and re-enrollment each academic year.
- Student ID generation and management.
- Transfer and withdrawal processing.
- Bulk import via CSV/Excel.

### 5.2 Academic / Timetable Management
- Academic year and term/semester configuration.
- Class, section, and subject management.
- Teacher-subject-class assignment.
- Timetable creation (drag-and-drop or manual entry).
- Timetable view for teachers, students, and administrators.
- Substitute/cover class management.

### 5.3 Attendance Tracking (Students & Staff)
- Manual mark-entry attendance by teachers per class/period.
- Staff attendance managed by HR.
- Daily, weekly, and monthly attendance summaries.
- Automated absence alerts via SMS/WhatsApp to guardians.
- Attendance reporting and analytics.

### 5.4 Grades & Examinations
- Configurable grading scales (percentage, letter grade, GPA).
- Exam/assessment schedule management.
- Manual grade entry by teachers per subject and student.
- Grade ledger and history.
- Automatic promotion/retention rules (configurable).

### 5.5 Report Cards & Transcripts
- Auto-generated report cards from grade data.
- Customizable report card templates per grade level.
- PDF export for printing and sharing.
- Student transcript generation.
- Academic progress history.

### 5.6 Fee & Finance Management
- Fixed and flexible fee structures (per class, per student, scholarship, discounts).
- Fee schedule creation and assignment.
- Installment plan support.
- Payment recording and receipt generation.
- Overdue fee tracking and penalty calculation.
- Financial dashboards (collection rate, outstanding amounts).
- PDF and Excel financial reports.

### 5.7 HR & Payroll (Staff Management)
- Staff registration and profile management.
- Staff role and department assignment.
- Leave management (leave types, balances, requests, approvals).
- Payroll calculation (basic pay, allowances, deductions).
- Payslip generation (PDF).
- Staff attendance integration.
- Performance records.

### 5.8 Notifications & Announcements
- In-system notification center.
- SMS notifications (absence alerts, fee reminders, exam schedules).
- WhatsApp notifications (same event triggers as SMS).
- Announcement creation and broadcast by role (all students, all teachers, specific class).
- Notification history and delivery status tracking.

### 5.9 Reporting & Analytics Dashboard
- Live dashboard with KPIs: enrollment numbers, daily attendance rate, fee collection rate, staff headcount.
- Student academic performance reports.
- Attendance reports (by class, student, date range).
- Financial/fee collection reports.
- Teacher performance reports.
- Enrollment & demographic reports.
- Custom report builder (filter by fields, date range, group).
- Export all reports to PDF and Excel.

---

## 6. Non-Functional Requirements

| Requirement | Specification |
|---|---|
| **Performance** | Page load time < 3 seconds; support 500 concurrent users |
| **Scalability** | Must support 2,000–5,000 students without performance degradation |
| **Availability** | 99.5% uptime; maintenance windows during off-peak hours |
| **Security** | RBAC, encrypted data at rest and in transit (HTTPS/TLS), secure password hashing |
| **Usability** | Intuitive UI; staff with basic computer literacy should require < 2 hours of training |
| **Responsiveness** | Fully functional on desktop, tablet, and mobile browsers |
| **Localization** | English language, PKR currency, January–December academic year |
| **Accessibility** | WCAG 2.1 AA compliance |
| **Data Backup** | Automated daily backups with 30-day retention |
| **Audit Logs** | All critical actions (create, update, delete) logged with user and timestamp |

---

## 7. Constraints & Assumptions

- The system is a **standalone web application** (no third-party service integrations beyond SMS/WhatsApp notification gateways).
- **Authentication** is username and password only; no SSO or biometric integration.
- **Attendance** is entered manually by teachers and HR staff (no RFID/biometric hardware).
- **Grades** are entered manually by teachers (no online assessment engine).
- The system will use a single **currency (PKR)**.
- The system will follow a **January–December** academic year.
- **Access control** follows a strict RBAC model; permissions are assigned by role, not individual users.

---

## 8. Success Metrics

| Metric | Target |
|---|---|
| System adoption rate (staff) | ≥ 90% active users within 3 months of launch |
| Student data completeness | ≥ 95% complete student profiles |
| Attendance entry compliance | ≥ 95% of classes with attendance submitted same day |
| Fee report accuracy | Zero manual reconciliation errors in fee statements |
| User satisfaction score | ≥ 4.0 / 5.0 from post-launch survey |

---

## 9. Out of Scope (v1.0)

- Parent/Guardian portal or mobile app.
- Online fee payment gateway.
- Learning Management System (LMS) or online classes.
- Library management module.
- Transport/bus route management.
- Hostel/dormitory management.
- Biometric or RFID attendance integration.
- Third-party accounting software integration.
- Multi-school / district management.

> These features may be considered for future versions.

---

## 10. Timeline Overview

| Phase | Duration | Description |
|---|---|---|
| Phase 1 – Foundation | Weeks 1–4 | Project setup, authentication, RBAC, user management |
| Phase 2 – Academic Core | Weeks 5–10 | Enrollment, timetable, attendance, grades |
| Phase 3 – Finance & HR | Weeks 11–16 | Fee management, HR, payroll |
| Phase 4 – Reports & Notifications | Weeks 17–20 | Dashboards, reports, SMS/WhatsApp |
| Phase 5 – QA & Launch | Weeks 21–24 | Testing, UAT, deployment, training |
