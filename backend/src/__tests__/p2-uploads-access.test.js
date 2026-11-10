// SEC-05: uploads are opened through ownership-checked routes; LOW-03: .xls import gives a 400.
const fs = require('fs')
const os = require('os')
const path = require('path')
const Student = require('../models/Student.model')
const { UPLOADS_DIR } = require('../middleware/upload.middleware')
const { downloadStudentDocument, resolveStoredFile } = require('../modules/uploads/uploads.controller')
const { authorizeUploadAccess } = require('../modules/uploads/serve.routes')
const { parseStudentExcel } = require('../utils/excel.util')

jest.mock('../models/Student.model')

const asUser = (roleName, extra = {}) => ({ user: { roleName, ...extra } })

beforeEach(() => jest.clearAllMocks())

describe('resolveStoredFile', () => {
  test('maps a stored URL inside the uploads directory', () => {
    expect(resolveStoredFile('/uploads/documents/a.pdf')).toBe(path.resolve(UPLOADS_DIR, 'documents', 'a.pdf'))
  })

  test.each(['/uploads/../../etc/passwd', '/uploads/%2e%2e/secret', 'https://evil.test/x', null])(
    'rejects %s', (url) => expect(resolveStoredFile(url)).toBeNull()
  )
})

describe('authorizeUploadAccess (generic /uploads)', () => {
  test('super_admin and hr_manager may open any file', async () => {
    await expect(authorizeUploadAccess(asUser('super_admin'), 'documents', 'x.pdf')).resolves.toBeUndefined()
    await expect(authorizeUploadAccess(asUser('hr_manager'), 'documents', 'x.pdf')).resolves.toBeUndefined()
  })

  test('students and guardians are sent to the ownership-checked route', async () => {
    await expect(authorizeUploadAccess(asUser('student'), 'photos', 'x.png')).rejects.toMatchObject({ statusCode: 403 })
    await expect(authorizeUploadAccess(asUser('guardian'), 'general', 'x.txt')).rejects.toMatchObject({ statusCode: 403 })
  })

  test('other staff cannot open the documents folder', async () => {
    await expect(authorizeUploadAccess(asUser('teacher'), 'documents', 'x.pdf')).rejects.toMatchObject({ statusCode: 403 })
  })

  test('other staff cannot open a photo that is attached to a student record', async () => {
    Student.exists.mockResolvedValue({ _id: 's1' })
    await expect(authorizeUploadAccess(asUser('accountant'), 'photos', 'bform.jpg')).rejects.toMatchObject({ statusCode: 403 })
    expect(Student.exists).toHaveBeenCalledWith({ 'documents.url': { $in: ['/uploads/photos/bform.jpg'] } })
  })

  test('other staff may open an unattached photo', async () => {
    Student.exists.mockResolvedValue(null)
    await expect(authorizeUploadAccess(asUser('teacher'), 'photos', 'logo.png')).resolves.toBeUndefined()
  })
})

describe('downloadStudentDocument', () => {
  const docId = 'doc-1'
  let tmpFile

  beforeAll(() => {
    fs.mkdirSync(path.join(UPLOADS_DIR, 'documents'), { recursive: true })
    tmpFile = path.join(UPLOADS_DIR, 'documents', `sec05-${process.pid}.pdf`)
    fs.writeFileSync(tmpFile, '%PDF-1.4 test')
  })
  afterAll(() => fs.rmSync(tmpFile, { force: true }))

  const mockStudent = (documents) =>
    Student.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: 'stu-1', documents }) })

  test('streams the file as an attachment for an authorised staff user', async () => {
    mockStudent([{ _id: docId, name: 'B-Form', url: `/uploads/documents/${path.basename(tmpFile)}` }])
    const res = { setHeader: jest.fn(), download: jest.fn(), headersSent: false }
    const next = jest.fn()

    await downloadStudentDocument({ ...asUser('teacher'), params: { id: 'stu-1', docId } }, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.download).toHaveBeenCalledWith(tmpFile, 'B-Form.pdf', expect.any(Function))
    expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff')
  })

  test("a guardian cannot open another family's document", async () => {
    const res = { setHeader: jest.fn(), download: jest.fn() }
    const next = jest.fn()

    await downloadStudentDocument(
      { user: { roleName: 'guardian', guardianStudentIds: ['own-child'], studentId: 'own-child' }, params: { id: 'other-child', docId } },
      res,
      next
    )

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
    expect(res.download).not.toHaveBeenCalled()
  })

  test('returns 404 for an unknown document id', async () => {
    mockStudent([])
    const next = jest.fn()
    await downloadStudentDocument({ ...asUser('super_admin'), params: { id: 'stu-1', docId: 'nope' } }, { setHeader: jest.fn() }, next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })
})

describe('LOW-03: legacy .xls import', () => {
  test('parseStudentExcel rejects .xls with a 400 and a clear message', async () => {
    const xls = path.join(os.tmpdir(), `legacy-${process.pid}.xls`)
    fs.writeFileSync(xls, 'not really excel')
    try {
      await expect(parseStudentExcel(xls)).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining('.xlsx') })
    } finally {
      fs.rmSync(xls, { force: true })
    }
  })
})
