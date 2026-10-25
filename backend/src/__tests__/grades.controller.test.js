const gradesController = require('../modules/grades/grades.controller')
const Exam = require('../models/Exam.model')
const Grade = require('../models/Grade.model')
const SchoolSettings = require('../models/SchoolSettings.model')
const cacheUtil = require('../utils/cache.util')

jest.mock('../models/Exam.model')
jest.mock('../models/Grade.model')
jest.mock('../models/Student.model')
jest.mock('../models/StudentAttendance.model')
jest.mock('../models/SchoolSettings.model')
jest.mock('../utils/cache.util')
jest.mock('../utils/pdf.util')

describe('Grades Controller Tests', () => {
  let req, res, next

  beforeEach(() => {
    jest.clearAllMocks()
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    }
    next = jest.fn()
    cacheUtil.getOrSet.mockImplementation((key, ttl, fn) => fn())
  })

  describe('saveGrades', () => {
    it('saves grades and computes grade letters according to custom scale', async () => {
      req = {
        body: {
          examId: 'exam123',
          grades: [
            { studentId: 'stu1', marksObtained: 85 },
            { studentId: 'stu2', marksObtained: 65 },
          ],
        },
        user: { _id: 'teacher123' },
      }

      Exam.findById.mockResolvedValue({
        _id: 'exam123',
        maxMarks: 100,
      })

      SchoolSettings.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          gradingScale: [
            { label: 'A', minPercent: 80, maxPercent: 100 },
            { label: 'B', minPercent: 60, maxPercent: 79 },
            { label: 'F', minPercent: 0, maxPercent: 59 },
          ],
        }),
      })

      Grade.findOneAndUpdate.mockImplementation((filter, update) => Promise.resolve(update))

      await gradesController.saveGrades(req, res, next)

      expect(Grade.findOneAndUpdate).toHaveBeenCalledWith(
        { examId: 'exam123', studentId: 'stu1' },
        expect.objectContaining({
          percentage: 85,
          gradeLetter: 'A',
        }),
        expect.any(Object)
      )

      expect(Grade.findOneAndUpdate).toHaveBeenCalledWith(
        { examId: 'exam123', studentId: 'stu2' },
        expect.objectContaining({
          percentage: 65,
          gradeLetter: 'B',
        }),
        expect.any(Object)
      )

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })

    it('throws error when marks obtained exceed maximum marks', async () => {
      req = {
        body: {
          examId: 'exam123',
          grades: [
            { studentId: 'stu1', marksObtained: 110 },
          ],
        },
        user: { _id: 'teacher123' },
      }

      Exam.findById.mockResolvedValue({
        _id: 'exam123',
        maxMarks: 100,
      })

      await gradesController.saveGrades(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('cannot exceed maximum marks'),
        })
      )
    })
  })

  describe('createExam', () => {
    it('creates exam successfully', async () => {
      req = {
        body: {
          title: 'Midterm Exam',
          classId: 'class123',
          subjectId: 'sub123',
          maxMarks: 100,
        },
      }

      Exam.create.mockResolvedValue({
        _id: 'exam123',
        title: 'Midterm Exam',
      })

      await gradesController.createExam(req, res, next)

      expect(Exam.create).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(201)
    })
  })

  describe('getGradesByStudent RBAC', () => {
    it('denies access if a student tries to view another student grades', async () => {
      req = {
        user: { roleName: 'student', studentId: 'stu123' },
        params: { studentId: 'other_student_456' },
      }

      await gradesController.getGradesByStudent(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: expect.stringContaining('You can only view your own grades'),
        })
      )
    })
  })
})
