/**
 * Single source of truth for the built-in roles and their module permissions.
 *
 * `checkPermission(roles, module, action)` enforces BOTH the route's role list and
 * the role's `permissions`. These grants must therefore cover every
 * (role, module, action) that a route allows; `rbac-matrix.test.js` scans all route
 * files and fails when a route references a permission a role does not have.
 */
const CRUD = ['create', 'read', 'update', 'delete']

const DEFAULT_ROLES = [
  {
    name: 'super_admin',
    displayName: 'Super Admin',
    description: 'Full administrative and configuration privileges',
    permissions: [
      'students', 'classes', 'academics', 'attendance', 'grades', 'finance', 'hr',
      'payroll', 'staff', 'reports', 'timetable', 'settings', 'users',
    ].map((module) => ({ module, actions: CRUD })),
  },
  {
    name: 'teacher',
    displayName: 'Teacher',
    description: 'Academic rosters, attendance, grades, timetable and own HR self-service',
    permissions: [
      { module: 'attendance', actions: ['create', 'read', 'update'] },
      { module: 'grades', actions: ['create', 'read', 'update'] },
      { module: 'academics', actions: ['read'] },
      { module: 'students', actions: ['read'] },
      { module: 'timetable', actions: ['create', 'read', 'delete'] },
      { module: 'classes', actions: ['create', 'update'] },
      { module: 'staff', actions: ['read'] },
      { module: 'finance', actions: ['read'] },
      { module: 'reports', actions: ['read'] },
      // Self-service: submit/view own leave and download own payslip
      { module: 'hr', actions: ['create', 'read'] },
      { module: 'payroll', actions: ['read'] },
    ],
  },
  {
    name: 'student',
    displayName: 'Student',
    description: 'Personal academic history, timetable, and fee status',
    permissions: [
      { module: 'grades', actions: ['read'] },
      { module: 'timetable', actions: ['read'] },
      { module: 'attendance', actions: ['read'] },
      { module: 'finance', actions: ['read'] },
      { module: 'students', actions: ['read'] },
    ],
  },
  {
    name: 'guardian',
    displayName: 'Guardian / Parent',
    description: 'Child academic progress, attendance, and fee status',
    permissions: [
      { module: 'attendance', actions: ['read', 'create'] },
      { module: 'grades', actions: ['read'] },
      { module: 'finance', actions: ['read'] },
      { module: 'students', actions: ['read'] },
    ],
  },
  {
    name: 'accountant',
    displayName: 'Accountant',
    description: 'Fee structure, payments, ledgers, and payroll visibility',
    permissions: [
      { module: 'finance', actions: CRUD },
      { module: 'reports', actions: ['read'] },
      { module: 'students', actions: ['read'] },
      { module: 'staff', actions: ['read'] },
      { module: 'attendance', actions: ['read'] },
      { module: 'payroll', actions: ['read'] },
      // Self-service leave plus read access to the staff directory
      { module: 'hr', actions: ['create', 'read'] },
    ],
  },
  {
    name: 'hr_manager',
    displayName: 'HR Manager',
    description: 'Staff profiles, admissions, leave approvals, and monthly payroll processing',
    permissions: [
      { module: 'hr', actions: CRUD },
      { module: 'payroll', actions: ['create', 'read', 'update'] },
      { module: 'staff', actions: CRUD },
      { module: 'attendance', actions: ['create', 'read', 'update'] },
      { module: 'reports', actions: ['read'] },
      { module: 'students', actions: ['create', 'read', 'update'] },
    ],
  },
]

/** True when the role definition grants `action` on `module`. */
const roleGrants = (roleName, module, action) => {
  const role = DEFAULT_ROLES.find((r) => r.name === roleName)
  if (!role) return false
  if (roleName === 'super_admin') return true
  const perm = role.permissions.find((p) => p.module === module)
  return Boolean(perm && perm.actions.includes(action))
}

/**
 * Upserts the built-in roles so existing databases pick up permission changes
 * (roles are only editable through code; there is no role-management API).
 * Returns the role documents keyed by name.
 */
const syncDefaultRoles = async (RoleModel) => {
  const byName = {}
  for (const def of DEFAULT_ROLES) {
    byName[def.name] = await RoleModel.findOneAndUpdate(
      { name: def.name },
      { $set: { displayName: def.displayName, description: def.description, permissions: def.permissions } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  }
  return byName
}

module.exports = { DEFAULT_ROLES, roleGrants, syncDefaultRoles }
