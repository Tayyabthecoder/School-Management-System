const studentsController = require('../modules/students/students.controller')
const gradesController = require('../modules/grades/grades.controller')
const Student = require('../models/Student.model')
const Class = require('../models/Class.model')
const Exam = require('../models/Exam.model')
const Grade = require('../models/Grade.model')
const TimetableEntry = require('../models/TimetableEntry.model')
const StudentAttendance = require('../models/StudentAttendance.model')
const StudentFee = require('../models/StudentFee.model')
const cacheUtil = require('../utils/cache.util')
const auditUtil = require('../utils/audit-log.util')

jest.mock('../models/Student.model')
jest.mock('../models/Class.model')
jest.mock('../models/Exam.model')
jest.mock('../models/Grade.model')
jest.mock('../models/TimetableEntry.model')
jest.mock('../models/StudentAttendance.model')
jest.mock('../models/StudentFee.model')
jest.mock('../models/SchoolSettings.model')
jest.mock('../utils/cache.util')
jest.mock('../utils/audit-log.util')

const CHILD_A = '64b000000000000000000001'
const CHILD_B = '64b000000000000000000002'

const mockRes = () => {
  const res = { json: jest.fn(), status: jest.fn() }
  res.status.mockReturnValue(res)
  return res
}

beforeEach(() => {
  jest.clearAllMocks()
  cacheUtil.getOrSet.mockResolvedValue(null)
  cacheUtil.invalidateCache.mockResolvedValue()
  auditUtil.logAudit.mockResolvedValue()
})

describe('getStudentById role scoping', () => {
  const mockFound = () => {
    Student.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue({ _id: CHILD_B }) })
  }

  test.each(['accountant', 'hr_manager'])('%s (allowed by the route) can open a student profile', async (roleName) => {
    mockFound()
    const res = mockRes()
    const next = jest.fn()

    await studentsController.getStudentById({ params: { id: CHILD_B }, user: { roleName } }, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { _id: CHILD_B } })
  })

  test('a student still cannot open another student profile', async () => {
    mockFound()
    const next = jest.fn()

    await studentsController.getStudentById(
      { params: { id: CHILD_B }, user: { roleName: 'student', studentId: CHILD_A } }, mockRes(), next
    )

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
  })
})

describe('updateStudent section validation', () => {
  test('validates the new section against the NEW class when class changes in the same request', async () => {
    Class.findById.mockResolvedValue({ _id: 'class-2', name: 'Grade 2', sections: ['A', 'C'] })
    Student.findOneAndUpdate.mockReturnValue({ populate: jest.fn().mockResolvedValue({ _id: CHILD_A }) })
    const next = jest.fn()

    await studentsController.updateStudent(
      { params: { id: CHILD_A }, body: { classId: 'class-2', sectionId: 'c' }, user: { _id: 'u1' } }, mockRes(), next
    )

    expect(next).not.toHaveBeenCalled()
    expect(Student.findOne).not.toHaveBeenCalled()
    expect(Student.findOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(), { $set: { classId: 'class-2', sectionId: 'C' } }, expect.anything()
    )
  })

  test('rejects a section that does not exist in the new class', async () => {
    Class.findById.mockResolvedValue({ _id: 'class-2', name: 'Grade 2', sections: ['A'] })
    const next = jest.fn()

    await studentsController.updateStudent(
      { params: { id: CHILD_A }, body: { classId: 'class-2', sectionId: 'B' }, user: { _id: 'u1' } }, mockRes(), next
    )

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
    expect(Student.findOneAndUpdate).not.toHaveBeenCalled()
  })
})

describe('getStudentPortalData result visibility', () => {
  test('a guardian portal view only includes published exams', async () => {
    Student.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ _id: CHILD_A, classId: { _id: 'c1' }, sectionId: 'A' }),
    })
    const chain = () => ({ populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue([]) })
    TimetableEntry.find.mockReturnValue(chain())
    StudentAttendance.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) })
    Exam.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) })
    Grade.find.mockReturnValue(chain())
    StudentFee.find.mockReturnValue(chain())

    const next = jest.fn()
    await studentsController.getStudentPortalData(
      { query: {}, user: { roleName: 'guardian', studentId: CHILD_A } }, mockRes(), next
    )

    expect(next).not.toHaveBeenCalled()
    expect(Exam.find).toHaveBeenCalledWith({ isPublished: true })
  })
})

describe('grades controller', () => {
  test('guardian can read grades of a non-primary linked child', async () => {
    Exam.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) })
    Grade.find.mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }) })
    const guardian = { roleName: 'guardian', studentId: CHILD_A, studentIds: [CHILD_A, CHILD_B] }
    const next = jest.fn()

    await gradesController.getGradesByStudent({ params: { studentId: CHILD_B }, user: guardian }, mockRes(), next)

    expect(next).not.toHaveBeenCalled()
    expect(Exam.find).toHaveBeenCalledWith({ isPublished: true })
  })

  test('saveGrades writes nothing when any row exceeds max marks', async () => {
    Exam.findById.mockResolvedValue({ _id: 'e1', maxMarks: 50 })
    const req = {
      body: { examId: 'e1', grades: [{ studentId: CHILD_A, marksObtained: 40 }, { studentId: CHILD_B, marksObtained: 60 }] },
      user: { _id: 'u1' },
    }
    const next = jest.fn()

    await gradesController.saveGrades(req, mockRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
    expect(Grade.findOneAndUpdate).not.toHaveBeenCalled()
    expect(Grade.bulkWrite).not.toHaveBeenCalled()
  })

  test('createExam rejects pass marks above max marks', async () => {
    const next = jest.fn()

    await gradesController.createExam({ body: { title: 'Mid', maxMarks: 50, passMarks: 60 } }, mockRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
    expect(Exam.create).not.toHaveBeenCalled()
  })
})
