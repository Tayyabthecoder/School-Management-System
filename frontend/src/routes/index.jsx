import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'
import AppShell from '../components/layout/AppShell'

import LoginPage from '../features/auth/LoginPage'
import DashboardPage from '../features/dashboard/DashboardPage'
import PageLoader from '../components/ui/PageLoader'

const ChangePasswordPage = lazy(() => import('../features/auth/ChangePasswordPage'))
const StudentListPage = lazy(() => import('../features/students/StudentListPage'))
const StudentProfilePage = lazy(() => import('../features/students/StudentProfilePage'))
const PromotionPage = lazy(() => import('../features/students/PromotionPage'))
const TeachersPage = lazy(() => import('../features/teachers/TeachersPage'))
const TeacherWorkspacePage = lazy(() => import('../features/teachers/TeacherWorkspacePage'))
const ClassesPage = lazy(() => import('../features/academics/ClassesPage'))
const TimetablePage = lazy(() => import('../features/academics/TimetablePage'))
const AttendancePage = lazy(() => import('../features/attendance/AttendancePage'))
const GradesPage = lazy(() => import('../features/grades/GradesPage'))
const ReportCardPage = lazy(() => import('../features/grades/ReportCardPage'))
const FinancePage = lazy(() => import('../features/finance/FinancePage'))
const HRPage = lazy(() => import('../features/hr/HRPage'))
const ReportsPage = lazy(() => import('../features/reports/ReportsPage'))
const SettingsPage = lazy(() => import('../features/settings/SettingsPage'))
const GuardianLayout = lazy(() => import('../features/guardian/GuardianLayout'))
const GuardianPortalPage = lazy(() => import('../features/guardian/GuardianPortalPage'))
const StudentLayout = lazy(() => import('../features/students/StudentLayout'))
const StudentPortalPage = lazy(() => import('../features/students/StudentPortalPage'))

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* Guardian dedicated portal layout without admin sidebar */}
        <Route element={<GuardianLayout />}>
          <Route path="/guardian-portal" element={<GuardianPortalPage />} />
        </Route>

        {/* Student dedicated portal layout without admin sidebar */}
        <Route element={<StudentLayout />}>
          <Route path="/student-portal" element={<StudentPortalPage />} />
        </Route>

        {/* Main Administrative / Faculty AppShell */}
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Teacher workspace */}
          <Route element={<RoleRoute allowedRoles={['super_admin', 'teacher']} />}>
            <Route path="/teacher/workspace" element={<TeacherWorkspacePage />} />
          </Route>

          {/* Academic & Timetable Management */}
          <Route element={<RoleRoute allowedRoles={['super_admin', 'teacher']} />}>
            <Route path="/academics" element={<ClassesPage />} />
            <Route path="/academics/timetable" element={<TimetablePage />} />
          </Route>

          {/* Student Directory & Profiles */}
          <Route element={<RoleRoute allowedRoles={['super_admin', 'teacher', 'accountant', 'hr_manager']} />}>
            <Route path="/students" element={<StudentListPage />} />
            <Route path="/students/:id" element={<StudentProfilePage />} />
          </Route>

          {/* Student Annual Promotion Engine */}
          <Route element={<RoleRoute allowedRoles={['super_admin']} />}>
            <Route path="/students/promotion" element={<PromotionPage />} />
          </Route>

          {/* Faculty / Staff Directory */}
          <Route element={<RoleRoute allowedRoles={['super_admin', 'hr_manager', 'teacher']} />}>
            <Route path="/teachers" element={<TeachersPage />} />
          </Route>

          {/* Attendance Tracking */}
          <Route element={<RoleRoute allowedRoles={['super_admin', 'teacher', 'hr_manager']} />}>
            <Route path="/attendance" element={<AttendancePage />} />
          </Route>

          {/* Grades & Examination */}
          <Route element={<RoleRoute allowedRoles={['super_admin', 'teacher']} />}>
            <Route path="/grades" element={<GradesPage />} />
            <Route path="/grades/report-cards" element={<ReportCardPage />} />
          </Route>

          {/* Finance & Fee Collection */}
          <Route element={<RoleRoute allowedRoles={['super_admin', 'accountant']} />}>
            <Route path="/finance" element={<FinancePage />} />
          </Route>

          {/* Human Resources & Payroll */}
          <Route element={<RoleRoute allowedRoles={['super_admin', 'hr_manager']} />}>
            <Route path="/hr" element={<HRPage />} />
          </Route>

          {/* Reporting & Analytics */}
          <Route element={<RoleRoute allowedRoles={['super_admin', 'accountant', 'hr_manager']} />}>
            <Route path="/reports" element={<ReportsPage />} />
          </Route>

          {/* System Administration & Settings */}
          <Route element={<RoleRoute allowedRoles={['super_admin']} />}>
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </Suspense>
  )
}
