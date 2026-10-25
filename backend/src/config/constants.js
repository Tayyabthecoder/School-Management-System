const ROLES = {
  SUPER_ADMIN: 'super_admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  GUARDIAN: 'guardian',
  ACCOUNTANT: 'accountant',
  HR_MANAGER: 'hr_manager',
}

const ATTENDANCE_STATUS = {
  STUDENT: ['Present', 'Absent', 'Late', 'Excused'],
  STAFF: ['Present', 'Absent', 'Late', 'On Leave'],
}

const FEE_STATUS = {
  PAID: 'Paid',
  PARTIAL: 'Partial',
  OVERDUE: 'Overdue',
  PENDING: 'Pending',
}

const LEAVE_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

const GENDER = ['Male', 'Female', 'Other']

const MODULES = [
  'users',
  'students',
  'classes',
  'timetable',
  'attendance',
  'grades',
  'report_cards',
  'finance',
  'hr',
  'payroll',
  'reports',
  'settings',
]

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DEFAULT_ALLOWED_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || (process.env.NODE_ENV === 'test' ? '4' : '12'), 10)

module.exports = {
  ROLES,
  ATTENDANCE_STATUS,
  FEE_STATUS,
  LEAVE_STATUS,
  GENDER,
  MODULES,
  DAYS_OF_WEEK,
  DEFAULT_ALLOWED_DAYS,
  BCRYPT_ROUNDS,
}
