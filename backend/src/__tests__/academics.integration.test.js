// End-to-end API tests against a real MongoDB (see test/integration-db.js):
// auth, users, settings, classes, subjects, students, promotion, teachers, timetable,
// attendance, grades, report cards and the guardian portal.
const request = require('supertest')
const { setupIntegrationDb } = require('../../test/integration-db')

jest.setTimeout(60000)

let ctx
let admin
beforeAll(async () => {
  ctx = await setupIntegrationDb('academics')
  admin = await ctx.as('admin')
})
afterAll(async () => { if (ctx) await ctx.teardown() })

const expectStatus = (res, status = 200) => {
  if (res.status !== status) throw new Error(`Expected ${status}, got ${res.status}: ${JSON.stringify(res.body).slice(0, 300)}`)
  return res.body
}
const id = (doc) => String(doc?._id || doc)
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

describe('auth and users', () => {
  test('GET /auth/me returns the signed-in user without secrets', async () => {
    const body = expectStatus(await admin.get('/api/v1/auth/me'))
    const user = body.data.user || body.data
    expect(user.username).toBe('admin')
    expect(JSON.stringify(body)).not.toContain('passwordHash')
  })

  test('requests without a token are rejected', async () => {
    expectStatus(await request(ctx.app).get('/api/v1/students'), 401)
    expectStatus(await request(ctx.app).get('/api/v1/students').set('Authorization', 'Bearer not-a-jwt'), 401)
  })

  test('admin creates a user, the user signs in, changes password and the old one stops working', async () => {
    const created = expectStatus(await admin.post('/api/v1/users').send({ username: 'it_clerk', password: 'FirstPass123', roleName: 'accountant' }), 201)
    expect(created.data.username || created.data.user?.username).toBe('it_clerk')
    expectStatus(await admin.post('/api/v1/users').send({ username: 'it_clerk', password: 'FirstPass123', roleName: 'accountant' }), 409)
    expectStatus(await admin.post('/api/v1/users').send({ username: 'x', password: 'short', roleName: 'boss' }), 400)

    const list = expectStatus(await admin.get('/api/v1/users?search=it_clerk&role=accountant'))
    expect(JSON.stringify(list.data)).toContain('it_clerk')

    const login = expectStatus(await request(ctx.app).post('/api/v1/auth/login').send({ username: 'it_clerk', password: 'FirstPass123' }))
    const access = login.data.accessToken
    expectStatus(await request(ctx.app).post('/api/v1/auth/change-password').set('Authorization', `Bearer ${access}`)
      .send({ currentPassword: 'wrong-pass-1', newPassword: 'SecondPass456' }), 400)
    expectStatus(await request(ctx.app).post('/api/v1/auth/change-password').set('Authorization', `Bearer ${access}`)
      .send({ currentPassword: 'FirstPass123', newPassword: 'SecondPass456' }))
    expectStatus(await request(ctx.app).post('/api/v1/auth/login').send({ username: 'it_clerk', password: 'FirstPass123' }), 401)

    const userId = (await require('../models/User.model').findOne({ username: 'it_clerk' }))._id
    expectStatus(await admin.put(`/api/v1/users/${userId}/reset-password`).send({ newPassword: 'ThirdPass789' }))
    expectStatus(await request(ctx.app).post('/api/v1/auth/login').send({ username: 'it_clerk', password: 'ThirdPass789' }))
  })

  test('non-admins cannot manage users', async () => {
    const teacher = await ctx.as('teacher1')
    expectStatus(await teacher.get('/api/v1/users'), 403)
  })
})

describe('settings', () => {
  test('allowed-days is public and settings can be read and updated by admin', async () => {
    const days = expectStatus(await request(ctx.app).get('/api/v1/settings/allowed-days'))
    expect(days.data.allowedDays).toHaveLength(7)
    expect(days.data).toHaveProperty('today')

    expectStatus(await admin.get('/api/v1/settings'))
    const updated = expectStatus(await admin.patch('/api/v1/settings').send({ attendanceAlertThreshold: 80, schoolName: 'Integration Test School' }))
    expect(updated.data.attendanceAlertThreshold).toBe(80)
    expectStatus(await admin.patch('/api/v1/settings').send({ attendanceAlertThreshold: 5 }), 400)
    expectStatus(await (await ctx.as('teacher1')).patch('/api/v1/settings').send({ attendanceAlertThreshold: 70 }), 403)
  })
})

describe('classes and subjects', () => {
  test('class lifecycle: create, add/remove a section, delete', async () => {
    const created = expectStatus(await admin.post('/api/v1/classes').send({ name: 'IT Grade 13', level: 13 }), 201)
    const classId = id(created.data)
    const withSection = expectStatus(await admin.post(`/api/v1/classes/${classId}/sections`).send({ sectionName: 'C' }))
    expect(JSON.stringify(withSection.data)).toContain('C')
    expectStatus(await admin.delete(`/api/v1/classes/${classId}/sections/C`))
    expectStatus(await admin.delete(`/api/v1/classes/${classId}`))
    expectStatus(await admin.delete(`/api/v1/classes/${classId}`), 404)

    const all = expectStatus(await admin.get('/api/v1/classes'))
    expect(all.data.length).toBeGreaterThanOrEqual(12)
  })

  test('a class with students cannot be deleted', async () => {
    const res = await admin.delete(`/api/v1/classes/${id(ctx.fixtures.cls)}`)
    expect([400, 409]).toContain(res.status)
  })

  test('subject lifecycle with a unique code per class', async () => {
    const classId = id(ctx.fixtures.cls)
    const created = expectStatus(await admin.post('/api/v1/subjects').send({ name: 'Robotics', code: 'rob-1', classId }), 201)
    const subjectId = id(created.data)
    expect(created.data.code).toBe('ROB-1')
    expectStatus(await admin.post('/api/v1/subjects').send({ name: 'Robotics 2', code: 'ROB-1', classId }), 409)

    expectStatus(await admin.get(`/api/v1/subjects/${subjectId}`))
    const list = expectStatus(await admin.get(`/api/v1/subjects?classId=${classId}`))
    expect(list.data.some((s) => id(s) === subjectId)).toBe(true)
    expectStatus(await admin.patch(`/api/v1/subjects/${subjectId}`).send({ name: 'Robotics & AI', isActive: false }))
    expectStatus(await admin.delete(`/api/v1/subjects/${subjectId}`))
    expectStatus(await admin.get(`/api/v1/subjects/${subjectId}`), 404)

    const legacy = expectStatus(await admin.post('/api/v1/classes/subjects').send({ name: 'Ethics', code: 'ETH-1', classId }), 201)
    expect(legacy.data.code).toBe('ETH-1')
    expectStatus(await admin.get(`/api/v1/classes/subjects?classId=${classId}`))
  })

  test('academic years list', async () => {
    const years = expectStatus(await admin.get('/api/v1/classes/academic-years'))
    expect(years.data.filter((y) => y.isActive)).toHaveLength(1)
  })
})

describe('students', () => {
  test('list supports search, class filter and pagination', async () => {
    const { childA } = ctx.fixtures
    const page = expectStatus(await admin.get('/api/v1/students?page=1&limit=5'))
    expect(page.data.length).toBeLessThanOrEqual(5)
    const byClass = expectStatus(await admin.get(`/api/v1/students?classId=${id(childA.classId)}&sectionId=${childA.sectionId}`))
    expect(byClass.data.every((s) => id(s.classId) === id(childA.classId))).toBe(true)
    const search = expectStatus(await admin.get(`/api/v1/students?search=${encodeURIComponent(childA.fullName.split(' ')[0])}`))
    expect(search.data.length).toBeGreaterThan(0)
  })

  test('create, read, update, move section and delete a student', async () => {
    const { cls } = ctx.fixtures
    const created = expectStatus(await admin.post('/api/v1/students').send({
      fullName: 'Integration Student',
      dob: '2015-04-01',
      gender: 'Female',
      classId: id(cls),
      sectionId: 'A',
      guardian: { name: 'Integration Parent', phone: '03001234567', relationship: 'Mother' },
    }), 201)
    const student = created.data.student || created.data
    const sid = id(student)
    expect(student.studentId).toMatch(/^STU-\d{4}-\d+/)

    expectStatus(await admin.get(`/api/v1/students/${sid}`))
    const updated = expectStatus(await admin.put(`/api/v1/students/${sid}`).send({ fullName: 'Integration Student Two', address: 'Lahore' }))
    expect((updated.data.student || updated.data).fullName).toBe('Integration Student Two')
    expectStatus(await admin.patch(`/api/v1/students/${sid}/section`).send({ sectionId: 'B' }))
    expectStatus(await admin.patch(`/api/v1/students/${sid}/section`).send({ sectionId: 'Z' }), 400)
    expectStatus(await admin.delete(`/api/v1/students/${sid}`))
    expectStatus(await admin.get(`/api/v1/students/${sid}`), 404)
  })

  test('invalid student payloads are rejected', async () => {
    expectStatus(await admin.post('/api/v1/students').send({ fullName: 'X' }), 400)
  })

  test('a student opens their own portal and nobody else\'s profile', async () => {
    const student = await ctx.as('stu-2026-0001')
    const portal = expectStatus(await student.get('/api/v1/students/me/portal'))
    expect(portal.data).toBeDefined()
    const other = ctx.fixtures.students.find((s) => s.studentId !== 'STU-2026-0001')
    expectStatus(await student.get(`/api/v1/students/${id(other)}`), 403)
  })

  test('import template downloads as a spreadsheet', async () => {
    const res = await admin.get('/api/v1/students/import-template')
    expectStatus(res)
    expect(res.headers['content-type']).toMatch(/spreadsheet/)
  })
})

describe('promotion', () => {
  test('config, preview and execute promote students by final-term results', async () => {
    const Class = require('../models/Class.model')
    const AcademicYear = require('../models/AcademicYear.model')
    const year = await AcademicYear.findOne({ isActive: true })
    const [from, to] = await Class.find().sort({ level: 1 }).limit(2)

    expectStatus(await admin.get(`/api/v1/students/promotion/config?academicYearId=${year._id}`))
    const saved = expectStatus(await admin.post('/api/v1/students/promotion/config').send({
      academicYearId: String(year._id), finalExamTermName: 'Term 1', mappings: [{ fromClassId: String(from._id), toClassId: String(to._id) }],
    }))
    const configId = id(saved.data)
    const preview = expectStatus(await admin.post('/api/v1/students/promotion/preview').send({ configId }))
    expect(preview.data).toBeDefined()
    const executed = expectStatus(await admin.post('/api/v1/students/promotion/execute').send({ configId }))
    expect(executed.success).toBe(true)
    // the claim is atomic: a second execution is refused
    const again = await admin.post('/api/v1/students/promotion/execute').send({ configId })
    expect([400, 409]).toContain(again.status)
  })
})

describe('teachers and timetable', () => {
  test('teacher directory, schedule, creation and period assignment', async () => {
    const { teacherStaff, cls, subject } = ctx.fixtures
    const list = expectStatus(await admin.get('/api/v1/teachers?search=a'))
    expect(Array.isArray(list.data)).toBe(true)
    const schedule = expectStatus(await admin.get(`/api/v1/teachers/${id(teacherStaff)}/schedule`))
    expect(schedule.teacher.staffId).toBe(teacherStaff.staffId)
    expect(JSON.stringify(schedule.schedule)).toContain('08:00')

    const created = expectStatus(await admin.post('/api/v1/teachers').send({ fullName: 'Integration Teacher', phone: '03007654321', salary: 55000 }), 201)
    const newTeacherId = id(created.data.staff || created.data)
    const assigned = expectStatus(await admin.post('/api/v1/teachers/assign').send({
      classId: id(cls), sectionId: 'B', subjectId: id(subject), teacherId: newTeacherId, dayOfWeek: 'Monday', periodNumber: 5, startTime: '11:00', endTime: '11:45',
    }))
    expect(assigned.data.teacherId).toBeDefined()
    expect(JSON.stringify(assigned.data)).not.toContain('salary')
    // double booking the same teacher in the same slot is refused
    const clash = await admin.post('/api/v1/teachers/assign').send({
      classId: id(cls), sectionId: 'A', subjectId: id(subject), teacherId: newTeacherId, dayOfWeek: 'Monday', periodNumber: 5, startTime: '11:00', endTime: '11:45',
    })
    expect([400, 409]).toContain(clash.status)
  })

  test('timetable read, create and delete', async () => {
    const { cls, subject, teacherStaff, childA } = ctx.fixtures
    const list = expectStatus(await admin.get(`/api/v1/timetable?classId=${id(cls)}&sectionId=${childA.sectionId}`))
    expect(list.data.length).toBeGreaterThan(0)
    expect(JSON.stringify(list.data)).not.toMatch(/"salary"|"cnic"/)
    const created = expectStatus(await admin.post('/api/v1/timetable').send({
      classId: id(cls), sectionId: childA.sectionId, subjectId: id(subject), teacherId: id(teacherStaff), dayOfWeek: 'Friday', periodNumber: 7, startTime: '12:00', endTime: '12:45',
    }), 201)
    expectStatus(await admin.delete(`/api/v1/timetable/${id(created.data)}`))
    expectStatus(await admin.delete(`/api/v1/timetable/${id(created.data)}`), 404)
  })

  test('teacher workspace and my classes', async () => {
    const teacher = await ctx.as('teacher1')
    const ws = expectStatus(await teacher.get('/api/v1/teachers/me/workspace'))
    expect(JSON.stringify(ws.data)).toContain('08:00')
    const mine = expectStatus(await teacher.get('/api/v1/teachers/me/my-classes'))
    expect(mine.data.length).toBeGreaterThan(0)
    expect(mine.data[0].students.length).toBeGreaterThan(0)
  })
})

describe('attendance', () => {
  test('teacher marks class attendance and reads it back; staff attendance by HR', async () => {
    const { childA } = ctx.fixtures
    const teacher = await ctx.as('teacher1')
    const date = '2026-02-02'
    expectStatus(await teacher.post('/api/v1/attendance/student').send({
      classId: id(childA.classId), sectionId: childA.sectionId, date,
      records: [{ studentId: id(childA), status: 'Absent', remarks: 'sick' }],
    }))
    const read = expectStatus(await teacher.get(`/api/v1/attendance/student?classId=${id(childA.classId)}&sectionId=${childA.sectionId}&date=${date}`))
    expect(JSON.stringify(read.data)).toContain('Absent')
    expectStatus(await teacher.get(`/api/v1/attendance/student?classId=${id(childA.classId)}&date=not-a-date`), 400)

    const hr = await ctx.as('hr_manager')
    expectStatus(await hr.post('/api/v1/attendance/staff').send({ staffId: id(ctx.fixtures.teacherStaff), date, status: 'Late' }))
    const staff = expectStatus(await hr.get(`/api/v1/attendance/staff?date=${date}`))
    expect(staff.data.some((r) => r.status === 'Late')).toBe(true)
    expectStatus(await teacher.post('/api/v1/attendance/staff').send({ staffId: id(ctx.fixtures.teacherStaff), status: 'Present' }), 403)
  })
})

describe('grades and report cards', () => {
  test('exam lifecycle: create, enter marks, publish, read results', async () => {
    const { childA, cls, subject } = ctx.fixtures
    const AcademicYear = require('../models/AcademicYear.model')
    const year = await AcademicYear.findOne({ isActive: true })
    const teacher = await ctx.as('teacher1')

    const exams = expectStatus(await admin.get(`/api/v1/grades/exams?classId=${id(cls)}`))
    expect(Array.isArray(exams.data)).toBe(true)
    expectStatus(await admin.get('/api/v1/grades/exams?classId=nope'), 400)

    const exam = expectStatus(await admin.post('/api/v1/grades/exams').send({
      title: 'IT Final', academicYearId: String(year._id), termName: 'Final Term', classId: id(cls), subjectId: id(subject), examDate: today(), maxMarks: 50, passMarks: 20,
    }), 201).data
    expectStatus(await admin.post('/api/v1/grades/exams').send({
      title: 'Bad', academicYearId: String(year._id), termName: 'Final Term', classId: id(cls), subjectId: id(subject), examDate: today(), maxMarks: 50, passMarks: 60,
    }), 400)

    const entry = expectStatus(await teacher.get(`/api/v1/grades/entry/${id(exam)}`))
    expect(entry.data).toBeDefined()
    expectStatus(await teacher.post('/api/v1/grades/entry').send({ examId: id(exam), grades: [{ studentId: id(childA), marksObtained: 45 }] }))
    expectStatus(await teacher.post('/api/v1/grades/entry').send({ examId: id(exam), grades: [{ studentId: id(childA), marksObtained: 99 }] }), 400)

    // unpublished results are hidden from the student
    const student = await ctx.as('stu-2026-0001')
    const before = expectStatus(await student.get(`/api/v1/report-cards/${id(childA)}?termName=Final%20Term`))
    expect(before.data.grades.find((g) => g.subjectName === subject.name && g.maxMarks === 50)).toBeUndefined()

    expectStatus(await admin.patch(`/api/v1/grades/exams/${id(exam)}/publish`))
    const after = expectStatus(await student.get(`/api/v1/report-cards/${id(childA)}?termName=Final%20Term`))
    expect(after.data.grades.find((g) => g.maxMarks === 50)).toMatchObject({ marksObtained: 45, status: 'Passed' })

    expectStatus(await admin.get(`/api/v1/grades/student/${id(childA)}`))
    expectStatus(await admin.get(`/api/v1/grades/report-card?studentId=${id(childA)}&termName=Final%20Term`))
  })

  test('report card and transcript PDFs, JSON transcript and class bulk download', async () => {
    const { childA, cls } = ctx.fixtures
    const pdf = await admin.get(`/api/v1/report-cards/${id(childA)}/pdf?termName=Term%201`)
    expectStatus(pdf)
    expect(pdf.headers['content-type']).toBe('application/pdf')
    const transcript = expectStatus(await admin.get(`/api/v1/report-cards/${id(childA)}/transcript`))
    expect(transcript.data.terms.length).toBeGreaterThan(0)
    const tpdf = await admin.get(`/api/v1/report-cards/${id(childA)}/transcript/pdf`)
    expectStatus(tpdf)
    expect(tpdf.headers['content-type']).toBe('application/pdf')
    const bulk = await admin.get(`/api/v1/report-cards/class/${id(cls)}?termName=Term%201`)
    expectStatus(bulk)
    expect(bulk.headers['content-type']).toBe('application/pdf')
    expectStatus(await admin.get('/api/v1/report-cards/64b000000000000000000099'), 404)
  })
})

describe('guardian portal', () => {
  test('a two-child guardian sees each child and nobody else', async () => {
    const { childA, childB, students } = ctx.fixtures
    const guardian = await ctx.as('it_guardian')
    const kids = expectStatus(await guardian.get('/api/v1/guardian/my-children'))
    expect(kids.data.map(id).sort()).toEqual([id(childA), id(childB)].sort())

    for (const path of ['my-child', 'attendance', 'grades', 'fees', 'leave-requests']) {
      expectStatus(await guardian.get(`/api/v1/guardian/${path}?studentId=${id(childB)}`))
    }
    const stranger = students.find((s) => ![id(childA), id(childB)].includes(id(s)))
    expectStatus(await guardian.get(`/api/v1/guardian/my-child?studentId=${id(stranger)}`), 403)
    expectStatus(await guardian.get(`/api/v1/students/${id(stranger)}`), 403)
  })

  test('guardian files a leave request and the class teacher reviews it', async () => {
    const { childA } = ctx.fixtures
    const guardian = await ctx.as('it_guardian')
    const filed = expectStatus(await guardian.post('/api/v1/guardian/leave-requests').send({
      studentId: id(childA), startDate: '2026-12-07', endDate: '2026-12-08', category: 'Sick', reason: 'Fever and rest',
    }), 201)
    expectStatus(await guardian.post('/api/v1/guardian/leave-requests').send({ startDate: '2026-12-08', endDate: '2026-12-07', category: 'Sick', reason: 'Backwards dates' }), 400)

    const teacher = await ctx.as('teacher1')
    const pending = expectStatus(await teacher.get('/api/v1/teachers/leave-requests?status=Pending'))
    expect(pending.data.some((r) => id(r) === id(filed.data))).toBe(true)
    expectStatus(await teacher.patch(`/api/v1/teachers/leave-requests/${id(filed.data)}/review`).send({ status: 'Approved', remarks: 'Get well soon' }))
    const mine = expectStatus(await guardian.get('/api/v1/guardian/leave-requests'))
    expect(mine.data.find((r) => id(r) === id(filed.data)).status).toBe('Approved')
  })
})
