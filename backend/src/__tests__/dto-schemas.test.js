// Request schemas for classes, subjects and teachers: what is accepted, what is trimmed or coerced, and the
// message a caller gets for each kind of mistake (these are the 400 responses the UI shows).
const { createClassSchema, addSectionSchema, createAcademicYearSchema } = require('../modules/classes/classes.dto')
const { createSubjectSchema, updateSubjectSchema } = require('../modules/subjects/subjects.dto')
const { createTeacherSchema, assignTeacherPeriodSchema, reviewLeaveRequestSchema } = require('../modules/teachers/teachers.dto')

const ID = '64b7f0c2a1b2c3d4e5f60718'
const messages = (schema, body) => {
  const result = schema.safeParse({ body })
  return result.success ? [] : result.error.issues.map((i) => i.message)
}
const parsed = (schema, body) => schema.parse({ body }).body

describe('classes.dto', () => {
  test('createClass trims the name and coerces the level from a string', () => {
    expect(parsed(createClassSchema, { name: '  Grade 5 ', level: '5' })).toEqual({ name: 'Grade 5', level: 5 })
  })

  test('createClass accepts sections as an array or one string', () => {
    expect(parsed(createClassSchema, { name: 'G', level: 1, sections: ['A', 'B'] }).sections).toEqual(['A', 'B'])
    expect(parsed(createClassSchema, { name: 'G', level: 1, sections: 'A' }).sections).toBe('A')
  })

  test.each([
    [{ level: 1 }, 'Class name is required'],
    [{ name: '   ', level: 1 }, 'Class name cannot be empty'],
    [{ name: 'G' }, 'Level is required'],
  ])('createClass %j is rejected with %s', (body, message) => {
    expect(messages(createClassSchema, body)).toContain(message)
  })

  test.each([[0], [21], [1.5], ['abc']])('createClass rejects level %j', (level) => {
    expect(messages(createClassSchema, { name: 'G', level })).not.toEqual([])
  })

  test('createClass rejects an over-long name and empty or long section names', () => {
    expect(messages(createClassSchema, { name: 'x'.repeat(51), level: 1 })).not.toEqual([])
    expect(messages(createClassSchema, { name: 'G', level: 1, sections: [''] })).not.toEqual([])
    expect(messages(createClassSchema, { name: 'G', level: 1, sections: ['x'.repeat(11)] })).not.toEqual([])
  })

  test('addSection requires a short, non-empty section name', () => {
    expect(parsed(addSectionSchema, { sectionName: ' C ' }).sectionName).toBe('C')
    expect(messages(addSectionSchema, {})).toContain('Section name is required')
    expect(messages(addSectionSchema, { sectionName: ' ' })).toContain('Section name cannot be empty')
    expect(messages(addSectionSchema, { sectionName: 'x'.repeat(11) })).not.toEqual([])
  })

  test('createAcademicYear takes a numeric or numeric-string year and real dates', () => {
    const body = parsed(createAcademicYearSchema, { year: '2026', startDate: '2026-04-01', endDate: '2027-03-31', terms: [{ name: 'Term 1' }] })
    expect(body.year).toBe(2026)
    expect(body.startDate).toBeInstanceOf(Date)
    expect(body.endDate).toBeInstanceOf(Date)
  })

  test.each([
    [{ startDate: '2026-04-01', endDate: '2027-03-31' }, 'Academic year is required'],
    [{ year: 2026, endDate: '2027-03-31' }, 'Start date is required'],
    [{ year: 2026, startDate: '2026-04-01' }, 'End date is required'],
  ])('createAcademicYear %j is rejected with %s', (body, message) => {
    expect(messages(createAcademicYearSchema, body)).toContain(message)
  })

  test('createAcademicYear rejects an out-of-range year and a garbage date', () => {
    expect(messages(createAcademicYearSchema, { year: 1999, startDate: '2026-04-01', endDate: '2027-03-31' })).not.toEqual([])
    expect(messages(createAcademicYearSchema, { year: 2101, startDate: '2026-04-01', endDate: '2027-03-31' })).not.toEqual([])
    expect(messages(createAcademicYearSchema, { year: 2026, startDate: 'not a date', endDate: '2027-03-31' })).not.toEqual([])
  })
})

describe('subjects.dto', () => {
  test('createSubject trims and accepts an optional description', () => {
    expect(parsed(createSubjectSchema, { name: ' Maths ', code: ' MTH ', classId: ID, description: 'Numbers' })).toEqual({ name: 'Maths', code: 'MTH', classId: ID, description: 'Numbers' })
  })

  test.each([
    [{ code: 'M', classId: ID }, 'Subject name is required'],
    [{ name: 'M', classId: ID }, 'Subject code is required'],
    [{ name: 'M', code: 'M' }, 'classId is required'],
    [{ name: ' ', code: 'M', classId: ID }, 'Subject name cannot be empty'],
    [{ name: 'M', code: ' ', classId: ID }, 'Subject code cannot be empty'],
    [{ name: 'M', code: 'M', classId: 'not-an-id' }, 'Invalid classId ObjectId'],
  ])('createSubject %j is rejected with %s', (body, message) => {
    expect(messages(createSubjectSchema, body)).toContain(message)
  })

  test('createSubject enforces maximum lengths', () => {
    expect(messages(createSubjectSchema, { name: 'x'.repeat(101), code: 'M', classId: ID })).not.toEqual([])
    expect(messages(createSubjectSchema, { name: 'M', code: 'x'.repeat(21), classId: ID })).not.toEqual([])
    expect(messages(createSubjectSchema, { name: 'M', code: 'M', classId: ID, description: 'x'.repeat(501) })).not.toEqual([])
  })

  test('updateSubject is entirely optional but still validates what it is given', () => {
    expect(parsed(updateSubjectSchema, {})).toEqual({})
    expect(parsed(updateSubjectSchema, { name: ' New ', isActive: false })).toEqual({ name: 'New', isActive: false })
    expect(messages(updateSubjectSchema, { name: '' })).not.toEqual([])
    expect(messages(updateSubjectSchema, { code: 'x'.repeat(21) })).not.toEqual([])
    expect(messages(updateSubjectSchema, { isActive: 'yes' })).not.toEqual([])
  })
})

describe('teachers.dto', () => {
  test('createTeacher needs a name of at least two characters; everything else is optional', () => {
    expect(parsed(createTeacherSchema, { fullName: ' Ayesha Raza ' })).toEqual({ fullName: 'Ayesha Raza' })
    expect(messages(createTeacherSchema, {})).toContain('Full name is required')
    expect(messages(createTeacherSchema, { fullName: 'A' })).toContain('Full name must be at least 2 characters')
  })

  test('createTeacher coerces the salary, validates the email and accepts a date string or Date', () => {
    const full = parsed(createTeacherSchema, { fullName: 'Ayesha Raza', salary: '85000', email: 'a@school.pk', joiningDate: new Date('2026-01-01'), phone: ' 0300 ', cnic: '1', designation: 'PGT', department: 'Science', qualification: 'MSc' })
    expect(full.salary).toBe(85000)
    expect(full.phone).toBe('0300')
    expect(messages(createTeacherSchema, { fullName: 'Ayesha Raza', email: 'not-an-email' })).toContain('Invalid email address')
    expect(messages(createTeacherSchema, { fullName: 'Ayesha Raza', salary: '-1' })).not.toEqual([])
  })

  const slot = { classId: ID, sectionId: 'A', subjectId: ID, teacherId: ID, dayOfWeek: 'Monday', periodNumber: '3' }

  test('assignTeacherPeriod accepts a complete slot and coerces the period number', () => {
    expect(parsed(assignTeacherPeriodSchema, { ...slot, startTime: ' 08:00 ', room: ' 12 ' })).toMatchObject({ periodNumber: 3, startTime: '08:00', room: '12' })
  })

  test.each([
    ['classId', 'classId is required'],
    ['sectionId', 'sectionId is required'],
    ['subjectId', 'subjectId is required'],
    ['teacherId', 'teacherId is required'],
    ['periodNumber', 'periodNumber is required'],
  ])('assignTeacherPeriod without %s says %s', (field, message) => {
    const { [field]: _omitted, ...rest } = slot
    expect(messages(assignTeacherPeriodSchema, rest)).toContain(message)
  })

  test('assignTeacherPeriod rejects bad ids, weekdays and period numbers', () => {
    expect(messages(assignTeacherPeriodSchema, { ...slot, classId: 'x' })).toContain('Invalid classId ObjectId')
    expect(messages(assignTeacherPeriodSchema, { ...slot, subjectId: 'x' })).toContain('Invalid subjectId ObjectId')
    expect(messages(assignTeacherPeriodSchema, { ...slot, teacherId: 'x' })).toContain('Invalid teacherId ObjectId')
    expect(messages(assignTeacherPeriodSchema, { ...slot, dayOfWeek: 'Funday' })).toContain('dayOfWeek must be a valid weekday')
    expect(messages(assignTeacherPeriodSchema, { ...slot, periodNumber: 0 })).not.toEqual([])
    expect(messages(assignTeacherPeriodSchema, { ...slot, periodNumber: 13 })).not.toEqual([])
    expect(messages(assignTeacherPeriodSchema, { ...slot, periodNumber: 2.5 })).not.toEqual([])
  })

  test('reviewLeaveRequest only accepts Approved or Rejected, with optional trimmed remarks', () => {
    expect(parsed(reviewLeaveRequestSchema, { status: 'Approved', remarks: ' ok ' })).toEqual({ status: 'Approved', remarks: 'ok' })
    expect(parsed(reviewLeaveRequestSchema, { status: 'Rejected' }).status).toBe('Rejected')
    expect(messages(reviewLeaveRequestSchema, { status: 'Pending' })).toContain("Status must be either 'Approved' or 'Rejected'")
    expect(messages(reviewLeaveRequestSchema, { status: 'Approved', remarks: 'x'.repeat(501) })).not.toEqual([])
  })
})
