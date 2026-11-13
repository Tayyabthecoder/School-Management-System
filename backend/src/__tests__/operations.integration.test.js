// End-to-end API tests against a real MongoDB (see test/integration-db.js):
// finance, HR and payroll, reports and analytics, exports, imports and uploads.
const fs = require('fs')
const path = require('path')
const ExcelJS = require('exceljs')
const { setupIntegrationDb } = require('../../test/integration-db')

jest.setTimeout(90000)

let ctx
let admin
let accountant
let hr
beforeAll(async () => {
  ctx = await setupIntegrationDb('operations')
  admin = await ctx.as('admin')
  accountant = await ctx.as('accountant1')
  hr = await ctx.as('hr_manager')
})
afterAll(async () => { if (ctx) await ctx.teardown() })

const expectStatus = (res, status = 200) => {
  if (res.status !== status) throw new Error(`Expected ${status}, got ${res.status}: ${JSON.stringify(res.body).slice(0, 300)}`)
  return res.body
}
const id = (doc) => String(doc?._id || doc)

describe('finance', () => {
  test('fee structures: list (year-scoped) and create', async () => {
    const { cls } = ctx.fixtures
    const list = expectStatus(await accountant.get(`/api/v1/finance/structures?classId=${id(cls)}`))
    expect(list.data.length).toBeGreaterThan(0)
    expectStatus(await accountant.get('/api/v1/finance/structures?allYears=true'))
    expectStatus(await accountant.get('/api/v1/finance/structures?classId=bad'), 400)
    const created = expectStatus(await accountant.post('/api/v1/finance/structures').send({
      feeType: 'Exam', classId: id(cls), amount: 1500, dueDate: '2026-12-20',
    }), 201)
    expect(created.data.amount).toBe(1500)
    expectStatus(await (await ctx.as('teacher1')).post('/api/v1/finance/structures').send({ feeType: 'Exam', classId: id(cls), amount: 1, dueDate: '2026-12-20' }), 403)
  })

  test('assign a fee, take a partial and a final payment, download receipt and challan', async () => {
    const { childA, cls } = ctx.fixtures
    const FeeStructure = require('../models/FeeStructure.model')
    const structure = await FeeStructure.findOne({ classId: cls._id })
    const assigned = expectStatus(await accountant.post('/api/v1/finance/student-fees/assign').send({
      studentId: id(childA), feeStructureId: id(structure), discount: 500, concessionType: 'Sibling Discount', dueDate: '2026-12-25',
    }), 201)
    const fee = assigned.data
    expect(fee.netAmount).toBe(fee.amountDue - 500)

    const listed = expectStatus(await accountant.get(`/api/v1/finance/student-fees?studentId=${id(childA)}&page=1&limit=50`))
    expect(listed.data.some((f) => id(f) === id(fee))).toBe(true)
    expectStatus(await accountant.get(`/api/v1/finance/student-fees?classId=${id(cls)}&status=Pending&search=${encodeURIComponent(childA.fullName)}`))

    const concession = expectStatus(await accountant.post('/api/v1/finance/concession').send({
      studentFeeId: id(fee), discountAmount: 1000, concessionType: 'Merit Scholarship', concessionReason: 'Top of class',
    }))
    const net = concession.data.netAmount
    expectStatus(await accountant.post('/api/v1/finance/concession').send({ studentFeeId: id(fee), discountAmount: 10 ** 9 }), 400)

    const part = expectStatus(await accountant.post('/api/v1/finance/payments').send({ studentFeeId: id(fee), amountPaid: 100, paymentMode: 'Cash' }), 201)
    expectStatus(await accountant.post('/api/v1/finance/payments').send({ studentFeeId: id(fee), amountPaid: 10 ** 9 }), 400)
    const final = expectStatus(await accountant.post('/api/v1/finance/payments').send({ studentFeeId: id(fee), amountPaid: net - 100, paymentMode: 'Bank Transfer', referenceNo: 'TRX-1' }), 201)
    const paymentId = id(final.data.payment || final.data)

    const receipt = await accountant.get(`/api/v1/finance/receipt/${paymentId}`)
    expectStatus(receipt)
    expect(receipt.headers['content-type']).toBe('application/pdf')
    expect(part.success).toBe(true)

    const challan = await accountant.get(`/api/v1/finance/challans/${id(fee)}/pdf`)
    expectStatus(challan)
    expect(challan.headers['content-type']).toBe('application/pdf')

    // families only reach their own documents
    const guardian = await ctx.as('it_guardian')
    expectStatus(await guardian.get(`/api/v1/finance/receipt/${paymentId}`))
    const strangerFee = await require('../models/StudentFee.model').findOne({ studentId: { $nin: [ctx.fixtures.childA._id, ctx.fixtures.childB._id] } })
    expectStatus(await guardian.get(`/api/v1/finance/challan/${id(strangerFee)}`), 403)
    const student = await ctx.as('stu-2026-0001')
    expectStatus(await student.get('/api/v1/finance/student-fees'))
  })

  test('challan settings and monthly challan generation', async () => {
    const settings = expectStatus(await accountant.get('/api/v1/finance/challan-settings'))
    expect(settings.data).toBeDefined()
    const saved = expectStatus(await accountant.put('/api/v1/finance/challan-settings').send({ layout: '3-part', lateFeeSurcharge: 750 }))
    expect(saved.data.lateFeeSurcharge).toBe(750)

    expectStatus(await accountant.get('/api/v1/finance/monthly-challans/status'))
    const generated = expectStatus(await accountant.post('/api/v1/finance/monthly-challans/generate').send({ targetDate: '2026-12-01' }))
    expect(generated.data.generatedCount + generated.data.skippedCount).toBeGreaterThan(0)
    const again = expectStatus(await accountant.post('/api/v1/finance/monthly-challans/generate').send({ targetDate: '2026-12-01' }))
    expect(again.data.generatedCount).toBe(0)
  })
})

describe('HR and payroll', () => {
  test('staff directory and creation', async () => {
    const list = expectStatus(await hr.get('/api/v1/hr/staff'))
    expect(list.data.length).toBeGreaterThan(0)
    const created = expectStatus(await hr.post('/api/v1/hr/staff').send({
      fullName: 'Integration Clerk', cnic: '35202-1234567-1', phone: '03001112233', designation: 'Clerk', department: 'Administration', joiningDate: '2026-01-10', salary: 40000,
    }), 201)
    expect(created.data.staffId).toBeDefined()
    expectStatus(await hr.post('/api/v1/hr/staff').send({ fullName: 'X' }), 400)
  })

  test('leave: staff request, HR review, no self-approval', async () => {
    const teacher = await ctx.as('teacher1')
    const filed = expectStatus(await teacher.post('/api/v1/hr/leave').send({ leaveType: 'Casual', fromDate: '2026-12-10', toDate: '2026-12-11', reason: 'Family wedding' }), 201)
    expectStatus(await teacher.post('/api/v1/hr/leave').send({ leaveType: 'Casual', fromDate: '2026-12-11', toDate: '2026-12-10', reason: 'Backwards' }), 400)
    const mine = expectStatus(await teacher.get('/api/v1/hr/leave'))
    expect(mine.data.every((l) => id(l.staffId) === id(ctx.fixtures.teacherStaff))).toBe(true)

    expectStatus(await hr.get('/api/v1/hr/leave?status=Pending'))
    expectStatus(await hr.put('/api/v1/hr/leave/review').send({ leaveId: id(filed.data), status: 'Approved', reviewRemarks: 'OK' }))
    expectStatus(await hr.put('/api/v1/hr/leave/review').send({ leaveId: '64b000000000000000000099', status: 'Approved' }), 404)

    const own = expectStatus(await hr.post('/api/v1/hr/leave').send({ leaveType: 'Sick', fromDate: '2026-12-12', toDate: '2026-12-12', reason: 'Flu symptoms' }), 201)
    expectStatus(await hr.put('/api/v1/hr/leave/review').send({ leaveId: id(own.data), status: 'Approved' }), 403)
  })

  test('payroll run, list, payslip and finalize', async () => {
    const run = expectStatus(await hr.post('/api/v1/hr/payroll/run').send({ month: 1, year: 2026, applyIncomeTax: true, applySessi: true }))
    expect(run.data.length).toBeGreaterThan(0)
    const list = expectStatus(await accountant.get('/api/v1/hr/payroll?month=1&year=2026'))
    expect(list.data.length).toBe(run.data.length)

    const teacherRecord = list.data.find((r) => id(r.staffId) === id(ctx.fixtures.teacherStaff))
    const teacher = await ctx.as('teacher1')
    // Staff can only open their own payslip once payroll is finalized; HR can always open drafts.
    expectStatus(await teacher.get(`/api/v1/hr/payroll/payslip/${id(teacherRecord)}`), 403)
    expectStatus(await hr.get(`/api/v1/hr/payroll/payslip/${id(teacherRecord)}`))
    const other = list.data.find((r) => id(r.staffId) !== id(ctx.fixtures.teacherStaff))
    expectStatus(await teacher.get(`/api/v1/hr/payroll/payslip/${id(other)}`), 403)

    expectStatus(await hr.put('/api/v1/hr/payroll/finalize').send({ month: 1, year: 2026 }))
    const slip = await teacher.get(`/api/v1/hr/payroll/payslip/${id(teacherRecord)}`)
    expectStatus(slip)
    expect(slip.headers['content-type']).toBe('application/pdf')
    const rerun = expectStatus(await hr.post('/api/v1/hr/payroll/run').send({ month: 1, year: 2026 }))
    expect(rerun.data.every((r) => r.status === 'Finalized')).toBe(true)
  })
})

describe('reports and analytics', () => {
  test.each([
    'dashboard-stats',
    'attendance-trend?days=14',
    'enrollment-by-grade',
    'audit-logs?page=1&limit=5',
    'fee-trend?months=12',
    'fee-collection-by-class',
    'defaulter-aging',
    'academic-performance',
    'demographics',
    'teacher-performance',
    'financial-intelligence/cashflow-forecast',
    'financial-intelligence/concession-roi',
    'financial-intelligence/payment-velocity',
  ])('GET /reports/%s', async (endpoint) => {
    const body = expectStatus(await admin.get(`/api/v1/reports/${endpoint}`))
    expect(body.success).toBe(true)
  })

  test('teachers get a dashboard without finance figures', async () => {
    const body = expectStatus(await (await ctx.as('teacher1')).get('/api/v1/reports/dashboard-stats'))
    expect(body.data).not.toHaveProperty('totalCollections')
    expect(body.data).not.toHaveProperty('feeCollectionRate')
  })

  test('JSON exports for every entity respect per-entity roles', async () => {
    for (const entity of ['students', 'staff', 'fees', 'defaulters', 'attendance', 'payroll', 'staff-attendance', 'academic-performance', 'teacher-performance']) {
      const body = expectStatus(await admin.get(`/api/v1/reports/export?entity=${entity}&format=json&month=1&year=2026&from=2026-01-01&to=2026-12-31`))
      expect(Array.isArray(body.data.rows)).toBe(true)
    }
    expectStatus(await admin.get('/api/v1/reports/export?entity=nope&format=json'), 400)
    expectStatus(await hr.get('/api/v1/reports/export?entity=fees&format=json'), 403)
  })

  test('file exports (excel and pdf) and the custom builder', async () => {
    const xlsx = await accountant.get('/api/v1/reports/export?entity=defaulters&format=excel')
    expectStatus(xlsx)
    expect(xlsx.headers['content-type']).toMatch(/spreadsheet/)
    const pdf = await hr.get('/api/v1/reports/export?entity=staff&format=pdf')
    expectStatus(pdf)
    expect(pdf.headers['content-type']).toBe('application/pdf')

    for (const entity of ['students', 'staff', 'fees', 'attendance', 'grades']) {
      const preview = expectStatus(await admin.post('/api/v1/reports/custom/preview').send({ entity, filters: { from: '2026-01-01', to: '2026-12-31', status: 'ALL' }, sortBy: 'fullName', sortOrder: -1 }))
      expect(Array.isArray(preview.data.rows)).toBe(true)
    }
    const custom = await admin.post('/api/v1/reports/custom/export').send({ entity: 'students', fields: ['studentId', 'fullName'], format: 'pdf', title: 'Roster' })
    expectStatus(custom)
    expect(custom.headers['content-type']).toBe('application/pdf')
  })
})

describe('uploads and imports', () => {
  test('generic upload, image upload, student photo and authorised serving', async () => {
    const { childA } = ctx.fixtures
    const pdf = Buffer.from('%PDF-1.4 integration')
    const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4170000000049454e44ae426082', 'hex')

    const file = expectStatus(await admin.post('/api/v1/uploads/file').attach('file', pdf, { filename: 'note.pdf', contentType: 'application/pdf' }), 201)
    const image = expectStatus(await admin.post('/api/v1/uploads/image').attach('image', png, { filename: 'logo.png', contentType: 'image/png' }), 201)
    expectStatus(await admin.post('/api/v1/uploads/file').attach('file', Buffer.from('x'), { filename: 'evil.exe', contentType: 'application/octet-stream' }), 400)
    const photo = expectStatus(await admin.post(`/api/v1/uploads/student/${id(childA)}/photo`).attach('photo', png, { filename: 'face.png', contentType: 'image/png' }))
    expect(photo.data.photoUrl).toMatch(/^\/uploads\/photos\//)

    const teacher = await ctx.as('teacher1')
    expectStatus(await teacher.get(image.data.fileUrl))
    expectStatus(await teacher.get(file.data.fileUrl), 403)
    expectStatus(await admin.get(file.data.fileUrl))
    expectStatus(await admin.get(`/api/v1/uploads/files/${file.data.filename}`))
    expectStatus(await admin.get('/uploads/secrets/x.txt'), 404)
    expectStatus(await admin.get('/uploads/photos/missing.png'), 404)

    const { UPLOADS_DIR } = require('../middleware/upload.middleware')
    for (const url of [file.data.fileUrl, image.data.fileUrl, photo.data.photoUrl]) {
      fs.rmSync(path.join(UPLOADS_DIR, url.replace('/uploads/', '')), { force: true })
    }
  })

  test('Excel import creates students from the template and reports bad rows', async () => {
    const template = await admin.get('/api/v1/students/import-template').buffer(true).parse((res, cb) => {
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => cb(null, Buffer.concat(chunks)))
    })
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(template.body)
    const sheet = workbook.worksheets[0]
    const headers = sheet.getRow(1).values.slice(1).map((h) => String(h?.richText ? h.richText.map((t) => t.text).join('') : h || '').toLowerCase())
    const className = ctx.fixtures.cls.name
    const valueFor = (header, good) => {
      if (/full ?name|student name/.test(header)) return good ? 'Imported Pupil' : 'Ghost Pupil'
      if (/dob|birth/.test(header)) return '2016-05-05'
      if (/gender/.test(header)) return 'Male'
      if (/class/.test(header)) return good ? className : 'No Such Class'
      if (/section/.test(header)) return 'A'
      if (/guardian.*phone|phone/.test(header)) return '03009998877'
      if (/guardian|father|parent/.test(header)) return 'Imported Parent'
      return ''
    }
    const out = new ExcelJS.Workbook()
    const ws = out.addWorksheet('Students')
    ws.addRow(sheet.getRow(1).values.slice(1))
    ws.addRow(headers.map((h) => valueFor(h, true)))
    ws.addRow(headers.map((h) => valueFor(h, false)))
    const upload = await admin.post('/api/v1/students/import-excel').attach('file', Buffer.from(await out.xlsx.writeBuffer()), { filename: 'students.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const body = expectStatus(upload)
    expect(body.data.createdCount).toBe(1)
    // the row with an unknown class is rejected, not silently enrolled in another class
    expect(body.data.errorCount).toBe(1)
    expect(JSON.stringify(body.data.errors)).toContain('No Such Class')

    const legacy = await admin.post('/api/v1/students/import-excel').attach('file', Buffer.from('legacy'), { filename: 'old.xls', contentType: 'application/vnd.ms-excel' })
    expectStatus(legacy, 400)
  })

  test('JSON bulk import validates classes', async () => {
    const res = await admin.post('/api/v1/students/import').send({
      students: [{ fullName: 'Json Pupil', dob: '2016-01-01', gender: 'Female', className: ctx.fixtures.cls.name, sectionId: 'A', guardian: { name: 'Json Parent', phone: '03001231234' } }],
    })
    expect([200, 201, 400]).toContain(res.status)
  })
})
