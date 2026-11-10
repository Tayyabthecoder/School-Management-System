const reportcardsController = require('../modules/reportcards/reportcards.controller')
const { compileDynamicCustomReport } = require('../modules/reports/reports.builder')
const { toRangeStart, toRangeEnd } = require('../utils/date.util')
const Student = require('../models/Student.model')
const Exam = require('../models/Exam.model')
const Grade = require('../models/Grade.model')
const StudentFee = require('../models/StudentFee.model')
const StudentAttendance = require('../models/StudentAttendance.model')
const cacheUtil = require('../utils/cache.util')

jest.mock('../models/Student.model')
jest.mock('../models/Exam.model')
jest.mock('../models/Grade.model')
jest.mock('../models/StudentFee.model')
jest.mock('../models/StudentAttendance.model')
jest.mock('../models/AcademicYear.model')
jest.mock('../models/SchoolSettings.model')
jest.mock('../utils/cache.util')

const STUDENT = '64b000000000000000000001'

const mockRes = () => {
  const res = { json: jest.fn(), status: jest.fn(), setHeader: jest.fn(), send: jest.fn() }
  res.status.mockReturnValue(res)
  return res
}

beforeEach(() => {
  jest.clearAllMocks()
  cacheUtil.getOrSet.mockResolvedValue(null)
})

describe('report card result visibility', () => {
  const arrangeStudent = () => {
    Student.findOne.mockImplementation(() => {
      const doc = { _id: STUDENT, studentId: 'STU-1', fullName: 'Sara', classId: { _id: 'c1', name: 'Grade 5' } }
      // getReportCard uses the bare promise; compileStudentReportData chains .populate
      const p = Promise.resolve(doc)
      p.populate = jest.fn().mockResolvedValue(doc)
      return p
    })
    Exam.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([]) })
    Grade.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([]) })
    StudentAttendance.find.mockResolvedValue([])
  }

  test('a student only gets published exams on their report card', async () => {
    arrangeStudent()
    const next = jest.fn()

    await reportcardsController.getReportCard(
      { params: { studentId: STUDENT }, query: {}, user: { roleName: 'student', studentId: STUDENT } }, mockRes(), next
    )

    expect(next).not.toHaveBeenCalled()
    expect(Exam.find).toHaveBeenCalledWith(expect.objectContaining({ isPublished: true }))
  })

  test('a teacher can still preview unpublished results', async () => {
    arrangeStudent()

    await reportcardsController.getReportCard(
      { params: { studentId: STUDENT }, query: {}, user: { roleName: 'teacher' } }, mockRes(), jest.fn()
    )

    expect(Exam.find.mock.calls[0][0]).not.toHaveProperty('isPublished')
  })

  test('an exam without a grade is Pending and excluded from totals, not 0 / F (RPT-02)', async () => {
    arrangeStudent()
    Exam.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue([
        { _id: 'e1', maxMarks: 100, passMarks: 40, subjectId: { name: 'Maths' } },
        { _id: 'e2', maxMarks: 100, passMarks: 40, subjectId: { name: 'Science' } },
      ]),
    })
    Grade.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue([
        { marksObtained: 80, gradeLetter: 'A', remarks: '', examId: { _id: 'e1' } },
      ]),
    })
    const res = mockRes()

    await reportcardsController.getReportCard(
      { params: { studentId: STUDENT }, query: {}, user: { roleName: 'teacher' } }, res, jest.fn()
    )

    const { grades, summary } = res.json.mock.calls[0][0].data
    expect(grades.find((g) => g.subjectName === 'Science')).toMatchObject({
      marksObtained: null, percentage: null, gradeLetter: 'Pending', isPassed: null, status: 'Pending',
    })
    expect(summary).toMatchObject({
      totalMaxMarks: 100, totalMarksObtained: 80, overallPercentage: 80,
      passedSubjects: 1, failedSubjects: 0, pendingSubjects: 1,
    })
  })

  test('a report card with nothing graded yet has no overall result', async () => {
    arrangeStudent()
    Exam.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue([{ _id: 'e1', maxMarks: 100, passMarks: 40, subjectId: { name: 'Maths' } }]),
    })
    const res = mockRes()

    await reportcardsController.getReportCard(
      { params: { studentId: STUDENT }, query: {}, user: { roleName: 'teacher' } }, res, jest.fn()
    )

    expect(res.json.mock.calls[0][0].data.summary).toMatchObject({ overallPercentage: null, overallGradeLetter: 'Pending', failedSubjects: 0 })
  })

  test('a guardian transcript omits unpublished exams', async () => {
    Student.findOne.mockImplementation(() => {
      const doc = { _id: STUDENT, studentId: 'STU-1', fullName: 'Sara', classId: { name: 'Grade 5' } }
      const p = Promise.resolve(doc)
      p.populate = jest.fn().mockResolvedValue(doc)
      return p
    })
    const examBase = { termName: 'Final Term', maxMarks: 100, passMarks: 40, subjectId: { name: 'Maths' }, academicYearId: { year: '2026' }, classId: { name: 'Grade 5' } }
    Grade.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue([
        { marksObtained: 80, percentage: 80, gradeLetter: 'A', examId: { ...examBase, _id: 'e1', isPublished: true } },
        { marksObtained: 20, percentage: 20, gradeLetter: 'F', examId: { ...examBase, _id: 'e2', isPublished: false, subjectId: { name: 'Science' } } },
      ]),
    })
    const res = mockRes()
    const guardian = { roleName: 'guardian', studentId: STUDENT, studentIds: [STUDENT] }

    await reportcardsController.getStudentTranscript({ params: { studentId: STUDENT }, user: guardian }, res, jest.fn())

    const serialized = JSON.stringify(res.json.mock.calls[0][0])
    expect(serialized).toContain('Maths')
    expect(serialized).not.toContain('Science')
  })
})

describe('report date range bounds', () => {
  test('a date-only "to" bound includes the whole selected day', () => {
    const end = toRangeEnd('2026-05-31')
    expect([end.getDate(), end.getHours(), end.getMinutes()]).toEqual([31, 23, 59])
    // A fee due at 23:59:59 local on the last day must be inside the range
    expect(new Date(2026, 4, 31, 23, 59, 59) <= end).toBe(true)
  })

  test('a date-only "from" bound starts at local midnight; timestamps are kept as-is', () => {
    expect(toRangeStart('2026-05-01').getHours()).toBe(0)
    expect(toRangeEnd('2026-05-01T10:00:00.000Z').toISOString()).toBe('2026-05-01T10:00:00.000Z')
  })

  test('invalid bounds are rejected with 400', () => {
    expect(() => toRangeStart('yesterday-ish')).toThrow(expect.objectContaining({ statusCode: 400 }))
    expect(() => toRangeEnd('2026-13-45')).toThrow(expect.objectContaining({ statusCode: 400 }))
  })

  test('custom fee report applies an end-of-day inclusive dueDate bound', async () => {
    StudentFee.find.mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }) })

    await compileDynamicCustomReport({ entity: 'fees', filters: { from: '2026-05-01', to: '2026-05-31' } })

    const query = StudentFee.find.mock.calls[0][0]
    expect(query.dueDate.$lte.getDate()).toBe(31)
    expect(query.dueDate.$lte.getHours()).toBe(23)
  })
})
