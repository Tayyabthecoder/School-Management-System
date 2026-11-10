// Mirrors backend/src/modules/reports/export-access.js (SEC-03) so the UI only offers
// exports the server will allow. The server remains the authority.
export const EXPORT_ENTITY_ROLES = Object.freeze({
  students: ['super_admin', 'accountant', 'hr_manager'],
  attendance: ['super_admin', 'accountant', 'hr_manager'],
  grades: ['super_admin', 'accountant', 'hr_manager'],
  'academic-performance': ['super_admin', 'accountant', 'hr_manager'],
  fees: ['super_admin', 'accountant'],
  defaulters: ['super_admin', 'accountant'],
  staff: ['super_admin', 'hr_manager'],
  'staff-attendance': ['super_admin', 'hr_manager'],
  'teacher-performance': ['super_admin', 'hr_manager'],
  payroll: ['super_admin', 'hr_manager', 'accountant'],
})

export function roleNameOf(user) {
  if (!user) return ''
  if (user.roleName) return user.roleName
  return typeof user.role === 'object' ? user.role?.name || '' : user.role || ''
}

export function canExportEntity(user, entity) {
  return (EXPORT_ENTITY_ROLES[entity] || []).includes(roleNameOf(user))
}
