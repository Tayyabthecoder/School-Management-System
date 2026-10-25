const { mustChangePasswordGuard } = require('../middleware/auth.middleware')
const { validateObjectId } = require('../utils/validation.util')
const { createUserSchema, resetPasswordSchema } = require('../modules/users/users.dto')
const { changePasswordSchema } = require('../modules/auth/auth.dto')
const { verifyStudentAccess } = require('../modules/reportcards/reportcards.controller')
const { fileFilter, imageFileFilter } = require('../middleware/upload.middleware')
const { sanitizeCellValue } = require('../utils/excel.util')
const { errorHandler, ApiError } = require('../middleware/error.middleware')
const { createClassSchema, addSectionSchema } = require('../modules/classes/classes.dto')
const { createSubjectSchema } = require('../modules/subjects/subjects.dto')
const { createTeacherSchema, assignTeacherPeriodSchema, reviewLeaveRequestSchema } = require('../modules/teachers/teachers.dto')
const jwt = require('jsonwebtoken')
const env = require('../config/env')
const User = require('../models/User.model')
const { verifyToken } = require('../middleware/auth.middleware')

describe('Security Controls Unit Tests', () => {
  describe('mustChangePassword Guard Middleware', () => {
    let mockReq
    let mockRes
    let mockNext

    beforeEach(() => {
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }
      mockNext = jest.fn()
    })

    test('should allow request if user is not flagged with mustChangePassword', () => {
      mockReq = {
        user: { mustChangePassword: false },
        originalUrl: '/api/v1/students',
      }
      mustChangePasswordGuard(mockReq, mockRes, mockNext)
      expect(mockNext).toHaveBeenCalled()
    })

    test('should block request with 403 MUST_CHANGE_PASSWORD if flagged and accessing normal endpoint', () => {
      mockReq = {
        user: { mustChangePassword: true },
        originalUrl: '/api/v1/students',
      }
      mustChangePasswordGuard(mockReq, mockRes, mockNext)
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'MUST_CHANGE_PASSWORD' }),
        })
      )
      expect(mockNext).not.toHaveBeenCalled()
    })

    test('should permit change-password endpoint even if flagged with mustChangePassword', () => {
      mockReq = {
        user: { mustChangePassword: true },
        originalUrl: '/api/v1/auth/change-password',
      }
      mustChangePasswordGuard(mockReq, mockRes, mockNext)
      expect(mockNext).toHaveBeenCalled()
    })

    test('should permit logout endpoint even if flagged with mustChangePassword', () => {
      mockReq = {
        user: { mustChangePassword: true },
        originalUrl: '/api/v1/auth/logout',
      }
      mustChangePasswordGuard(mockReq, mockRes, mockNext)
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('validateObjectId Utility', () => {
    test('should pass without error on valid 24-char hex MongoDB ObjectId', () => {
      expect(() => {
        validateObjectId('507f1f77bcf86cd799439011', 'studentId')
      }).not.toThrow()
    })

    test('should throw 400 ApiError on invalid ObjectId format', () => {
      expect(() => {
        validateObjectId('invalid-id-1234', 'studentId')
      }).toThrow(/Invalid studentId identifier format/)
    })

    test('should ignore undefined or empty input when optional', () => {
      expect(() => {
        validateObjectId(undefined, 'optionalId')
        validateObjectId('', 'optionalId')
      }).not.toThrow()
    })
  })

  describe('Password Validation Schemas', () => {
    test('createUserSchema should reject empty or short passwords', () => {
      const invalidEmpty = createUserSchema.safeParse({
        body: { username: 'testuser', password: '', roleName: 'teacher' },
      })
      expect(invalidEmpty.success).toBe(false)

      const invalidShort = createUserSchema.safeParse({
        body: { username: 'testuser', password: 'abc', roleName: 'teacher' },
      })
      expect(invalidShort.success).toBe(false)
    })

    test('createUserSchema should accept valid passwords with minimum 8 characters and numbers', () => {
      const valid = createUserSchema.safeParse({
        body: { username: 'testuser', password: 'Password123', roleName: 'teacher' },
      })
      expect(valid.success).toBe(true)
    })

    test('resetPasswordSchema should reject empty passwords', () => {
      const invalid = resetPasswordSchema.safeParse({
        body: { newPassword: '' },
      })
      expect(invalid.success).toBe(false)
    })

    test('changePasswordSchema should reject weak passwords under 8 characters', () => {
      const invalid = changePasswordSchema.safeParse({
        body: { currentPassword: 'OldPass123', newPassword: 'short' },
      })
      expect(invalid.success).toBe(false)
    })
  })

  describe('Day-based Access Restrictions (Requirement R6)', () => {
    test('SchoolSettings model should validate day enum values', () => {
      const SchoolSettings = require('../models/SchoolSettings.model')
      const validDoc = new SchoolSettings({
        allowedDays: ['Monday', 'Tuesday', 'Wednesday'],
      })
      expect(validDoc.validateSync()).toBeUndefined()

      const invalidDoc = new SchoolSettings({
        allowedDays: ['NotADay'],
      })
      const err = invalidDoc.validateSync()
      expect(err).toBeDefined()
      expect(err.errors['allowedDays.0']).toBeDefined()
    })
  })

  describe('IDOR & Authorization Boundary Controls (AUTHZ-01, AUTHZ-02)', () => {
    test('verifyStudentAccess permits guardian viewing their own child', () => {
      const guardianUser = { roleName: 'guardian', studentId: 'student-id-123' }
      const studentDoc = { _id: 'student-id-123' }
      expect(() => verifyStudentAccess(guardianUser, studentDoc)).not.toThrow()
    })

    test('verifyStudentAccess forbids guardian viewing another student', () => {
      const guardianUser = { roleName: 'guardian', studentId: 'student-id-123' }
      const otherStudent = { _id: 'student-id-456' }
      expect(() => verifyStudentAccess(guardianUser, otherStudent)).toThrow(/Forbidden/)
    })

    test('verifyStudentAccess forbids guardian with missing studentId', () => {
      const guardianUser = { roleName: 'guardian', studentId: null }
      const studentDoc = { _id: 'student-id-123' }
      expect(() => verifyStudentAccess(guardianUser, studentDoc)).toThrow(/Forbidden/)
    })

    test('verifyStudentAccess permits student viewing their own report', () => {
      const studentUser = { roleName: 'student', studentId: 'student-id-123' }
      const studentDoc = { _id: 'student-id-123' }
      expect(() => verifyStudentAccess(studentUser, studentDoc)).not.toThrow()
    })

    test('verifyStudentAccess forbids student viewing another student report', () => {
      const studentUser = { roleName: 'student', studentId: 'student-id-123' }
      const otherStudent = { _id: 'student-id-456' }
      expect(() => verifyStudentAccess(studentUser, otherStudent)).toThrow(/Forbidden/)
    })

    test('verifyStudentAccess permits super_admin and teacher unconditionally', () => {
      const admin = { roleName: 'super_admin' }
      const teacher = { roleName: 'teacher' }
      const anyStudent = { _id: 'student-id-999' }
      expect(() => verifyStudentAccess(admin, anyStudent)).not.toThrow()
      expect(() => verifyStudentAccess(teacher, anyStudent)).not.toThrow()
    })

    test('verifyStudentAccess default-denies unprivileged staff roles (e.g. accountant)', () => {
      const accountant = { roleName: 'accountant' }
      const anyStudent = { _id: 'student-id-999' }
      expect(() => verifyStudentAccess(accountant, anyStudent)).toThrow(/Forbidden/)
    })
  })

  describe('File Upload Whitelisting & MIME Spoofing Defenses (INJ-01)', () => {
    test('fileFilter rejects unauthorized extension (.html) even with image MIME', (done) => {
      const req = {}
      const file = { originalname: 'exploit.html', mimetype: 'image/jpeg' }
      fileFilter(req, file, (err, pass) => {
        expect(err).toBeInstanceOf(ApiError)
        expect(err.statusCode).toBe(400)
        expect(err.message).toMatch(/extension.*is not permitted/)
        expect(pass).toBe(false)
        done()
      })
    })

    test('fileFilter rejects SVG vector images to prevent Stored XSS', (done) => {
      const req = {}
      const file = { originalname: 'vector.svg', mimetype: 'image/svg+xml' }
      fileFilter(req, file, (err, pass) => {
        expect(err).toBeInstanceOf(ApiError)
        expect(err.statusCode).toBe(400)
        expect(pass).toBe(false)
        done()
      })
    })

    test('fileFilter accepts valid image files (.jpg with image/jpeg)', (done) => {
      const req = {}
      const file = { originalname: 'avatar.jpg', mimetype: 'image/jpeg' }
      fileFilter(req, file, (err, pass) => {
        expect(err).toBeNull()
        expect(pass).toBe(true)
        done()
      })
    })

    test('imageFileFilter strictly rejects document extensions (.pdf)', (done) => {
      const req = {}
      const file = { originalname: 'document.pdf', mimetype: 'application/pdf' }
      imageFileFilter(req, file, (err, pass) => {
        expect(err).toBeInstanceOf(ApiError)
        expect(err.statusCode).toBe(400)
        expect(pass).toBe(false)
        done()
      })
    })
  })

  describe('Excel Formula Injection Sanitization (INJ-02)', () => {
    test('prefixes formula triggers (=, +, -, @, \\t, \\r) with single quote', () => {
      expect(sanitizeCellValue('=cmd|/c calc!A0')).toBe("'=cmd|/c calc!A0")
      expect(sanitizeCellValue('+12345')).toBe("'+12345")
      expect(sanitizeCellValue('-54321')).toBe("'-54321")
      expect(sanitizeCellValue('@HYPERLINK("http://evil.com")')).toBe("'@HYPERLINK(\"http://evil.com\")")
      expect(sanitizeCellValue('\tmaliciousTab')).toBe("'\tmaliciousTab")
      expect(sanitizeCellValue('\rmaliciousReturn')).toBe("'\rmaliciousReturn")
      expect(sanitizeCellValue('  =indentedFormula')).toBe("'  =indentedFormula")
    })

    test('leaves regular safe text and non-string values unaltered', () => {
      expect(sanitizeCellValue('Muhammad Ali')).toBe('Muhammad Ali')
      expect(sanitizeCellValue('Class 10-A')).toBe('Class 10-A')
      expect(sanitizeCellValue(95.5)).toBe(95.5)
      expect(sanitizeCellValue(null)).toBeNull()
      expect(sanitizeCellValue(undefined)).toBeUndefined()
    })
  })

  describe('Production Error Masking (LOG-01)', () => {
    test('masks 500 error details in production environment', () => {
      const oldEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const internalErr = new Error('Database connection leak at line 842: credentials exposed')
      internalErr.statusCode = 500
      internalErr.details = { sensitiveQuery: 'SELECT * FROM users' }

      let responseStatus = null
      let responseBody = null
      const res = {
        status: (code) => {
          responseStatus = code
          return {
            json: (body) => {
              responseBody = body
            },
          }
        },
      }
      const req = { method: 'GET', originalUrl: '/api/v1/test' }

      errorHandler(internalErr, req, res, jest.fn())

      expect(responseStatus).toBe(500)
      expect(responseBody.error.message).toBe('An unexpected internal server error occurred.')
      expect(responseBody.error.details).toBeUndefined()

      process.env.NODE_ENV = oldEnv
    })
  })

  describe('DTO Schema Validation for Classes, Subjects, and Teachers (VAL-01)', () => {
    test('createClassSchema validates required name and level', () => {
      expect(createClassSchema.safeParse({ body: { name: '', level: 'not-a-number' } }).success).toBe(false)
      expect(createClassSchema.safeParse({ body: { name: 'Class 9', level: 9, sections: ['A', 'B'] } }).success).toBe(true)
    })

    test('addSectionSchema validates non-empty sectionName', () => {
      expect(addSectionSchema.safeParse({ body: { sectionName: '' } }).success).toBe(false)
      expect(addSectionSchema.safeParse({ body: { sectionName: 'C' } }).success).toBe(true)
    })

    test('createSubjectSchema validates name, code, and 24-hex ObjectId classId', () => {
      expect(createSubjectSchema.safeParse({ body: { name: 'Physics', code: 'PHY', classId: 'invalid-id' } }).success).toBe(false)
      expect(createSubjectSchema.safeParse({ body: { name: 'Physics', code: 'PHY', classId: '507f1f77bcf86cd799439011' } }).success).toBe(true)
    })

    test('createTeacherSchema validates fullName and email format', () => {
      expect(createTeacherSchema.safeParse({ body: { fullName: 'A' } }).success).toBe(false)
      expect(createTeacherSchema.safeParse({ body: { fullName: 'Sarah Khan', email: 'invalid-email' } }).success).toBe(false)
      expect(createTeacherSchema.safeParse({ body: { fullName: 'Sarah Khan', email: 'sarah@school.edu.pk' } }).success).toBe(true)
    })

    test('reviewLeaveRequestSchema validates status enum (Approved or Rejected)', () => {
      expect(reviewLeaveRequestSchema.safeParse({ body: { status: 'Draft' } }).success).toBe(false)
      expect(reviewLeaveRequestSchema.safeParse({ body: { status: 'Approved', remarks: 'Medical reason validated' } }).success).toBe(true)
    })
  })

  describe('Token Version Revocation Validation (AUTH-03)', () => {
    test('verifyToken rejects tokens when tokenVersion does not match user account version', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        roleName: 'teacher',
        isActive: true,
        deletedAt: null,
        tokenVersion: 2, // User has bumped tokenVersion
        populate: jest.fn().mockReturnThis(),
      }

      // Generate access token with older tokenVersion (0)
      const token = jwt.sign(
        { id: mockUser._id, role: mockUser.roleName, tokenVersion: 0 },
        env.JWT_SECRET,
        { expiresIn: '15m' }
      )

      jest.spyOn(User, 'findById').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser),
      })

      const req = {
        headers: { authorization: `Bearer ${token}` },
        cookies: {},
      }
      let errorThrown = null
      const next = (err) => {
        errorThrown = err
      }

      await verifyToken(req, {}, next)

      expect(errorThrown).toBeInstanceOf(ApiError)
      expect(errorThrown.statusCode).toBe(401)
      expect(errorThrown.message).toMatch(/Token revoked/)

      User.findById.mockRestore()
    })
  })
})
