// Which staff roles may open each area. The route table, the sidebar and the command palette all
// read from here, so they cannot drift apart (they used to keep three separate copies, and the
// palette offered teachers a "Register New Student" action the API rejects with 403).
// The server remains the authority: these lists only decide what the UI shows and guards.
// Keep each list in step with the matching checkPermission(...) roles in the backend routes.
export const ACCESS = Object.freeze({
  dashboard: ['super_admin', 'accountant', 'hr_manager'], // teachers land on their workspace instead
  teacherWorkspace: ['super_admin', 'teacher'],
  academics: ['super_admin', 'teacher'],
  students: ['super_admin', 'teacher', 'accountant', 'hr_manager'],
  studentRegistration: ['super_admin', 'hr_manager'],
  promotion: ['super_admin'],
  staffDirectory: ['super_admin', 'teacher', 'hr_manager'],
  attendance: ['super_admin', 'teacher', 'hr_manager'],
  attendanceMarking: ['super_admin', 'teacher'],
  grades: ['super_admin', 'teacher'],
  finance: ['super_admin', 'accountant'],
  hr: ['super_admin', 'hr_manager'],
  myLeave: ['teacher', 'accountant', 'hr_manager'],
  reports: ['super_admin', 'accountant', 'hr_manager'],
  settings: ['super_admin'],
})
