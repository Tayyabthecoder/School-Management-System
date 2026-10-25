const studentsController = require('../modules/students/students.controller')
const Student = require('../models/Student.model')
const auditLogUtil = require('../utils/audit-log.util')
const { checkPermission } = require('../middleware/rbac.middleware')

jest.mock('../models/Student.model')
jest.mock('../models/Class.model')
jest.mock('../models/User.model')
jest.mock('../models/Role.model')
jest.mock('../models/Counter.model')
jest.mock('../utils/audit-log.util')

describe('Student Section Change Unit Tests', () => {
  let req, res, next

  beforeEach(() => {
    jest.clearAllMocks()
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    }
    next = jest.fn()
    auditLogUtil.logAudit.mockResolvedValue()
  })

  describe('RBAC Authorization', () => {
    it('allows super_admin to change student section', () => {
      const middleware = checkPermission(['super_admin', 'hr_manager'], 'students', 'update')
      const mockReq = {
        user: { roleName: 'super_admin' },
      }
      middleware(mockReq, res, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('denies teacher from changing student section without permission', () => {
      const middleware = checkPermission(['super_admin', 'hr_manager'], 'students', 'update')
      const mockReq = {
        user: { roleName: 'teacher', role: { name: 'teacher', permissions: [] } },
      }
      middleware(mockReq, res, next)
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
    })

    it('denies student from changing student section', () => {
      const middleware = checkPermission(['super_admin', 'hr_manager'], 'students', 'update')
      const mockReq = {
        user: { roleName: 'student', role: { name: 'student', permissions: [] } },
      }
      middleware(mockReq, res, next)
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
    })
  })

  describe('changeStudentSection controller', () => {
    it('throws 400 if sectionId is not provided', async () => {
      req = { params: { id: 'stu-1' }, body: {} }

      await studentsController.changeStudentSection(req, res, next)

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 400,
        message: expect.stringContaining('section identifier is required'),
      }))
    })

    it('throws 404 if student does not exist', async () => {
      Student.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      })
      req = { params: { id: 'stu-1' }, body: { sectionId: 'B' } }

      await studentsController.changeStudentSection(req, res, next)

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
    })

    it('throws 400 if target section is not in the student class sections', async () => {
      const mockStudent = {
        _id: 'stu-1',
        fullName: 'Ali Khan',
        sectionId: 'A',
        classId: {
          _id: 'class-1',
          name: 'Grade 10',
          sections: ['A', 'B'],
        },
      }
      Student.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockStudent),
      })
      req = { params: { id: 'stu-1' }, body: { sectionId: 'C' } }

      await studentsController.changeStudentSection(req, res, next)

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 400,
        message: expect.stringContaining('does not exist in class "Grade 10"'),
      }))
    })

    it('throws 400 if student is already in the target section', async () => {
      const mockStudent = {
        _id: 'stu-1',
        fullName: 'Ali Khan',
        sectionId: 'A',
        classId: {
          _id: 'class-1',
          name: 'Grade 10',
          sections: ['A', 'B'],
        },
      }
      Student.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockStudent),
      })
      req = { params: { id: 'stu-1' }, body: { sectionId: 'A' } }

      await studentsController.changeStudentSection(req, res, next)

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 400,
        message: expect.stringContaining('already in section "A"'),
      }))
    })

    it('successfully changes student section to another section in the same class', async () => {
      const mockSave = jest.fn().mockResolvedValue()
      const mockStudent = {
        _id: 'stu-1',
        fullName: 'Ali Khan',
        sectionId: 'A',
        classId: {
          _id: 'class-1',
          name: 'Grade 10',
          sections: ['A', 'B', 'C'],
        },
        save: mockSave,
      }
      Student.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockStudent),
      })
      req = {
        params: { id: 'stu-1' },
        body: { sectionId: 'B', reason: 'Roster balancing' },
      }

      await studentsController.changeStudentSection(req, res, next)

      expect(mockStudent.sectionId).toBe('B')
      expect(mockSave).toHaveBeenCalled()
      expect(auditLogUtil.logAudit).toHaveBeenCalledWith(
        req,
        'STUDENT_SECTION_CHANGED',
        expect.objectContaining({
          studentId: 'stu-1',
          oldSection: 'A',
          newSection: 'B',
        })
      )
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringContaining('changed from "A" to "B" in Grade 10'),
      }))
    })
  })
})
