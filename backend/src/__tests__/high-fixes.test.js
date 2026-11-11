const { generateInitialPassword } = require('../utils/password.util')
const { validate } = require('../middleware/validate.middleware')
const { createExamSchema } = require('../modules/grades/grades.dto')
const { assertTeacherStudentScope } = require('../utils/guardian-auth.util')
const TimetableEntry = require('../models/TimetableEntry.model')

jest.mock('../models/TimetableEntry.model')

describe('initial passwords', () => {
  test('are random, strong and never the old shared defaults', () => {
    const seen = new Set()
    for (let i = 0; i < 50; i++) {
      const p = generateInitialPassword()
      expect(p).toHaveLength(12)
      expect(p).toMatch(/[A-Za-z]/)
      expect(p).toMatch(/[0-9]/)
      expect(['Student@1234', 'Staff@1234', 'Teacher@1234']).not.toContain(p)
      seen.add(p)
    }
    expect(seen.size).toBe(50)
  })
})

describe('validate middleware strips unknown body fields (mass assignment)', () => {
  test('req.body only keeps schema fields', () => {
    const req = {
      body: {
        title: 'Mid', academicYearId: 'a', termName: 't', classId: 'c', subjectId: 's',
        examDate: '2026-01-01', _id: 'forced', createdBy: 'attacker',
      },
      query: {}, params: {},
    }
    const next = jest.fn()
    validate(createExamSchema)(req, {}, next)
    expect(next).toHaveBeenCalledWith()
    expect(req.body).not.toHaveProperty('_id')
    expect(req.body).not.toHaveProperty('createdBy')
    expect(req.body.maxMarks).toBe(100)
  })
})

describe('teacher student scope', () => {
  const student = { classId: 'c1', sectionId: 'A' }
  test('allows a teacher timetabled for the section', async () => {
    TimetableEntry.exists.mockResolvedValue({ _id: 1 })
    await expect(assertTeacherStudentScope({ roleName: 'teacher', staffId: 's1' }, student)).resolves.toBeUndefined()
  })
  test('blocks a teacher with no timetable entry for the section', async () => {
    TimetableEntry.exists.mockResolvedValue(null)
    await expect(assertTeacherStudentScope({ roleName: 'teacher', staffId: 's1' }, student)).rejects.toThrow(/Forbidden/)
  })
  test('blocks a teacher with no linked staff record', async () => {
    await expect(assertTeacherStudentScope({ roleName: 'teacher' }, student)).rejects.toThrow(/Forbidden/)
  })
  test('does not restrict other roles', async () => {
    await expect(assertTeacherStudentScope({ roleName: 'super_admin' }, student)).resolves.toBeUndefined()
  })
})
