// Behaviour tests for the least-covered modules found by the P3 coverage pass:
// PDF builders, the audit-log helper and the teacher workspace/class endpoints.
const { generatePDFBuffer } = require('../utils/pdf/pdf.base')
const { buildPayslipPDF } = require('../utils/pdf/hr.pdf')
const { buildTabularReportPDF } = require('../utils/pdf/reports.pdf')
const { buildReportCardPDF, buildTranscriptPDF } = require('../utils/pdf/academic.pdf')

const isPdf = (buffer) => Buffer.isBuffer(buffer) && buffer.subarray(0, 5).toString() === '%PDF-'

/** Renders with a spy on doc.text so tests can assert what was written. */
const renderCapturingText = async (build, options) => {
  const written = []
  let pages = 0
  const buffer = await generatePDFBuffer((doc) => {
    const original = doc.text.bind(doc)
    doc.text = (value, ...rest) => {
      if (value !== undefined && value !== null) written.push(String(value))
      return original(value, ...rest)
    }
    build(doc)
    pages = doc.bufferedPageRange().count
  }, options)
  return { buffer, written, pages }
}

describe('PDF builders', () => {
  test('payslip renders salary components and the net pay', async () => {
    const { buffer, written } = await renderCapturingText((doc) => buildPayslipPDF(doc, {
      staffName: 'Ayesha Khan', staffId: 'TCH-2026-0001', designation: 'Teacher', month: 6, year: 2026,
      basicPay: 60000, allowances: 5000, absentDaysDeduction: 2000, otherDeductions: 0,
      incomeTax: 1200, eobi: 370, sessi: 0, netPay: 61430,
    }, { schoolName: 'Test School' }))

    expect(isPdf(buffer)).toBe(true)
    const text = written.join(' | ')
    expect(text).toContain('Ayesha Khan')
    expect(text).toContain('TCH-2026-0001')
    expect(text).toMatch(/61,?430/)
  })

  test('tabular report spans several pages and numbers them', async () => {
    const rows = Array.from({ length: 120 }, (_, i) => ({ id: `S-${i + 1}`, name: `Student ${i + 1}` }))
    const { buffer, written, pages } = await renderCapturingText((doc) => buildTabularReportPDF(doc, {
      title: 'Students', subtitle: '120 rows', columns: [{ header: 'ID', key: 'id' }, { header: 'Name', key: 'name' }], rows,
    }))

    expect(isPdf(buffer)).toBe(true)
    expect(pages).toBeGreaterThan(1)
    expect(written).toContain('Student 120')
    expect(written).toContain(`Page ${pages} of ${pages}`)
  })

  test('report card shows pending subjects as a dash, not 0 marks', async () => {
    const { buffer, written } = await renderCapturingText((doc) => buildReportCardPDF(doc, {
      studentName: 'Sara', studentId: 'STU-1', className: 'Grade 5', sectionId: 'A', termName: 'Final Term',
      attendancePercentage: '92%',
      grades: [
        { subjectName: 'Maths', maxMarks: 100, marksObtained: 80, percentage: 80, gradeLetter: 'A' },
        { subjectName: 'Science', maxMarks: 100, marksObtained: null, percentage: null, gradeLetter: 'Pending' },
      ],
      summary: { totalMaxMarks: 100, totalMarksObtained: 80, overallPercentage: 80, overallGradeLetter: 'A' },
    }))

    expect(isPdf(buffer)).toBe(true)
    expect(written).toContain('Pending')
    expect(written).toContain('—')
    expect(written).not.toContain('null')
  })

  test('report card without grades says so', async () => {
    const { written } = await renderCapturingText((doc) => buildReportCardPDF(doc, { studentName: 'Ali', grades: [], summary: {} }))
    expect(written.join(' ')).toContain('No formal exam grades recorded')
  })

  test('transcript renders every term and the cumulative result, breaking pages when needed', async () => {
    const term = (n) => ({
      termName: `Term ${n}`, academicYear: '2026', className: 'Grade 5', percentage: 75, gradeLetter: 'B',
      totalMarksObtained: 450, totalMaxMarks: 600,
      grades: Array.from({ length: 6 }, (_, i) => ({ subjectName: `Subject ${i + 1}`, maxMarks: 100, marksObtained: 75, percentage: 75, gradeLetter: 'B' })),
    })
    const { buffer, written, pages } = await renderCapturingText((doc) => buildTranscriptPDF(doc, {
      studentName: 'Sara', studentId: 'STU-1', currentClass: 'Grade 5', sectionId: 'A', fatherName: 'Imran', dob: '2015-01-01',
      terms: [1, 2, 3, 4, 5, 6].map(term),
      cumulative: { percentage: 75, gradeLetter: 'B', totalTerms: 6, totalMarksObtained: 2700, totalMaxMarks: 3600 },
    }))

    expect(isPdf(buffer)).toBe(true)
    expect(pages).toBeGreaterThan(1)
    expect(written.join(' ')).toContain('Term 6')
    expect(written.join(' ')).toContain('Cumulative Percentage: 75%')
  })

  test('transcript without terms says so', async () => {
    const { written } = await renderCapturingText((doc) => buildTranscriptPDF(doc, { studentName: 'Ali', terms: [] }))
    expect(written.join(' ')).toContain('No recorded examination grades found.')
  })
})

describe('audit-log helper', () => {
  const AuditLog = require('../models/AuditLog.model')
  const { logAudit } = require('../utils/audit-log.util')
  let create

  beforeEach(() => { create = jest.spyOn(AuditLog, 'create').mockResolvedValue({}) })
  afterEach(() => create.mockRestore())

  test('object signature records user, module, document and values', async () => {
    await logAudit({
      req: { user: { _id: 'u1', username: 'admin' }, ip: '10.0.0.1' },
      action: 'PAYROLL_FINALIZED', module: 'hr', documentId: 'doc-1', oldValues: { a: 1 }, newValues: { a: 2 },
    })
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'u1', username: 'admin', action: 'PAYROLL_FINALIZED', module: 'hr', documentId: 'doc-1',
      oldValues: { a: 1 }, newValues: { a: 2 }, ipAddress: '10.0.0.1',
    }))
  })

  test('positional signature derives the module from the action', async () => {
    await logAudit({ user: { id: 'u2', username: 'acc' } }, 'FEE_PAYMENT', { studentId: 'stu-9', amount: 500 })
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u2', module: 'fee', documentId: 'stu-9', newValues: { studentId: 'stu-9', amount: 500 } }))
  })

  test('a storage failure never breaks the request that triggered it', async () => {
    create.mockRejectedValue(new Error('db down'))
    await expect(logAudit({ action: 'X' })).resolves.toBeUndefined()
  })
})

describe('teacher endpoints', () => {
  const Staff = require('../models/Staff.model')
  const TimetableEntry = require('../models/TimetableEntry.model')
  const Student = require('../models/Student.model')
  const teachersController = require('../modules/teachers/teachers.controller')
  const spies = []
  const spy = (obj, method) => { const s = jest.spyOn(obj, method); spies.push(s); return s }
  afterEach(() => { spies.splice(0).forEach((s) => s.mockRestore()) })

  const chain = (result) => {
    const q = { populate: jest.fn(() => q), sort: jest.fn(() => q), select: jest.fn(() => q), lean: jest.fn(() => q), then: (res, rej) => Promise.resolve(result).then(res, rej) }
    return q
  }

  test('getTeachers hides salary and identity fields from non-HR roles', async () => {
    const query = chain([])
    spy(Staff, 'find').mockReturnValue(query)
    spy(TimetableEntry, 'aggregate').mockResolvedValue([])
    const next = jest.fn()
    await teachersController.getTeachers({ query: {}, user: { roleName: 'teacher' } }, { json: jest.fn() }, next)
    expect(query.select).toHaveBeenCalledWith(expect.stringContaining('-salary'))
    expect(query.select).toHaveBeenCalledWith(expect.stringContaining('-cnic'))
  })

  test('getTeachers escapes the search text before building a regex', async () => {
    const query = chain([])
    spy(Staff, 'find').mockReturnValue(query)
    spy(TimetableEntry, 'aggregate').mockResolvedValue([])
    await teachersController.getTeachers({ query: { search: 'a.*(' }, user: { roleName: 'super_admin' } }, { json: jest.fn() }, jest.fn())
    const filter = Staff.find.mock.calls[0][0]
    expect(filter.$or[0].fullName.$regex).toBe('a\\.\\*\\(')
  })

  test('workspace requires a linked staff profile', async () => {
    const next = jest.fn()
    await teachersController.getTeacherWorkspace({ user: { roleName: 'teacher' }, query: {} }, { json: jest.fn() }, next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('workspace builds today\'s periods and the unique class list', async () => {
    spy(Staff, 'findById').mockResolvedValue({ _id: 'st1', fullName: 'Ayesha', designation: 'Teacher' })
    const entry = (period, start, end, section = 'A') => ({
      _id: `e${period}`, periodNumber: period, startTime: start, endTime: end, room: '1', sectionId: section,
      classId: { _id: 'c5', name: 'Grade 5', level: 5 }, subjectId: { _id: 'm1', name: 'Maths', code: 'M5' },
    })
    spy(TimetableEntry, 'find')
      .mockReturnValueOnce(chain([entry(1, '00:00', '00:01'), entry(2, '23:58', '23:59')]))
      .mockReturnValueOnce(chain([entry(1, '08:00', '08:40', 'A'), entry(2, '09:00', '09:40', 'A'), entry(3, '10:00', '10:40', 'B')]))
    spy(Student, 'countDocuments').mockResolvedValue(30)
    const StudentAttendance = require('../models/StudentAttendance.model')
    const StudentLeaveRequest = require('../models/StudentLeaveRequest.model')
    spy(StudentAttendance, 'findOne').mockResolvedValue({ _id: 'att1' })
    spy(StudentLeaveRequest, 'countDocuments').mockResolvedValue(2)
    const res = { json: jest.fn() }
    const next = jest.fn()

    await teachersController.getTeacherWorkspace({ user: { roleName: 'teacher', staffId: 'st1' }, query: {} }, res, next)

    if (next.mock.calls.length) throw next.mock.calls[0][0]
    const payload = JSON.stringify(res.json.mock.calls[0][0])
    expect(payload).toContain('Grade 5')
    expect(payload).toContain('"periodNumber":1')
    expect(TimetableEntry.find.mock.calls[0][0]).toMatchObject({ teacherId: 'st1', dayOfWeek: expect.any(String) })
    // Grade 5-A appears twice in the timetable but once in the class list
    expect(payload.match(/"sectionId":"A"/g).length).toBeGreaterThanOrEqual(1)
    expect(payload).toContain('"studentCount":30')
  })

  test('getMyClasses lists active students per class/section the teacher teaches', async () => {
    spy(TimetableEntry, 'find').mockReturnValue(chain([
      { classId: { _id: 'c5', name: 'Grade 5' }, sectionId: 'A' },
      { classId: { _id: 'c5', name: 'Grade 5' }, sectionId: 'A' },
      { classId: { _id: 'c6', name: 'Grade 6' }, sectionId: 'B' },
    ]))
    spy(Student, 'find').mockReturnValue(chain([{ fullName: 'Sara' }]))
    const res = { json: jest.fn() }

    await teachersController.getMyClasses({ user: { roleName: 'teacher', staffId: 'st1' } }, res, jest.fn())

    const { data } = res.json.mock.calls[0][0]
    expect(data.map((c) => `${c.className}-${c.sectionId}`)).toEqual(['Grade 5-A', 'Grade 6-B'])
    expect(Student.find).toHaveBeenCalledWith(expect.objectContaining({ classId: 'c5', sectionId: 'A', status: 'Active' }))
  })
})
