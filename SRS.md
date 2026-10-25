# Software Requirements Specification (SRS)
## School Management System (SMS)

**Version:** 1.0  
**Date:** 2026-08-30  
**Status:** Draft  

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) defines the complete functional and non-functional requirements for the School Management System (SMS). It serves as the authoritative reference for developers, QA engineers, project managers, and stakeholders throughout the development lifecycle.

### 1.2 Scope
The SMS is a standalone, web-based application for a large K-12 school with 2,000–5,000 students. It covers student enrollment, academic management, attendance, grades, finance, HR/payroll, notifications, and analytics. The system does NOT include a parent portal, LMS, library, or transport module in version 1.0.

### 1.3 Definitions & Abbreviations

| Term | Definition |
|---|---|
| SMS | School Management System |
| RBAC | Role-Based Access Control |
| PKR | Pakistani Rupee |
| KPI | Key Performance Indicator |
| UAT | User Acceptance Testing |
| API | Application Programming Interface |
| PDF | Portable Document Format |
| OTP | One-Time Password |
| SRS | Software Requirements Specification |

### 1.4 References
- PRD – School Management System v1.0
- WCAG 2.1 AA Accessibility Guidelines
- OWASP Top 10 Security Standards

---

## 2. Overall Description

### 2.1 Product Perspective
The SMS is a new, standalone system. It replaces existing manual/paper-based workflows and any disconnected spreadsheet tools currently in use. All data is stored centrally in a relational database accessible via a web interface.

### 2.2 Product Functions (Summary)

1. User & role management with RBAC
2. Student enrollment and profile management
3. Academic year, timetable, and subject management
4. Student and staff attendance tracking
5. Grade and examination management
6. Automated report card and transcript generation
7. Fee structure, payment recording, and financial reporting
8. Staff HR management and payroll processing
9. SMS and WhatsApp notifications and announcements
10. Analytics dashboard and custom report generation

### 2.3 User Classes & Roles

| Role | Access Level | Primary Responsibilities |
|---|---|---|
| Super Admin | Full system access | System config, user management, audit logs |
| Teacher | Academic module | Attendance entry, grade entry, timetable view |
| Student | Read-only (own data) | View grades, attendance, timetable, announcements |
| Accountant | Finance module | Fee management, payment recording, financial reports |
| HR Manager | HR/Payroll module | Staff management, leave management, payroll |

### 2.4 Operating Environment
- **Client:** Modern web browser (Chrome 100+, Firefox 100+, Edge 100+, Safari 15+)
- **Server:** Linux-based cloud or on-premise server
- **Database:** Relational database (PostgreSQL recommended)
- **Connectivity:** Requires internet for SMS/WhatsApp gateway; can run on LAN for core features

### 2.5 Assumptions & Dependencies
- A third-party SMS gateway (e.g., Twilio, Jazz SMS) will be procured separately.
- A WhatsApp Business API or third-party WhatsApp service (e.g., Twilio, 360dialog) will be configured.
- The school will provide valid phone numbers for all student guardians and staff.
- Administrators are responsible for initial data setup (classes, subjects, staff, students).

---

## 3. Functional Requirements

---

### 3.1 Authentication & User Management

#### FR-AU-01: User Login
- The system SHALL provide a login page with username and password fields.
- The system SHALL authenticate users against stored, hashed credentials.
- The system SHALL display an appropriate error message for invalid credentials.
- The system SHALL lock an account after 5 consecutive failed login attempts (lockout duration: 15 minutes).

#### FR-AU-02: Session Management
- Authenticated sessions SHALL expire after 60 minutes of inactivity.
- The system SHALL provide a "Logout" function that immediately invalidates the session.

#### FR-AU-03: Password Management
- The system SHALL enforce a minimum password length of 8 characters.
- Passwords SHALL contain at least one uppercase letter, one number, and one special character.
- Super Admin SHALL be able to reset any user's password.
- Users SHALL be able to change their own password from their profile page.

#### FR-AU-04: Role-Based Access Control (RBAC)
- Each user SHALL be assigned exactly one role.
- The system SHALL restrict UI navigation and API endpoints based on the user's role.
- The Super Admin SHALL be able to create, edit, deactivate, and delete user accounts.
- The Super Admin SHALL be able to assign and change user roles.

---

### 3.2 Student Enrollment & Registration

#### FR-EN-01: Student Registration
- Authorized users (Super Admin, HR Manager) SHALL be able to register new students via a web form.
- Required fields: Full Name, Date of Birth, Gender, Guardian Name, Guardian Phone, Guardian Email (optional), Class, Section, Joining Date, Blood Group (optional), Address.
- The system SHALL auto-generate a unique Student ID upon registration.

#### FR-EN-02: Student Profile Management
- Super Admin SHALL be able to view, edit, and deactivate any student profile.
- Student profiles SHALL support document attachment (e.g., birth certificate, previous report cards).
- The system SHALL maintain a complete history of edits to student profiles (audit log).

#### FR-EN-03: Class & Section Assignment
- A student SHALL be assigned to one class and one section at any given time.
- Super Admin SHALL be able to reassign a student to a different class/section.
- The system SHALL support annual re-enrollment (promoting students to the next class).

#### FR-EN-04: Transfer & Withdrawal
- The system SHALL support marking a student as Transferred or Withdrawn.
- A reason and date SHALL be recorded for any transfer/withdrawal.
- Transferred/withdrawn students SHALL be retained in the system as inactive records.

#### FR-EN-05: Bulk Import
- Super Admin SHALL be able to import student records from a CSV or Excel file.
- The system SHALL validate imported data and report errors row-by-row before committing.

---

### 3.3 Academic & Timetable Management

#### FR-AC-01: Academic Year & Term Configuration
- Super Admin SHALL be able to configure academic years (e.g., 2026) and terms/semesters.
- All academic data (attendance, grades) SHALL be scoped to a specific academic year and term.

#### FR-AC-02: Class, Section & Subject Management
- Super Admin SHALL be able to create, edit, and delete classes (e.g., Grade 1–12), sections (e.g., A, B, C), and subjects.
- Subjects SHALL be assigned to specific classes.

#### FR-AC-03: Teacher-Subject-Class Assignment
- Super Admin SHALL be able to assign teachers to subjects within a specific class and section.
- A teacher may be assigned to multiple subjects and classes.

#### FR-AC-04: Timetable Management
- Super Admin SHALL be able to create and publish timetables for each class/section.
- Timetables SHALL define periods, subjects, assigned teachers, and rooms.
- Teachers SHALL be able to view their own timetable.
- Students SHALL be able to view their class timetable.

---

### 3.4 Attendance Tracking

#### FR-AT-01: Student Attendance
- A Teacher SHALL be able to mark attendance for their assigned class/subject per period or per day.
- Attendance statuses: Present, Absent, Late, Excused.
- A teacher SHALL only access attendance for their assigned classes.
- The system SHALL prevent duplicate attendance entries for the same class on the same day.

#### FR-AT-02: Staff Attendance
- HR Manager SHALL be able to record daily attendance for all staff members.
- Staff attendance statuses: Present, Absent, Late, On Leave.

#### FR-AT-03: Attendance Summary
- The system SHALL generate attendance summaries by student, class, teacher, and date range.
- The system SHALL highlight students with attendance below a configurable threshold (default: 75%).

#### FR-AT-04: Absence Notifications
- The system SHALL automatically send an SMS and WhatsApp message to a student's guardian when the student is marked Absent.
- Notification delivery status SHALL be logged.

---

### 3.5 Grades & Examinations

#### FR-GR-01: Grading Configuration
- Super Admin SHALL be able to configure grading scales (e.g., percentage-based, letter grades A–F, GPA 0–4.0).
- Multiple grading scales MAY be configured for different grade levels.

#### FR-GR-02: Exam/Assessment Schedule
- Super Admin or Teacher SHALL be able to create exam schedules (name, date, subject, class, max marks).
- Exam schedules SHALL be visible to relevant teachers and students.

#### FR-GR-03: Grade Entry
- A Teacher SHALL be able to enter marks/grades for each student in their assigned class and subject.
- The system SHALL calculate percentage and letter grade automatically from entered marks.
- Grades SHALL be editable by the teacher until the term is closed by the Super Admin.
- The system SHALL validate that entered marks do not exceed the configured maximum marks.

#### FR-GR-04: Grade Ledger
- Super Admin and Teachers SHALL be able to view a grade ledger for any class/subject.
- The ledger SHALL show all students' marks, calculated percentages, and grade letters.

#### FR-GR-05: Promotion Rules
- Super Admin SHALL be able to configure minimum pass percentage per subject.
- The system SHALL flag students who do not meet promotion criteria at end of term.

---

### 3.6 Report Cards & Transcripts

#### FR-RC-01: Report Card Generation
- The system SHALL auto-generate report cards from submitted grades at end of term.
- Report cards SHALL include: student info, class, term, subject-wise marks, totals, percentage, grade, teacher remarks, and attendance summary.
- Super Admin SHALL be able to define report card templates per grade level.

#### FR-RC-02: Report Card Export
- Report cards SHALL be exportable as PDF for printing.
- Super Admin SHALL be able to bulk-export report cards for an entire class.

#### FR-RC-03: Student Transcripts
- Super Admin SHALL be able to generate a full academic transcript for a student covering all recorded academic years.
- Transcripts SHALL be exportable as PDF.

---

### 3.7 Fee & Finance Management

#### FR-FN-01: Fee Structure Configuration
- Accountant and Super Admin SHALL be able to define fee types (e.g., Tuition, Admission, Exam, Transport).
- Fee amounts SHALL be configurable per class or per individual student.
- The system SHALL support fixed fees and flexible fees (discounts, scholarships, installment plans).

#### FR-FN-02: Fee Assignment
- The system SHALL automatically assign applicable fees to students based on their class.
- Custom fees or discounts SHALL be assignable to individual students.

#### FR-FN-03: Payment Recording
- Accountant SHALL be able to record payments against a student's outstanding fee.
- The system SHALL generate a payment receipt (PDF) for each transaction.
- Partial payments SHALL be recorded against installment plans.

#### FR-FN-04: Overdue & Penalties
- The system SHALL automatically calculate overdue fees based on payment due dates.
- Super Admin SHALL be able to configure late payment penalty rules.
- Automated SMS/WhatsApp reminders SHALL be sent to guardians for overdue fees.

#### FR-FN-05: Financial Reporting
- Accountant and Super Admin SHALL be able to generate:
  - Daily/Monthly collection reports
  - Outstanding fee reports (by class, student)
  - Fee waiver/discount reports
  - Payroll expense reports
- Reports SHALL be exportable to PDF and Excel.

---

### 3.8 HR & Payroll (Staff Management)

#### FR-HR-01: Staff Registration
- HR Manager and Super Admin SHALL be able to register staff with: Full Name, CNIC, Phone, Email, Designation, Department, Joining Date, Salary details.
- The system SHALL auto-generate a unique Staff ID.

#### FR-HR-02: Staff Profile Management
- HR Manager SHALL be able to view, edit, and deactivate staff profiles.
- Document attachments (e.g., contract, qualifications) SHALL be supported.

#### FR-HR-03: Leave Management
- HR Manager SHALL be able to define leave types (Annual, Sick, Casual, Unpaid).
- Staff SHALL be able to apply for leave via the system.
- HR Manager SHALL be able to approve or reject leave requests.
- The system SHALL maintain leave balances per staff member per year.

#### FR-HR-04: Payroll Processing
- HR Manager SHALL be able to run monthly payroll for all active staff.
- Payroll SHALL calculate: Basic Pay + Allowances − Deductions (tax, absent days, advances).
- The system SHALL generate payslips (PDF) per employee per month.
- Payroll records SHALL be stored and retrievable by month/year.

#### FR-HR-05: Staff Attendance Integration
- Staff attendance (FR-AT-02) SHALL be used to calculate absent-day deductions in payroll.

---

### 3.9 Notifications & Announcements

#### FR-NO-01: In-System Notifications
- The system SHALL display a notification bell/center for all logged-in users.
- Unread notification count SHALL be visible on the navigation bar.

#### FR-NO-02: SMS & WhatsApp Notifications
- The system SHALL integrate with an SMS gateway and a WhatsApp Business API.
- Automated triggers for SMS/WhatsApp:
  - Student marked Absent → guardian notified.
  - Fee payment overdue → guardian notified.
  - New announcement published → relevant recipients notified.
  - Exam schedule published → students/teachers notified.
  - Payslip generated → staff notified.
- Manual SMS/WhatsApp broadcast SHALL be available to Super Admin.

#### FR-NO-03: Announcements
- Super Admin and Teachers SHALL be able to create announcements.
- Announcements SHALL be targetable to: All Users, All Students, Specific Class, All Staff, Specific Role.
- Announcements SHALL support text content and file attachments.
- Notifications SHALL be sent to targeted recipients upon announcement publication.

---

### 3.10 Reporting & Analytics Dashboard

#### FR-RP-01: Dashboard
- Super Admin, Accountant, and HR Manager SHALL each have a role-specific dashboard upon login.
- Dashboards SHALL display KPIs:
  - Super Admin: Total students, today's attendance rate, total staff, monthly fee collection rate.
  - Accountant: Total outstanding fees, today's collections, overdue count.
  - HR Manager: Total staff, staff on leave today, pending leave requests.
- Dashboards SHALL include charts (bar, line, pie) rendered in-browser.

#### FR-RP-02: Standard Reports
- The system SHALL provide pre-built reports for:
  - Student academic performance (by student, class, subject, term).
  - Student and staff attendance (by day, week, month, year).
  - Fee collection and outstanding (by class, student, fee type).
  - Enrollment and demographics (by class, gender, age group).
  - Teacher performance (attendance, grades submitted on time).

#### FR-RP-03: Custom Report Builder
- Super Admin and Accountant SHALL be able to build custom reports by selecting:
  - Data source (Students, Attendance, Grades, Finance, Staff).
  - Filters (date range, class, section, student, subject, staff).
  - Columns to display.
  - Grouping and sorting.

#### FR-RP-04: Report Export
- All reports SHALL be exportable to PDF.
- All tabular reports SHALL be exportable to Excel (.xlsx).

---

## 4. External Interface Requirements

### 4.1 User Interfaces
- The system SHALL provide a responsive web UI compatible with all major browsers.
- The UI SHALL function correctly on screens from 360px (mobile) to 2560px (desktop).
- All forms SHALL include inline validation with clear error messages.

### 4.2 Software Interfaces
- **SMS Gateway API:** RESTful API integration (e.g., Twilio, Jazz SMS, or local provider) for outbound SMS.
- **WhatsApp Business API:** Integration via WhatsApp Business API or aggregator (e.g., Twilio, 360dialog).
- **Email (Optional):** SMTP integration for system-generated emails (password reset, reports).

### 4.3 Hardware Interfaces
- No hardware interfaces in v1.0 (no biometric/RFID devices).

### 4.4 Communication Interfaces
- All browser-server communication SHALL use HTTPS (TLS 1.2 or higher).
- REST API endpoints SHALL use JSON for request/response payloads.

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Page load time SHALL be < 3 seconds for 95% of requests under normal load.
- The system SHALL support at least 500 concurrent users without degradation.
- Report generation (up to 5,000 rows) SHALL complete within 10 seconds.

### 5.2 Scalability
- The system architecture SHALL support horizontal scaling of application servers.
- The database SHALL be designed to handle at least 5,000 students, 500 staff, and 5 years of historical data.

### 5.3 Reliability & Availability
- System uptime SHALL be ≥ 99.5% (excluding planned maintenance).
- Planned maintenance SHALL be scheduled outside of school hours (10 PM – 5 AM PKT).
- Automated daily database backups SHALL be retained for a minimum of 30 days.

### 5.4 Security
- Passwords SHALL be hashed using bcrypt (cost factor ≥ 12).
- All data in transit SHALL be encrypted via HTTPS/TLS.
- All sensitive data at rest (PII, payroll) SHALL be encrypted.
- RBAC SHALL be enforced at both the UI and API layer.
- The system SHALL log all Create, Update, and Delete operations with user ID and timestamp.
- The system SHALL be protected against OWASP Top 10 vulnerabilities (SQL injection, XSS, CSRF, etc.).

### 5.5 Usability
- A new user with basic computer literacy SHALL be able to complete core tasks (attendance, grade entry) without training beyond a 2-hour orientation.
- The system SHALL comply with WCAG 2.1 Level AA accessibility guidelines.

### 5.6 Maintainability
- The codebase SHALL follow consistent coding standards with documentation for all modules.
- The system SHALL use environment-based configuration (no hardcoded credentials or URLs).

### 5.7 Portability
- The application SHALL be containerized (Docker) for portability across cloud and on-premise environments.

---

## 6. Data Requirements

### 6.1 Data Retention
- Student academic records SHALL be retained indefinitely.
- Financial records SHALL be retained for a minimum of 7 years.
- Audit logs SHALL be retained for a minimum of 2 years.
- Inactive user accounts SHALL be retained for 1 year before purging.

### 6.2 Data Integrity
- All critical relationships (student–class, grade–student, fee–student) SHALL be enforced via database foreign key constraints.
- Soft deletion SHALL be used for student and staff records (no hard deletes).

### 6.3 Data Privacy
- Personal data (student PII, staff PII) SHALL be accessible only to authorized roles.
- Guardian contact information SHALL not be exposed to Teacher or Student roles.
