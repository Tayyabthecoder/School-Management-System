const { ApiError } = require('../../middleware/error.middleware')

/**
 * Which roles may export each report entity (SEC-03). The route-level check only says
 * "may use the export endpoint"; this decides what data each role may take away.
 * - Staff records (salary, CNIC) and staff attendance stay with HR.
 * - Fee data and guardian contact details with balances stay with finance.
 * - Payroll is shared by HR (prepares it) and accountants (disburse it), matching GET /hr/payroll.
 */
const EXPORT_ENTITY_ROLES = Object.freeze({
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

const parsedLimit = parseInt(process.env.EXPORT_ROW_LIMIT, 10)
const EXPORT_ROW_LIMIT = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10000

const canExportEntity = (role, entity) => (EXPORT_ENTITY_ROLES[entity] || []).includes(role)

// req.user is the User document: role is populated ({ name }) and roleName is denormalised.
const roleOf = (user) => (user?.role && typeof user.role === 'object' ? user.role.name : user?.role) || user?.roleName

/** Throws 403 when the role may not export this entity. Unknown entities are left to the caller (400). */
const assertCanExport = (user, entity) => {
  if (!EXPORT_ENTITY_ROLES[entity]) return
  if (!canExportEntity(roleOf(user), entity)) {
    throw new ApiError(403, `Your role is not allowed to export ${entity} data`)
  }
}

/** Caps how many documents an export query may load (one extra, so an overflow can be detected). */
const limitExport = (query) =>
  query && typeof query.limit === 'function' ? query.limit(EXPORT_ROW_LIMIT + 1) : query

/** Rejects exports that exceed the cap instead of silently truncating them. */
const assertExportSize = (count) => {
  if (count > EXPORT_ROW_LIMIT) {
    throw new ApiError(
      413,
      `This export has more than ${EXPORT_ROW_LIMIT} rows. Narrow the date range or filters and try again.`
    )
  }
}

module.exports = {
  EXPORT_ENTITY_ROLES,
  EXPORT_ROW_LIMIT,
  canExportEntity,
  roleOf,
  assertCanExport,
  limitExport,
  assertExportSize,
}
