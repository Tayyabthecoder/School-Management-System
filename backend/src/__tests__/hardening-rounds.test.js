const fs = require('fs')
const path = require('path')
const { checkPermission } = require('../middleware/rbac.middleware')
const { updateStudentSchema, createStudentSchema } = require('../modules/students/students.dto')
const { runPayrollSchema } = require('../modules/hr/hr.dto')

const MODULES_DIR = path.join(__dirname, '..', 'modules')
const routeSource = (file) => fs.readFileSync(path.join(MODULES_DIR, file), 'utf8')

const runGuard = (guard, user) => {
  const next = jest.fn()
  guard({ user }, {}, next)
  return next.mock.calls[0][0]
}

describe('checkPermission fails closed', () => {
  const guard = checkPermission(['teacher'], 'timetable', 'read')

  test('denies a role that has no permission entries', () => {
    const err = runGuard(guard, { role: { name: 'teacher', permissions: [] } })
    expect(err).toBeDefined()
    expect(err.statusCode || err.status).toBe(403)
  })

  test('allows a role that holds the permission', () => {
    const err = runGuard(guard, {
      role: { name: 'teacher', permissions: [{ module: 'timetable', actions: ['read'] }] },
    })
    expect(err).toBeUndefined()
  })

  test('super_admin always passes', () => {
    expect(runGuard(guard, { role: { name: 'super_admin', permissions: [] } })).toBeUndefined()
  })
})

describe('write routes that grant class scope are admin-only', () => {
  const adminOnly = (source, verb, route) => {
    const line = source.split(/\r?\n/).find((l) => l.includes(`router.${verb}('${route}'`))
    expect(line).toBeDefined()
    expect(line).toContain("checkPermission(['super_admin']")
  }

  test('timetable create and delete', () => {
    const source = routeSource('timetable/timetable.routes.js')
    adminOnly(source, 'post', '/')
    adminOnly(source, 'delete', '/:id')
  })

  test('teacher assignment and subject writes', () => {
    adminOnly(routeSource('teachers/teachers.routes.js'), 'post', '/assign')
    const subjects = routeSource('subjects/subjects.routes.js')
    adminOnly(subjects, 'post', '/')
    adminOnly(subjects, 'patch', '/:id')
  })
})

describe('student DTOs', () => {
  const update = (body) => updateStudentSchema.safeParse({ body })

  test('accepts a status change with a transfer reason', () => {
    const parsed = update({ status: 'Transferred', transferReason: 'Moved city' })
    expect(parsed.success).toBe(true)
    expect(parsed.data.body.status).toBe('Transferred')
  })

  test('rejects an unknown status', () => {
    expect(update({ status: 'Vanished' }).success).toBe(false)
  })

  test.each([
    ['an uploaded photo path', '/uploads/photos/abc-123.png', true],
    ['an inline PNG data URL', 'data:image/png;base64,iVBORw0KGgo=', true],
    ['an empty value (clears the photo)', '', true],
    ['a javascript: URL', 'javascript:alert(1)', false],
    ['an external URL', 'https://evil.example/x.png', false],
    ['a path traversal attempt', '/uploads/photos/../../etc/passwd', false],
    ['an SVG data URL', 'data:image/svg+xml;base64,PHN2Zz4=', false],
  ])('photoUrl: %s', (_label, photoUrl, ok) => {
    expect(update({ photoUrl }).success).toBe(ok)
  })

  test('create schema applies the same photo rule', () => {
    const base = { fullName: 'Test Student', classId: 'c1', guardian: { name: 'G', phone: '0300' } }
    const bad = createStudentSchema.safeParse({ body: { ...base, photoUrl: 'javascript:alert(1)' } })
    expect(bad.success).toBe(false)
  })
})

describe('payroll DTO', () => {
  test('keeps the tax, EOBI and SESSI switches', () => {
    const parsed = runPayrollSchema.safeParse({
      body: { month: 5, year: 2026, applyIncomeTax: true, applyEobi: false, applySessi: true },
    })
    expect(parsed.success).toBe(true)
    expect(parsed.data.body).toMatchObject({ applyIncomeTax: true, applyEobi: false, applySessi: true })
  })
})
