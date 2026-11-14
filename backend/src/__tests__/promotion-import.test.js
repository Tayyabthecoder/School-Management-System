const promotionController = require('../modules/students/promotion.controller')
const importController = require('../modules/students/students.import.controller')
const PromotionConfig = require('../models/PromotionConfig.model')
const Student = require('../models/Student.model')
const Exam = require('../models/Exam.model')
const Grade = require('../models/Grade.model')
const Class = require('../models/Class.model')
const Role = require('../models/Role.model')
const excelUtil = require('../utils/excel.util')
const auditUtil = require('../utils/audit-log.util')
const cacheUtil = require('../utils/cache.util')

jest.mock('../models/PromotionConfig.model')
jest.mock('../models/Student.model')
jest.mock('../models/Exam.model')
jest.mock('../models/Grade.model')
jest.mock('../models/Class.model')
jest.mock('../models/Role.model')
jest.mock('../models/User.model')
jest.mock('../models/AcademicYear.model')
jest.mock('../utils/excel.util')
jest.mock('../utils/audit-log.util')
jest.mock('../utils/cache.util')
jest.mock('bcryptjs', () => ({ hash: jest.fn().mockResolvedValue('hashed') }))

const YEAR_ID = 'year-2026'
const fromClass = { _id: 'class-5', name: 'Grade 5', sections: ['A', 'B', 'C'] }
const toClass = { _id: 'class-6', name: 'Grade 6', sections: ['A', 'B'] }

const mockRes = () => {
  const res = { json: jest.fn(), status: jest.fn() }
  res.status.mockReturnValue(res)
  return res
}

const buildConfig = (overrides = {}) => ({
  _id: 'cfg-1',
  academicYearId: YEAR_ID,
  finalExamTermName: 'Final Term',
  mappings: [{ fromClassId: fromClass, toClassId: toClass }],
  isExecuted: false,
  ...overrides,
})

const mockConfigLookup = (config) => {
  const chain = { populate: jest.fn() }
  chain.populate.mockReturnValueOnce(chain).mockResolvedValueOnce(config)
  return chain
}

const studentInSectionC = { _id: 'stu-1', studentId: 'STU-1', fullName: 'Sara', sectionId: 'C' }
const passedExam = { _id: 'exam-1', passMarks: 40, maxMarks: 100, subjectId: { name: 'Maths' } }

beforeEach(() => {
  jest.clearAllMocks()
  auditUtil.logAudit.mockResolvedValue()
  cacheUtil.invalidateCache.mockResolvedValue()
  Student.find.mockResolvedValue([studentInSectionC])
  Exam.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([passedExam]) })
  Grade.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([{ studentId: 'stu-1', examId: 'exam-1', marksObtained: 75 }]) })
})

describe('promotion evaluation', () => {
  test('only considers final exams of the configured academic year', async () => {
    await promotionController.evaluatePromotion(buildConfig())

    expect(Exam.find).toHaveBeenCalledWith({ classId: 'class-5', termName: 'Final Term', academicYearId: YEAR_ID })
  })

  test('preview response keeps its shape', async () => {
    PromotionConfig.findOne.mockReturnValue(mockConfigLookup(buildConfig()))
    const res = mockRes()

    await promotionController.previewPromotion({ body: { configId: 'cfg-1' } }, res, jest.fn())

    const payload = res.json.mock.calls[0][0].data
    expect(payload.summary).toEqual({ totalStudents: 1, promoteCount: 1, retainCount: 0, unresolvedCount: 0 })
    expect(payload.promote[0]).toMatchObject({ currentClass: 'Grade 5', targetClass: 'Grade 6', decision: 'promote' })
  })
})

describe('executePromotion', () => {
  test('refuses to run when another request already claimed the execution', async () => {
    PromotionConfig.findById.mockReturnValue(mockConfigLookup(buildConfig()))
    PromotionConfig.findOneAndUpdate.mockResolvedValue(null)
    const next = jest.fn()

    await promotionController.executePromotion({ body: { configId: 'cfg-1' }, user: { _id: 'admin' } }, mockRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
    expect(Student.bulkWrite).not.toHaveBeenCalled()
  })

  test('moves a student into a valid section of the target class', async () => {
    PromotionConfig.findById.mockReturnValue(mockConfigLookup(buildConfig()))
    PromotionConfig.findOneAndUpdate.mockResolvedValue({ _id: 'cfg-1' })
    Student.bulkWrite.mockResolvedValue({})
    const next = jest.fn()

    await promotionController.executePromotion({ body: { configId: 'cfg-1' }, user: { _id: 'admin' } }, mockRes(), next)

    expect(next).not.toHaveBeenCalled()
    const [ops] = Student.bulkWrite.mock.calls[0]
    expect(ops[0].updateOne.update.$set).toEqual({ classId: 'class-6', sectionId: 'A' })
  })

  test('releases the claim when writing fails so it can be retried', async () => {
    PromotionConfig.findById.mockReturnValue(mockConfigLookup(buildConfig()))
    PromotionConfig.findOneAndUpdate.mockResolvedValue({ _id: 'cfg-1' })
    PromotionConfig.updateOne.mockResolvedValue({})
    Student.bulkWrite.mockRejectedValue(new Error('write failed'))
    const next = jest.fn()

    await promotionController.executePromotion({ body: { configId: 'cfg-1' }, user: { _id: 'admin' } }, mockRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'write failed' }))
    expect(PromotionConfig.updateOne).toHaveBeenCalledWith(
      { _id: 'cfg-1' }, { $set: { isExecuted: false, executedAt: null, executedBy: null } }
    )
  })
})

describe('Excel import class resolution', () => {
  test('reports an unknown class instead of enrolling into the first class', async () => {
    Class.find.mockResolvedValue([{ _id: 'class-pj', name: 'Play Junior', level: 0, sections: ['A'] }])
    Role.findOne.mockResolvedValue(null)
    excelUtil.parseStudentExcel.mockResolvedValue({
      rows: [{ rowNumber: 2, fullName: 'Ali Khan', className: 'Grade 13', sectionId: 'A' }],
      parseErrors: [],
    })
    const res = mockRes()
    const handler = importController.importStudentsFromExcel(jest.fn().mockResolvedValue('STU-2026-0001'))

    await handler({ file: { path: 'Z:/does-not-exist.xlsx', originalname: 'kids.xlsx' } }, res, jest.fn())

    expect(Student.create).not.toHaveBeenCalled()
    const data = res.json.mock.calls[0][0].data
    expect(data.createdCount).toBe(0)
    expect(data.errors[0]).toMatchObject({ row: 2, error: expect.stringMatching(/Grade 13.*not found/) })
  })
})

describe('JSON bulk import', () => {
  test('rejects rows pointing at an unknown class', async () => {
    Class.find.mockResolvedValue([{ _id: 'class-1', name: 'Grade 1', sections: ['A'] }])
    Role.findOne.mockResolvedValue(null)
    const res = mockRes()
    const handler = importController.bulkImportStudents(jest.fn().mockResolvedValue('STU-2026-0002'))

    await handler({ body: { students: [{ fullName: 'Ali', classId: 'class-999' }] } }, res, jest.fn())

    expect(Student.create).not.toHaveBeenCalled()
    expect(res.json.mock.calls[0][0].data).toMatchObject({ createdCount: 0, errorCount: 1 })
  })
})

describe('graduating the final class', () => {
  const topClass = { _id: 'class-10', name: 'Grade 10', level: 10, sections: ['A'] }
  const grade9 = { _id: 'class-9', name: 'Grade 9', level: 9, sections: ['A'] }
  const grade10Student = { _id: 'stu-top', studentId: 'STU-TOP', fullName: 'Omar', sectionId: 'A' }

  beforeEach(() => {
    Class.find.mockResolvedValue([grade9, topClass])
    Student.find.mockImplementation(async (filter) => (filter.classId === 'class-10' ? [grade10Student] : []))
    Grade.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([{ studentId: 'stu-top', examId: 'exam-1', marksObtained: 80 }]) })
  })

  const config = () => buildConfig({ mappings: [{ fromClassId: grade9, toClassId: topClass }] })

  test('a passing student of the unmapped top class is marked as graduating', async () => {
    const { promote } = await promotionController.evaluatePromotion(config())

    expect(promote).toHaveLength(1)
    expect(promote[0]).toMatchObject({ studentId: 'stu-top', graduating: true, targetClass: 'Graduated', decision: 'promote' })
  })

  test('a failing student of the top class is retained, not graduated', async () => {
    Grade.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([{ studentId: 'stu-top', examId: 'exam-1', marksObtained: 10 }]) })

    const { promote, retain } = await promotionController.evaluatePromotion(config())

    expect(promote).toHaveLength(0)
    expect(retain[0]).toMatchObject({ studentId: 'stu-top', reason: 'Failed Final Exam' })
  })

  test('execute sets status Graduated instead of moving the student to another class', async () => {
    PromotionConfig.findById.mockReturnValue(mockConfigLookup(config()))
    PromotionConfig.findOneAndUpdate.mockResolvedValue({ _id: 'cfg-1' })
    Student.bulkWrite.mockResolvedValue({})
    const res = mockRes()

    await promotionController.executePromotion({ body: { configId: 'cfg-1' }, user: { _id: 'admin' } }, res, jest.fn())

    const [ops] = Student.bulkWrite.mock.calls[0]
    expect(ops[0].updateOne.update.$set).toEqual({ status: 'Graduated' })
    expect(ops[0].updateOne.filter).toMatchObject({ _id: 'stu-top', classId: 'class-10', status: 'Active' })
    expect(res.json.mock.calls[0][0].data).toMatchObject({ graduatedCount: 1, promotedCount: 0 })
  })
})

describe('imports reject rows with missing required data', () => {
  test('JSON bulk import reports missing DOB, gender and guardian phone', async () => {
    Class.find.mockResolvedValue([{ _id: 'class-1', name: 'Grade 1', sections: ['A'] }])
    Role.findOne.mockResolvedValue(null)
    const res = mockRes()
    const handler = importController.bulkImportStudents(jest.fn().mockResolvedValue('STU-2026-0003'))

    await handler({ body: { students: [{ fullName: 'Ali', classId: 'class-1' }] } }, res, jest.fn())

    expect(Student.create).not.toHaveBeenCalled()
    const data = res.json.mock.calls[0][0].data
    expect(data).toMatchObject({ createdCount: 0, errorCount: 1 })
    expect(data.errors[0].error).toMatch(/date of birth.*gender.*guardian phone/)
  })

  test('JSON bulk import accepts a complete row', async () => {
    Class.find.mockResolvedValue([{ _id: 'class-1', name: 'Grade 1', sections: ['A'] }])
    Role.findOne.mockResolvedValue(null)
    Student.create.mockResolvedValue({ _id: 's1', studentId: 'STU-2026-0004' })
    const res = mockRes()
    const handler = importController.bulkImportStudents(jest.fn().mockResolvedValue('STU-2026-0004'))

    await handler({
      body: { students: [{ fullName: 'Ali', classId: 'class-1', dob: '2015-03-02', gender: 'Male', guardianPhone: '+923001112233' }] },
    }, res, jest.fn())

    expect(Student.create).toHaveBeenCalledWith(expect.objectContaining({
      dob: '2015-03-02', gender: 'Male', guardian: expect.objectContaining({ phone: '+923001112233' }),
    }))
    expect(res.json.mock.calls[0][0].data).toMatchObject({ createdCount: 1, errorCount: 0 })
  })
})

describe('ungraded students in the execute result', () => {
  test('are counted separately from students who failed', async () => {
    Grade.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) // no marks entered
    PromotionConfig.findById.mockReturnValue(mockConfigLookup(buildConfig()))
    PromotionConfig.findOneAndUpdate.mockResolvedValue({ _id: 'cfg-1' })
    Student.bulkWrite.mockResolvedValue({})
    const res = mockRes()

    await promotionController.executePromotion({ body: { configId: 'cfg-1' }, user: { _id: 'admin' } }, res, jest.fn())

    const payload = res.json.mock.calls[0][0]
    expect(payload.data).toMatchObject({ promotedCount: 0, retainedCount: 1, unresolvedCount: 1 })
    expect(payload.message).toContain('1 of them have no final grades yet')
  })

  test('a manual override promotes them and removes them from the count', async () => {
    Grade.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })
    PromotionConfig.findById.mockReturnValue(mockConfigLookup(buildConfig()))
    PromotionConfig.findOneAndUpdate.mockResolvedValue({ _id: 'cfg-1' })
    Student.bulkWrite.mockResolvedValue({})
    const res = mockRes()

    await promotionController.executePromotion({
      body: { configId: 'cfg-1', overrides: [{ studentId: 'stu-1', decision: 'promote' }] },
      user: { _id: 'admin' },
    }, res, jest.fn())

    expect(res.json.mock.calls[0][0].data).toMatchObject({ promotedCount: 1, unresolvedCount: 0 })
  })
})
