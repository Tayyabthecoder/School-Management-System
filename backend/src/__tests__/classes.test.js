const classesController = require('../modules/classes/classes.controller')
const Class = require('../models/Class.model')
const Subject = require('../models/Subject.model')
const Student = require('../models/Student.model')
const TimetableEntry = require('../models/TimetableEntry.model')
const cacheUtil = require('../utils/cache.util')
const auditLogUtil = require('../utils/audit-log.util')
const { checkPermission } = require('../middleware/rbac.middleware')

jest.mock('../models/Class.model')
jest.mock('../models/Subject.model')
jest.mock('../models/Student.model')
jest.mock('../models/TimetableEntry.model')
jest.mock('../utils/cache.util')
jest.mock('../utils/audit-log.util')

describe('Classes Controller & RBAC Unit Tests', () => {
  let req, res, next

  beforeEach(() => {
    jest.clearAllMocks()
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    }
    next = jest.fn()
    cacheUtil.invalidateCache.mockResolvedValue()
    auditLogUtil.logAudit.mockResolvedValue()
  })

  describe('RBAC Authorization for Class & Section Deletion', () => {
    it('allows super_admin to delete classes', () => {
      const middleware = checkPermission(['super_admin'], 'classes', 'delete')
      const mockReq = {
        user: { roleName: 'super_admin' },
      }
      middleware(mockReq, res, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('denies teacher from deleting classes', () => {
      const middleware = checkPermission(['super_admin'], 'classes', 'delete')
      const mockReq = {
        user: { roleName: 'teacher' },
      }
      middleware(mockReq, res, next)
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
    })

    it('denies student from deleting classes or sections', () => {
      const middleware = checkPermission(['super_admin'], 'classes', 'delete')
      const mockReq = {
        user: { roleName: 'student' },
      }
      middleware(mockReq, res, next)
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
    })
  })

  describe('deleteClass', () => {
    it('throws 404 if class does not exist', async () => {
      Class.findById.mockResolvedValue(null)
      req = { params: { id: 'nonexistent-id' }, query: {} }

      await classesController.deleteClass(req, res, next)

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
    })

    it('throws 400 if class has active students and force is not set', async () => {
      Class.findById.mockResolvedValue({ _id: 'class-1', name: 'Grade 10', level: 10, sections: ['A', 'B'] })
      Student.countDocuments.mockResolvedValue(5)
      req = { params: { id: 'class-1' }, query: {} }

      await classesController.deleteClass(req, res, next)

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 400,
        message: expect.stringContaining('5 active enrolled student(s)'),
      }))
    })

    it('successfully deletes class when no active students exist', async () => {
      const fakeClass = { _id: 'class-1', name: 'Grade 10', level: 10, sections: ['A', 'B'] }
      Class.findById.mockResolvedValue(fakeClass)
      Student.countDocuments.mockResolvedValue(0)
      TimetableEntry.deleteMany.mockResolvedValue({ deletedCount: 2 })
      Subject.deleteMany.mockResolvedValue({ deletedCount: 3 })
      Class.findByIdAndDelete.mockResolvedValue(fakeClass)

      req = { params: { id: 'class-1' }, query: {} }

      await classesController.deleteClass(req, res, next)

      expect(Class.findByIdAndDelete).toHaveBeenCalledWith('class-1')
      expect(TimetableEntry.deleteMany).toHaveBeenCalledWith({ classId: 'class-1' })
      expect(Subject.deleteMany).toHaveBeenCalledWith({ classId: 'class-1' })
      expect(cacheUtil.invalidateCache).toHaveBeenCalledWith('ref:classes:all')
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringContaining('Grade 10'),
      }))
    })

    it('allows deleting class with force=true when active students exist', async () => {
      const fakeClass = { _id: 'class-1', name: 'Grade 10', level: 10, sections: ['A', 'B'] }
      Class.findById.mockResolvedValue(fakeClass)
      Student.countDocuments.mockResolvedValue(5)
      Student.updateMany.mockResolvedValue({ modifiedCount: 5 })
      TimetableEntry.deleteMany.mockResolvedValue({ deletedCount: 2 })
      Subject.deleteMany.mockResolvedValue({ deletedCount: 3 })
      Class.findByIdAndDelete.mockResolvedValue(fakeClass)

      req = { params: { id: 'class-1' }, query: { force: 'true' } }

      await classesController.deleteClass(req, res, next)

      expect(Student.updateMany).toHaveBeenCalledWith(
        { classId: 'class-1', deletedAt: null, status: 'Active' },
        { $set: { status: 'Withdrawn' } }
      )
      expect(Class.findByIdAndDelete).toHaveBeenCalledWith('class-1')
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })
  })

  describe('deleteSectionFromClass', () => {
    it('throws 400 if section name is missing', async () => {
      req = { params: { id: 'class-1' }, query: {}, body: {} }

      await classesController.deleteSectionFromClass(req, res, next)

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
    })

    it('throws 404 if class is not found', async () => {
      Class.findById.mockResolvedValue(null)
      req = { params: { id: 'class-1', sectionName: 'A' }, query: {} }

      await classesController.deleteSectionFromClass(req, res, next)

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
    })

    it('throws 404 if section does not exist in class', async () => {
      Class.findById.mockResolvedValue({ _id: 'class-1', name: 'Grade 10', sections: ['A', 'B'] })
      req = { params: { id: 'class-1', sectionName: 'C' }, query: {} }

      await classesController.deleteSectionFromClass(req, res, next)

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 404,
        message: expect.stringContaining('Section "C" not found'),
      }))
    })

    it('throws 400 if section has active students and force is not set', async () => {
      Class.findById.mockResolvedValue({ _id: 'class-1', name: 'Grade 10', sections: ['A', 'B'] })
      Student.countDocuments.mockResolvedValue(8)
      req = { params: { id: 'class-1', sectionName: 'A' }, query: {} }

      await classesController.deleteSectionFromClass(req, res, next)

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 400,
        message: expect.stringContaining('8 active enrolled student(s)'),
      }))
    })

    it('successfully removes section and timetable entries when no active students exist', async () => {
      const fakeClass = { _id: 'class-1', name: 'Grade 10', sections: ['A', 'B'] }
      Class.findById.mockResolvedValue(fakeClass)
      Student.countDocuments.mockResolvedValue(0)
      TimetableEntry.deleteMany.mockResolvedValue({ deletedCount: 1 })

      const mockPopulate = jest.fn().mockResolvedValue({ _id: 'class-1', name: 'Grade 10', sections: ['B'], subjects: [] })
      Class.findByIdAndUpdate.mockReturnValue({ populate: mockPopulate })

      req = { params: { id: 'class-1', sectionName: 'A' }, query: {} }

      await classesController.deleteSectionFromClass(req, res, next)

      expect(Class.findByIdAndUpdate).toHaveBeenCalledWith(
        'class-1',
        { $pull: { sections: 'A' } },
        { new: true }
      )
      expect(TimetableEntry.deleteMany).toHaveBeenCalledWith({ classId: 'class-1', sectionId: 'A' })
      expect(cacheUtil.invalidateCache).toHaveBeenCalledWith('ref:classes:all')
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringContaining('Section "A" deleted'),
      }))
    })

    it('allows removing section with force=true when active students exist', async () => {
      const fakeClass = { _id: 'class-1', name: 'Grade 10', sections: ['A', 'B'] }
      Class.findById.mockResolvedValue(fakeClass)
      Student.countDocuments.mockResolvedValue(8)
      Student.updateMany.mockResolvedValue({ modifiedCount: 8 })
      TimetableEntry.deleteMany.mockResolvedValue({ deletedCount: 1 })

      const mockPopulate = jest.fn().mockResolvedValue({ _id: 'class-1', name: 'Grade 10', sections: ['B'], subjects: [] })
      Class.findByIdAndUpdate.mockReturnValue({ populate: mockPopulate })

      req = { params: { id: 'class-1', sectionName: 'A' }, query: { force: 'true' } }

      await classesController.deleteSectionFromClass(req, res, next)

      expect(Student.updateMany).toHaveBeenCalledWith(
        { classId: 'class-1', sectionId: 'A', deletedAt: null, status: 'Active' },
        { $set: { status: 'Withdrawn' } }
      )
      expect(Class.findByIdAndUpdate).toHaveBeenCalledWith(
        'class-1',
        { $pull: { sections: 'A' } },
        { new: true }
      )
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })
  })
})
