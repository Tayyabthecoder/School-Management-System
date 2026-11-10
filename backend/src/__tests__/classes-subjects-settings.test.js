const classesController = require('../modules/classes/classes.controller')
const subjectsController = require('../modules/subjects/subjects.controller')
const settingsController = require('../modules/settings/settings.controller')
const usersController = require('../modules/users/users.controller')
const Class = require('../models/Class.model')
const Subject = require('../models/Subject.model')
const SchoolSettings = require('../models/SchoolSettings.model')
const User = require('../models/User.model')
const Role = require('../models/Role.model')
const cacheUtil = require('../utils/cache.util')
const auditUtil = require('../utils/audit-log.util')

jest.mock('../models/Class.model')
jest.mock('../models/Subject.model')
jest.mock('../models/SchoolSettings.model')
jest.mock('../models/User.model')
jest.mock('../models/Role.model')
jest.mock('../utils/cache.util')
jest.mock('../utils/audit-log.util')
jest.mock('../modules/auth/auth.service', () => ({ invalidateUserSessions: jest.fn().mockResolvedValue() }))
jest.mock('bcryptjs', () => ({ hash: jest.fn().mockResolvedValue('hashed') }))

const mockRes = () => {
  const res = { json: jest.fn(), status: jest.fn() }
  res.status.mockReturnValue(res)
  return res
}

beforeEach(() => {
  jest.clearAllMocks()
  cacheUtil.invalidateCache.mockResolvedValue()
  auditUtil.logAudit.mockResolvedValue()
})

describe('addSectionToClass', () => {
  test('returns 404 for an unknown class instead of success with null data', async () => {
    Class.findByIdAndUpdate.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) })
    const res = mockRes()
    const next = jest.fn()

    await classesController.addSectionToClass({ params: { id: 'missing' }, body: { sectionName: 'c' } }, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
    expect(res.json).not.toHaveBeenCalled()
  })
})

describe('updateSubject keeps Class.subjects in sync', () => {
  const subjectDoc = (isActive) => ({
    _id: 'sub-1',
    classId: 'class-1',
    isActive,
    save: jest.fn().mockResolvedValue(),
  })

  test('deactivating removes the subject from its class', async () => {
    Subject.findById.mockResolvedValue(subjectDoc(true))

    await subjectsController.updateSubject({ params: { id: 'sub-1' }, body: { isActive: false } }, mockRes(), jest.fn())

    expect(Class.findByIdAndUpdate).toHaveBeenCalledWith('class-1', { $pull: { subjects: 'sub-1' } })
  })

  test('reactivating adds the subject back to its class', async () => {
    Subject.findById.mockResolvedValue(subjectDoc(false))

    await subjectsController.updateSubject({ params: { id: 'sub-1' }, body: { isActive: true } }, mockRes(), jest.fn())

    expect(Class.findByIdAndUpdate).toHaveBeenCalledWith('class-1', { $addToSet: { subjects: 'sub-1' } })
  })

  test('a rename leaves class membership untouched', async () => {
    Subject.findById.mockResolvedValue(subjectDoc(true))

    await subjectsController.updateSubject({ params: { id: 'sub-1' }, body: { name: 'Maths' } }, mockRes(), jest.fn())

    expect(Class.findByIdAndUpdate).not.toHaveBeenCalled()
  })
})

describe('updateSettings grading scale', () => {
  test('rejects a band whose minPercent exceeds maxPercent', async () => {
    const res = mockRes()
    const body = { gradingScale: [{ label: 'A', minPercent: 90, maxPercent: 80 }] }

    await settingsController.updateSettings({ body, validatedData: { body } }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(SchoolSettings.findOne).not.toHaveBeenCalled()
  })
})

describe('users audit trail', () => {
  test('createUser writes a USER_CREATED audit entry', async () => {
    Role.findOne.mockResolvedValue({ _id: 'role-1' })
    User.create.mockResolvedValue({ _id: 'user-1', username: 'newbie', roleName: 'teacher' })

    await usersController.createUser(
      { body: { username: 'newbie', password: 'Secret123', roleName: 'teacher' }, user: { _id: 'admin' } }, mockRes(), jest.fn()
    )

    expect(auditUtil.logAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_CREATED', documentId: 'user-1' }))
  })

  test('resetPassword writes a USER_PASSWORD_RESET audit entry', async () => {
    User.findByIdAndUpdate.mockResolvedValue({ _id: 'user-1', username: 'newbie' })

    await usersController.resetPassword(
      { params: { id: 'user-1' }, body: { newPassword: 'Secret123' }, user: { _id: 'admin' } }, mockRes(), jest.fn()
    )

    expect(auditUtil.logAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_PASSWORD_RESET' }))
  })
})
