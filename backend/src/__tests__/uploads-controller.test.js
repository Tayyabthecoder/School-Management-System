// Upload endpoints: the URL they hand back, cleanup of files from failed requests, and the authenticated
// download of a student document (path-traversal and ownership checks).
const path = require('path')
const os = require('os')
const fs = require('fs')

// jest.mock factories are hoisted above everything else, so the temp folder is created inside the factory
jest.mock('../middleware/upload.middleware', () => {
  const nodePath = require('path')
  const nodeOs = require('os')
  const nodeFs = require('fs')
  global.__SMS_TEST_UPLOADS__ = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), 'sms-uploads-'))
  return { UPLOADS_DIR: global.__SMS_TEST_UPLOADS__ }
})
jest.mock('../models/Student.model', () => ({ findOne: jest.fn(), findOneAndUpdate: jest.fn() }))
jest.mock('../utils/guardian-auth.util', () => ({ assertStudentAccess: jest.fn() }))

const Student = require('../models/Student.model')
const { assertStudentAccess } = require('../utils/guardian-auth.util')
const controller = require('../modules/uploads/uploads.controller')

const ROOT = global.__SMS_TEST_UPLOADS__

const makeRes = () => {
  const res = { headersSent: false }
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.setHeader = jest.fn()
  res.download = jest.fn()
  return res
}
const call = async (handler, req) => {
  const res = makeRes()
  const next = jest.fn()
  await handler(req, res, next)
  return { res, next }
}
const fileAt = (sub, name, extra = {}) => ({ path: path.join(ROOT, sub, name), filename: name, originalname: `orig-${name}`, size: 12, mimetype: 'image/png', ...extra })

afterAll(() => fs.rmSync(ROOT, { recursive: true, force: true }))
beforeEach(() => { jest.clearAllMocks() })

describe('buildFileUrl / resolveStoredFile', () => {
  test('the URL is relative to the uploads folder with forward slashes', () => {
    expect(controller.buildFileUrl(path.join(ROOT, 'photos', 'a.png'))).toBe('/uploads/photos/a.png')
  })

  test('maps a stored URL back to a path inside the uploads folder', () => {
    expect(controller.resolveStoredFile('/uploads/photos/a%20b.png')).toBe(path.join(ROOT, 'photos', 'a b.png'))
  })

  test.each([
    ['/uploads/../secrets.txt'],
    ['/uploads/photos/../../../etc/passwd'],
    ['/uploads/%2e%2e/%2e%2e/etc/passwd'],
    ['/elsewhere/photos/a.png'],
    ['uploads/photos/a.png'],
    [undefined],
    [42],
  ])('refuses %j', (url) => {
    expect(controller.resolveStoredFile(url)).toBeNull()
  })
})

describe('uploadSingleFile', () => {
  test('answers 201 with the stored file\'s details', async () => {
    const { res, next } = await call(controller.uploadSingleFile, { file: fileAt('general', 'f.png') })
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'File uploaded successfully',
      data: { fileUrl: '/uploads/general/f.png', filename: 'f.png', originalName: 'orig-f.png', size: 12, mimetype: 'image/png' },
    })
  })

  test('no file is a 400', async () => {
    const { next } = await call(controller.uploadSingleFile, {})
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400, message: 'No file was uploaded' }))
  })
})

describe('uploadStudentDocument', () => {
  const doc = (extra) => ({ params: { studentId: 's1' }, body: {}, file: fileAt('documents', 'd.pdf'), ...extra })

  test('attaches the document under the given name and returns the list', async () => {
    const student = { documents: [], save: jest.fn() }
    Student.findOne.mockResolvedValue(student)

    const { res } = await call(controller.uploadStudentDocument, doc({ body: { name: 'Birth certificate' } }))

    expect(Student.findOne).toHaveBeenCalledWith({ _id: 's1', deletedAt: null })
    expect(student.documents[0]).toMatchObject({ name: 'Birth certificate', url: '/uploads/documents/d.pdf' })
    expect(student.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
  })

  test('the name falls back to the original file name, then to "Document"', async () => {
    const student = { documents: [], save: jest.fn() }
    Student.findOne.mockResolvedValue(student)
    await call(controller.uploadStudentDocument, doc())
    expect(student.documents[0].name).toBe('orig-d.pdf')

    const second = { documents: [], save: jest.fn() }
    Student.findOne.mockResolvedValue(second)
    await call(controller.uploadStudentDocument, doc({ file: { ...fileAt('documents', 'x.pdf'), originalname: '' } }))
    expect(second.documents[0].name).toBe('Document')
  })

  test('an unknown student is a 404 and the stored file is deleted again', async () => {
    const real = path.join(ROOT, 'documents', 'orphan.pdf')
    fs.mkdirSync(path.dirname(real), { recursive: true })
    fs.writeFileSync(real, 'x')
    Student.findOne.mockResolvedValue(null)

    const { next } = await call(controller.uploadStudentDocument, doc({ file: { ...fileAt('documents', 'orphan.pdf') } }))

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, message: 'Student not found' }))
    await new Promise((r) => setTimeout(r, 50))
    expect(fs.existsSync(real)).toBe(false)
  })

  test('no file is a 400', async () => {
    const { next } = await call(controller.uploadStudentDocument, doc({ file: undefined }))
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400, message: 'No document was uploaded' }))
  })
})

describe('uploadStudentPhoto', () => {
  const photo = (extra) => ({ params: { studentId: 's1' }, file: fileAt('photos', 'p.png'), ...extra })

  test('stores the new photo URL on the student', async () => {
    Student.findOneAndUpdate.mockResolvedValue({ photoUrl: '/uploads/photos/p.png' })

    const { res } = await call(controller.uploadStudentPhoto, photo())

    expect(Student.findOneAndUpdate).toHaveBeenCalledWith({ _id: 's1', deletedAt: null }, { photoUrl: '/uploads/photos/p.png' }, { new: true })
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Student photo updated successfully', data: { photoUrl: '/uploads/photos/p.png' } })
  })

  test('an unknown student is a 404, no image a 400', async () => {
    Student.findOneAndUpdate.mockResolvedValue(null)
    expect((await call(controller.uploadStudentPhoto, photo())).next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
    expect((await call(controller.uploadStudentPhoto, photo({ file: undefined }))).next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400, message: 'No image was uploaded' }))
  })
})

describe('downloadStudentDocument', () => {
  const stored = path.join(ROOT, 'documents', 'cert.pdf')
  beforeAll(() => { fs.mkdirSync(path.dirname(stored), { recursive: true }); fs.writeFileSync(stored, 'pdf') })

  const withDocs = (docs) => Student.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(docs === null ? null : { documents: docs }) })
  const req = (extra = {}) => ({ params: { id: 's1', docId: 'd1' }, user: { roleName: 'super_admin' }, ...extra })

  test('streams the file as a private, no-sniff download named after the document', async () => {
    withDocs([{ _id: 'd1', name: 'Birth Certificate', url: '/uploads/documents/cert.pdf' }])

    const { res } = await call(controller.downloadStudentDocument, req())

    expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff')
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'private, no-store')
    expect(res.download).toHaveBeenCalledWith(stored, 'Birth Certificate.pdf', expect.any(Function))
  })

  test('does not double the extension and strips unsafe characters from the name', async () => {
    withDocs([{ _id: 'd1', name: 'cert.PDF', url: '/uploads/documents/cert.pdf' }])
    expect((await call(controller.downloadStudentDocument, req())).res.download.mock.calls[0][1]).toBe('cert.PDF')

    withDocs([{ _id: 'd1', name: '../../evil<name>', url: '/uploads/documents/cert.pdf' }])
    const name = (await call(controller.downloadStudentDocument, req())).res.download.mock.calls[0][1]
    expect(name).not.toMatch(/[/\\<>]/)
  })

  test('a download error before headers go out is forwarded; after them it is ignored', async () => {
    withDocs([{ _id: 'd1', name: 'c', url: '/uploads/documents/cert.pdf' }])
    const { res, next } = await call(controller.downloadStudentDocument, req())
    const done = res.download.mock.calls[0][2]

    done(new Error('client aborted'))
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'client aborted' }))

    next.mockClear()
    res.headersSent = true
    done(new Error('late'))
    done(null)
    expect(next).not.toHaveBeenCalled()
  })

  test('students and guardians are checked against their own family first; staff are not', async () => {
    withDocs([{ _id: 'd1', name: 'c', url: '/uploads/documents/cert.pdf' }])

    await call(controller.downloadStudentDocument, req({ user: { roleName: 'guardian' } }))
    expect(assertStudentAccess).toHaveBeenCalledWith({ roleName: 'guardian' }, 's1', 'student document')

    assertStudentAccess.mockClear()
    await call(controller.downloadStudentDocument, req({ user: { roleName: 'accountant' } }))
    expect(assertStudentAccess).not.toHaveBeenCalled()
  })

  test('a guardian refused by the access check never reaches the database', async () => {
    assertStudentAccess.mockImplementationOnce(() => { const e = new Error('Forbidden'); e.statusCode = 403; throw e })
    const { next } = await call(controller.downloadStudentDocument, req({ user: { roleName: 'student' } }))
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
    expect(Student.findOne).not.toHaveBeenCalled()
  })

  test.each([
    ['an unknown student', null, 'Student not found'],
    ['an unknown document', [{ _id: 'other', name: 'x', url: '/uploads/documents/cert.pdf' }], 'Document not found'],
    ['a student with no documents field', [], 'Document not found'],
    ['a stored URL that points outside the uploads folder', [{ _id: 'd1', name: 'x', url: '/uploads/../../etc/passwd' }], 'Document file is missing'],
    ['a file that was deleted from disk', [{ _id: 'd1', name: 'x', url: '/uploads/documents/gone.pdf' }], 'Document file is missing'],
  ])('%s is a 404', async (_label, docs, message) => {
    withDocs(docs)
    const { next } = await call(controller.downloadStudentDocument, req())
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, message }))
  })
})
