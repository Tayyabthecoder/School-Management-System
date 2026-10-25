const { ApiError } = require('./error.middleware')

/**
 * Checks if req.user has required permissions or roles
 * @param {string|string[]} requiredRoles - Allowed role names e.g. ['super_admin', 'teacher']
 * @param {string} module - Optional module name
 * @param {string} action - Optional action name ('create', 'read', 'update', 'delete')
 */
const checkPermission = (requiredRoles = [], module = null, action = null) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthenticated user')
      }

      const userRoleName = req.user.role ? req.user.role.name : req.user.roleName

      // Super Admin always bypasses specific permission checks
      if (userRoleName === 'super_admin') {
        return next()
      }

      if (requiredRoles.length > 0) {
        const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
        if (!rolesArray.includes(userRoleName)) {
          throw new ApiError(403, 'Forbidden: Insufficient role permissions')
        }
      }

      // Check granular module permissions if defined on role document
      const permissions = req.user.role && req.user.role.permissions
      if (module && action && Array.isArray(permissions) && permissions.length > 0) {
        const modulePerm = permissions.find(p => p.module === module)
        if (!modulePerm || !modulePerm.actions.includes(action)) {
          throw new ApiError(403, `Forbidden: Missing '${action}' permission for module '${module}'`)
        }
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

module.exports = { checkPermission }
