# UI/UX Design Document
## School Management System (SMS)

**Version:** 1.0  
**Date:** 2026-08-30  
**Status:** Draft  

---

## 1. Introduction

### 1.1 Purpose
This document defines the user interface (UI) and user experience (UX) guidelines for the School Management System. It provides designers and frontend developers with a shared reference for visual design, interaction patterns, information architecture, and screen-level wireframe descriptions.

### 1.2 Design Philosophy
The SMS serves users with varying levels of technical literacy — from Super Admins to teachers entering daily attendance. The design must be:
- **Simple & Familiar:** Common UI patterns, minimal learning curve.
- **Efficient:** Critical tasks (mark attendance, record payment) in ≤ 3 clicks.
- **Trustworthy:** Clean, professional aesthetic appropriate for an educational institution.
- **Accessible:** WCAG 2.1 AA compliant for users with disabilities.
- **Responsive:** Fully usable on desktop, tablet, and mobile browsers.

---

## 2. Design System

### 2.1 Color Palette

| Role | Color | Hex | Usage |
|---|---|---|---|
| **Primary** | Indigo | `#4F46E5` | Primary buttons, active nav items, links |
| **Primary Dark** | Deep Indigo | `#3730A3` | Hover states on primary elements |
| **Secondary** | Teal | `#0D9488` | Secondary actions, badges |
| **Success** | Green | `#16A34A` | Success alerts, paid status, present |
| **Warning** | Amber | `#D97706` | Warnings, late status, overdue |
| **Danger** | Red | `#DC2626` | Errors, absent status, unpaid overdue |
| **Neutral-50** | Off-white | `#F9FAFB` | Page backgrounds |
| **Neutral-100** | Light gray | `#F3F4F6` | Card backgrounds, table alternating rows |
| **Neutral-700** | Dark gray | `#374151` | Body text |
| **Neutral-900** | Near black | `#111827` | Headings |
| **White** | Pure white | `#FFFFFF` | Card surfaces, modals |

### 2.2 Typography

| Element | Font | Weight | Size |
|---|---|---|---|
| Display Heading | Inter | 700 (Bold) | 28–32px |
| Section Heading | Inter | 600 (Semibold) | 20–24px |
| Card Title | Inter | 600 (Semibold) | 16–18px |
| Body Text | Inter | 400 (Regular) | 14–16px |
| Label / Caption | Inter | 500 (Medium) | 12–13px |
| Monospace (IDs) | JetBrains Mono | 400 | 13px |

### 2.3 Spacing & Grid
- Base spacing unit: **4px** (use multiples: 4, 8, 12, 16, 24, 32, 48, 64).
- Layout grid: 12-column grid on desktop, 4-column on mobile.
- Content max-width: **1280px** (centered on wide screens).
- Sidebar width: **260px** (collapsible to **64px** icon-only mode).

### 2.4 Border Radius & Shadows
- Cards / Modals: `border-radius: 12px`
- Buttons: `border-radius: 8px`
- Inputs: `border-radius: 6px`
- Badges/Tags: `border-radius: 9999px` (pill)
- Card shadow: `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)`
- Modal shadow: `0 20px 25px rgba(0,0,0,0.15)`

### 2.5 Iconography
- Icon library: **Lucide React** (consistent, lightweight, open-source).
- Icon size: 16px (inline), 20px (nav), 24px (feature headers).
- All icons must have an accessible `aria-label` or accompanying visible text label.

---

## 3. Component Library (Design Tokens)

### 3.1 Buttons

| Variant | Style | Usage |
|---|---|---|
| Primary | Solid indigo, white text | Primary CTA (Save, Submit, Add New) |
| Secondary | White bg, indigo border/text | Secondary actions (Cancel, Edit) |
| Destructive | Solid red | Delete, Remove actions |
| Ghost | Transparent, gray text | Subtle actions (table row actions) |
| Icon-only | Square, icon centered | Compact actions in tables |

All buttons include focus ring, hover state, and disabled state (reduced opacity, `cursor-not-allowed`).

### 3.2 Form Inputs

| Component | Notes |
|---|---|
| Text Input | Label above, placeholder, inline error message below |
| Select / Dropdown | Searchable for lists > 10 items |
| Date Picker | Calendar popover, supports manual date entry |
| Textarea | Auto-grows, character counter on long forms |
| Checkbox / Radio | Custom styled, keyboard-accessible |
| File Upload | Drag-and-drop zone + click-to-browse |
| Search Input | Icon-left, clear button on right |

### 3.3 Data Display

| Component | Notes |
|---|---|
| Table | Sticky header, sortable columns, row hover, alternating row bg, pagination |
| Stat Card | Icon, label, value, trend indicator |
| Badge/Tag | Colored pill for status (Present/Absent, Paid/Overdue) |
| Progress Bar | For attendance percentage, fee collection rate |
| Avatar | Initials-based colored circle when no photo |
| Empty State | Illustration + message + CTA when no data found |
| Skeleton Loader | Animated placeholder while data loads |

### 3.4 Feedback & Overlays

| Component | Notes |
|---|---|
| Toast Notifications | Top-right, auto-dismiss after 4 seconds (success/error/warning) |
| Modal / Dialog | Centered overlay with backdrop blur, focus trap |
| Confirmation Dialog | For destructive actions (delete, deactivate) |
| Alert Banner | Inline, dismissible, for page-level messages |
| Loading Spinner | Full-page and inline variants |

---

## 4. Information Architecture

### 4.1 Site Map

```
SMS Application
│
├── /login                          # Authentication
│
├── /dashboard                      # Role-specific landing page
│
├── /students                       # Student management
│   ├── /students/list
│   ├── /students/new
│   ├── /students/:id               # Student profile
│   └── /students/import
│
├── /academics                      # Academic management
│   ├── /academics/classes
│   ├── /academics/subjects
│   ├── /academics/timetable
│   └── /academics/year-terms
│
├── /attendance                     # Attendance tracking
│   ├── /attendance/mark            # Teacher: mark today's attendance
│   ├── /attendance/staff           # HR: mark staff attendance
│   └── /attendance/reports
│
├── /grades                         # Grades & examinations
│   ├── /grades/exams
│   ├── /grades/entry               # Grade entry by teacher
│   └── /grades/ledger
│
├── /reports-cards                  # Report cards & transcripts
│   ├── /report-cards/generate
│   └── /report-cards/transcripts
│
├── /finance                        # Fee & finance
│   ├── /finance/fee-structures
│   ├── /finance/student-fees
│   ├── /finance/payments
│   └── /finance/reports
│
├── /hr                             # HR & payroll
│   ├── /hr/staff
│   ├── /hr/staff/new
│   ├── /hr/staff/:id
│   ├── /hr/leave
│   └── /hr/payroll
│
├── /notifications                  # Announcements & notifications
│   ├── /notifications/inbox
│   └── /notifications/create
│
├── /reports                        # Analytics & reporting
│   ├── /reports/dashboard
│   ├── /reports/standard
│   └── /reports/custom
│
└── /settings                       # System settings (Admin only)
    ├── /settings/users
    ├── /settings/roles
    ├── /settings/academic-config
    └── /settings/notifications
```

---

## 5. Navigation & Layout

### 5.1 Application Shell

The application uses a **Left Sidebar + Top Header** layout, consistent across all authenticated pages.

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: [☰ Toggle] [School Logo & Name]   [🔔] [User Menu] │
├──────────────┬──────────────────────────────────────────────┤
│   SIDEBAR    │                                              │
│              │              MAIN CONTENT AREA               │
│ • Dashboard  │                                              │
│ • Students   │   ┌─────────────────────────────────────┐   │
│ • Academics  │   │  Page Heading + Breadcrumb           │   │
│ • Attendance │   │  ─────────────────────────────────── │   │
│ • Grades     │   │                                     │   │
│ • Finance    │   │  Content (Tables / Forms / Charts)  │   │
│ • HR         │   │                                     │   │
│ • Reports    │   └─────────────────────────────────────┘   │
│ • Settings   │                                              │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

- Sidebar items visible to a user are determined by their **role permissions**.
- Active sidebar item is highlighted with indigo background and left border accent.
- Sidebar collapses to icon-only on tablet; hidden (drawer) on mobile.
- Header shows: hamburger menu (mobile), school logo, notification bell with badge, and user avatar/name with dropdown (Profile, Change Password, Logout).

---

## 6. Screen Wireframe Descriptions

### 6.1 Login Screen (`/login`)
- Centered card on a light-indigo gradient background.
- School logo at top of card.
- Form: "Username" input, "Password" input (with show/hide toggle), "Sign In" primary button.
- Error banner (red) appears below header on invalid credentials.
- No "Forgot Password" link in v1.0 (admin resets passwords).

---

### 6.2 Dashboard (`/dashboard`)

**Super Admin Dashboard:**
- **Top row:** 4 stat cards — Total Students, Today's Attendance Rate (%), Total Active Staff, Monthly Fee Collection Rate (%).
- **Middle row (2 columns):**
  - Left: Bar chart — Enrollment by Class (Grade 1–12).
  - Right: Line chart — Daily Attendance Rate for current month.
- **Bottom row (2 columns):**
  - Left: Pie chart — Fee Collection Status (Collected vs. Outstanding).
  - Right: Recent Announcements list (last 5).

**Teacher Dashboard:**
- Today's timetable (period-wise, class/subject/room).
- Attendance status for each class (marked / not yet marked).
- Recent grades submitted.
- Announcements targeted to teachers.

**Accountant Dashboard:**
- Stat cards: Today's Collections (PKR), Total Outstanding (PKR), Overdue Students count.
- Fee collection bar chart by class.
- List of recent payments.

**HR Manager Dashboard:**
- Stat cards: Total Staff, On Leave Today, Pending Leave Requests.
- Staff attendance chart.
- Payroll status for current month.

---

### 6.3 Student List (`/students/list`)
- **Page header:** "Students" title + "Add New Student" primary button + "Import CSV" secondary button.
- **Filter bar:** Search by name/ID, filter by Class, filter by Section, filter by Status (Active/Inactive).
- **Data table columns:** Student ID | Photo (avatar) | Full Name | Class | Section | Guardian Phone | Status | Actions.
- **Row actions:** View Profile (eye icon), Edit (pencil icon), Deactivate (toggle icon).
- **Pagination:** 25 rows per page, page number controls at bottom.

### 6.4 Student Profile (`/students/:id`)
- **Left column (1/3):** Avatar, student ID, status badge, class/section, quick stats (attendance %, fees outstanding).
- **Right column (2/3):** Tabbed interface:
  - **Personal Info:** Editable form — name, DOB, gender, guardian, address, blood group.
  - **Academic History:** Term-by-term grades summary.
  - **Attendance:** Monthly attendance calendar with color-coded days (green/red/amber).
  - **Fees:** Fee breakdown, payment history, outstanding balance.
  - **Documents:** Uploaded files list with upload button.

### 6.5 Add/Edit Student (`/students/new`)
- Multi-step form wizard with a progress indicator:
  - **Step 1:** Personal Information (name, DOB, gender, address, blood group).
  - **Step 2:** Guardian Details (guardian name, phone, relationship).
  - **Step 3:** Academic Placement (academic year, class, section, joining date).
  - **Step 4:** Review & Submit (summary card before saving).
- "Back" and "Next" navigation buttons; "Save" on final step.

---

### 6.6 Timetable (`/academics/timetable`)
- **Class/Section selector** dropdowns at top.
- **Weekly grid** (columns: Mon–Sat; rows: Period 1 to Period 8).
- Each cell shows: Subject name + Teacher name (abbreviated).
- Empty cells show a "+" icon to add an entry (Admin only).
- Print/Export to PDF button.
- Toggle to switch between "My Timetable" (teacher) and "Class Timetable" (admin/student).

---

### 6.7 Attendance Marking (`/attendance/mark`)
- **Teacher view:** Class/Section selector (pre-selected based on current period/day if timetable exists). Date defaults to today.
- Student list with Name | Roll No | Attendance Radio Buttons (Present / Absent / Late / Excused).
- "Mark All Present" shortcut button.
- Attendance already submitted shows a read-only view.
- "Submit Attendance" button (confirmation dialog before final submission).

---

### 6.8 Grade Entry (`/grades/entry`)
- **Step 1:** Select Exam from dropdown (shows name, date, subject, max marks).
- **Step 2:** Student list for the exam's class with:
  - Name | Roll No | Marks (numeric input, max marks shown as placeholder) | Grade (auto-calculated, read-only).
- "Save Grades" button with validation (marks ≤ max marks).
- Already-graded exams are editable until term is closed.

---

### 6.9 Fee Management (`/finance/student-fees`)
- **Filter bar:** Search by student name/ID, filter by class, filter by fee status (All / Paid / Partial / Overdue).
- **Table:** Student | Class | Total Fee (PKR) | Amount Paid | Outstanding | Due Date | Status Badge | Actions.
- **Row action — Record Payment:** Opens modal with: Student name, outstanding amount, payment input field, payment date, receipt note. "Record Payment" button generates receipt PDF.
- **Send Reminder** button (triggers SMS + WhatsApp to guardian).

---

### 6.10 Payroll (`/hr/payroll`)
- **Month/Year selector** at top.
- **Staff payroll table:** Staff ID | Name | Designation | Basic Pay | Allowances | Deductions (Absent days, other) | Net Pay | Status (Generated / Pending).
- "Run Payroll" button (generates all payroll for the selected month, shows confirmation dialog).
- Individual row: "View Payslip" (PDF), "Adjust" (edit allowances/deductions).
- "Export All Payslips" bulk action.

---

### 6.11 Reports & Analytics (`/reports`)
- **Left sub-nav:** Dashboard | Standard Reports | Custom Report Builder.
- **Standard Reports page:** Cards for each report type (Academic Performance, Attendance, Finance, HR, Enrollment). Clicking a card opens the report with date range and filter controls.
- **Custom Report Builder:**
  - Step 1: Select data source (dropdown).
  - Step 2: Apply filters (dynamic filter fields based on selected source).
  - Step 3: Select columns to display (checkbox list).
  - Step 4: Preview (paginated table) → Export to PDF / Export to Excel.

---

### 6.12 Notifications Center (`/notifications/inbox`)
- **Left panel:** List of notifications (icon, title, timestamp, read/unread dot). Filter tabs: All / Unread.
- **Right panel:** Selected notification full content.
- Unread count badge on sidebar nav item and header bell icon.

### 6.13 Create Announcement (`/notifications/create`)
- Form: Title (text input), Audience (dropdown: All / All Students / Specific Class / All Staff / Specific Role), Message body (rich text editor), Attachment (file upload), Notify via SMS & WhatsApp (toggle).
- "Preview" button shows how announcement appears to recipients.
- "Publish" button with confirmation.

---

## 7. Responsive Design Breakpoints

| Breakpoint | Width | Layout Behavior |
|---|---|---|
| Mobile | < 640px | Sidebar hidden (hamburger drawer), single-column layout, stacked form fields |
| Tablet | 640px – 1024px | Sidebar collapsed to icon-only, 2-column grids |
| Desktop | 1024px – 1280px | Full sidebar, standard layouts |
| Wide | > 1280px | Content capped at 1280px, centered |

### Key Responsive Adaptations:
- Data tables on mobile become **card-based lists** (one card per record).
- Multi-column dashboards stack to single column on mobile.
- Modals use full-screen on mobile.
- Timetable grid scrolls horizontally on small screens.

---

## 8. Accessibility Guidelines

- **Color contrast:** All text meets WCAG AA ratio (4.5:1 body, 3:1 large text).
- **Focus management:** All interactive elements have visible focus rings; modals trap focus.
- **Keyboard navigation:** Full keyboard operability (Tab, Enter, Esc, arrow keys in menus).
- **Screen reader support:** All icons with meaning have `aria-label`; tables use `<th scope>` and `<caption>`; forms use `<label for>` associations.
- **ARIA live regions:** Toast notifications and dynamic content updates are announced to screen readers.
- **No color-only information:** Status (Present/Absent) conveyed via both color and text/icon.

---

## 9. Loading & Error States

| State | Design Pattern |
|---|---|
| Initial page load | Skeleton loader matching page layout |
| Data table loading | Shimmer rows (5 placeholder rows) |
| Form submission | Button shows spinner, disabled during processing |
| API error | Inline error alert (red banner) with retry option |
| Empty table | Centered illustration + descriptive message + CTA button |
| 404 Not Found | Friendly error page with navigation link home |
| 403 Unauthorized | "Access Denied" page with role explanation |
| Server Error (500) | Friendly error page with support contact info |

---

## 10. Interaction Design Principles

- **Progressive disclosure:** Show only the information needed for the current task; use tabs and accordions for detail.
- **Confirmation for destructive actions:** Every delete/deactivate action requires a confirmation dialog.
- **Auto-save drafts:** Long forms (student registration) auto-save progress to localStorage.
- **Inline validation:** Form fields validate on blur (not only on submit), with clear error messages.
- **Optimistic UI:** Table updates reflect immediately on action with background API sync and rollback on error.
- **Consistent page structure:** Every page has Breadcrumb → Page Title → Action Buttons → Content.
