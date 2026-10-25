const { checkPermission } = require('../middleware/rbac.middleware')
const { escapeRegex } = require('../utils/regex.util')

describe('RBAC Middleware Unit Tests', () => {
  let mockRes
  let mockNext

  beforeEach(() => {
    mockRes = {}
    mockNext = jest.fn()
  })

  test('should allow super_admin regardless of requiredRoles or module permissions', () => {
    const middleware = checkPermission(['teacher'], 'grades', 'create')
    const mockReq = {
      user: {
        roleName: 'super_admin',
        role: { name: 'super_admin', permissions: [] },
      },
    }

    middleware(mockReq, mockRes, mockNext)
    expect(mockNext).toHaveBeenCalledWith()
  })

  test('should allow user if role matches requiredRoles and no granular module permission specified', () => {
    const middleware = checkPermission(['teacher', 'accountant'])
    const mockReq = {
      user: {
        roleName: 'teacher',
        role: { name: 'teacher', permissions: [] },
      },
    }

    middleware(mockReq, mockRes, mockNext)
    expect(mockNext).toHaveBeenCalledWith()
  })

  test('should throw 403 Forbidden if user role is not in requiredRoles', () => {
    const middleware = checkPermission(['accountant'])
    const mockReq = {
      user: {
        roleName: 'student',
        role: { name: 'student', permissions: [] },
      },
    }

    middleware(mockReq, mockRes, mockNext)
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
  })

  test('should allow user if granular module permission matches', () => {
    const middleware = checkPermission(['teacher'], 'grades', 'create')
    const mockReq = {
      user: {
        roleName: 'teacher',
        role: {
          name: 'teacher',
          permissions: [
            { module: 'grades', actions: ['create', 'read', 'update'] },
          ],
        },
      },
    }

    middleware(mockReq, mockRes, mockNext)
    expect(mockNext).toHaveBeenCalledWith()
  })

  test('should throw 403 if granular module permission is missing the required action', () => {
    const middleware = checkPermission(['teacher'], 'grades', 'delete')
    const mockReq = {
      user: {
        roleName: 'teacher',
        role: {
          name: 'teacher',
          permissions: [
            { module: 'grades', actions: ['read'] },
          ],
        },
      },
    }

    middleware(mockReq, mockRes, mockNext)
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
  })

  test('should not throw 403 when role has empty permissions array and only role matching is required', () => {
    const middleware = checkPermission(['accountant'])
    const mockReq = {
      user: {
        roleName: 'accountant',
        role: {
          name: 'accountant',
          permissions: [],
        },
      },
    }

    middleware(mockReq, mockRes, mockNext)
    expect(mockNext).toHaveBeenCalledWith()
  })
})

describe('Regex Escaping & ReDoS Protection Tests', () => {
  test('should escape special regex characters safely', () => {
    const dangerousInput = '.*+?^${}()|[]\\'
    const escaped = escapeRegex(dangerousInput)
    expect(escaped).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\')

    // Verify it can safely be compiled into RegExp without crashing
    const re = new RegExp(escaped)
    expect(re.test(dangerousInput)).toBe(true)
  })

  test('should handle non-string inputs gracefully', () => {
    expect(escapeRegex(null)).toBe('')
    expect(escapeRegex(undefined)).toBe('')
    expect(escapeRegex(123)).toBe('')
  })
})
