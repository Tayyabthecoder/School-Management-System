// Controller-level tests for the users, subjects and guardian modules.
const bcrypt = require('bcryptjs')
const User = require('../models/User.model')
const Role = require('../models/Role.model')
const Subject = require('../models/Subject.model')
const Class = require('../models/Class.model')
const Student = require('../models/Student.model')
const cache = require('../utils/cache.util')
const authService = require('../modules/auth/auth.service')
const users = require('../modules/users/users.controller')
const subjects = require('../modules/subjects/subjects.controller')
const guardian = require('../modules/guardian/guardian.controller')

jest.mock('bcryptjs', () => ({ hash: jest.fn().mockResolvedValue('hashed-pw') }))
jest.mock('../models/User.model')
jest.mock('../models/Role.model')
jest.mock('../models/Subject.model')
jest.mock('../models/Class.model')
jest.mock('../models/Student.model')
jest.mock('../models/StudentAttendance.model')
jest.mock('../models/Grade.model')
jest.mock('../models/Exam.model')
jest.mock('../models/StudentFee.model')
jest.mock('../models/StudentLeaveRequest.model')
jest.mock('../models/TimetableEntry.model')
jest.mock('../utils/audit-log.util', () => ({ logAudit: jest.fn().mockResolvedValue() }))
jest.mock('../utils/cache.util')
jest.mock('../modules/auth/auth.service', () => ({ invalidateUserSessions: jest.fn().mockResolvedValue() }))

const mockRes = () => {
  const res = { json: jest.fn(), status: jest.fn() }
  res.status.mockReturnValue(res)
  return res
}

beforeEach(() => {
  jest.clearAllMocks()
  cache.invalidateCache.mockResolvedValue()
})

describe('users controller', () => {
  test('createUser rejects an unknown role', async () => {
    Role.findOne.mockResolvedValue(null)
    const next = jest.fn()

    await users.createUser({ body: { username: 'x', password: 'Passw0rd!', roleName: 'wizard' } }, mockRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400, message: 'Invalid role name' }))
    expect(User.create).not.toHaveBeenCalled()
  })

  test('createUser stores a hash and never returns it', async () => {
    Role.findOne.mockResolvedValue({ _id: 'role-1' })
    User.create.mockResolvedValue({ _id: 'u1', username: 'jdoe', roleName: 'teacher', passwordHash: 'hashed-pw' })
    const res = mockRes()

    await users.createUser({ body: { username: 'jdoe', password: 'Passw0rd!', roleName: 'teacher' } }, res, jest.fn())

    expect(bcrypt.hash).toHaveBeenCalledWith('Passw0rd!', expect.any(Number))
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ passwordHash: 'hashed-pw', role: 'role-1' }))
    expect(res.status).toHaveBeenCalledWith(201)
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain('hashed-pw')
  })

  test('getUsers escapes the search term and never selects password hashes', async () => {
    const query = { populate: jest.fn(), select: jest.fn(), skip: jest.fn(), limit: jest.fn(), sort: jest.fn() }
    for (const k of ['populate', 'select', 'skip', 'limit']) query[k].mockReturnValue(query)
    query.sort.mockResolvedValue([])
    User.find.mockReturnValue(query)
    User.countDocuments.mockResolvedValue(0)

    await users.getUsers({ query: { search: 'a.b(c', role: 'teacher' } }, mockRes(), jest.fn())

    const filter = User.find.mock.calls[0][0]
    expect(filter).toMatchObject({ deletedAt: null, roleName: 'teacher' })
    expect(filter.username.$regex).toBe('a\\.b\\(c')
    expect(query.select).toHaveBeenCalledWith('-passwordHash')
  })

  test('resetPassword forces a change, revokes sessions and reports 404 for unknown users', async () => {
    User.findByIdAndUpdate.mockResolvedValueOnce({ _id: 'u1', username: 'jdoe' })
    const res = mockRes()
    await users.resetPassword({ params: { id: 'u1' }, body: { newPassword: 'N3wPassw0rd!' } }, res, jest.fn())

    expect(User.findByIdAndUpdate.mock.calls[0][1]).toMatchObject({
      passwordHash: 'hashed-pw', failedLoginAttempts: 0, lockUntil: null, mustChangePassword: true, $inc: { tokenVersion: 1 },
    })
    expect(authService.invalidateUserSessions).toHaveBeenCalledWith('u1')

    User.findByIdAndUpdate.mockResolvedValueOnce(null)
    const next = jest.fn()
    await users.resetPassword({ params: { id: 'nope' }, body: { newPassword: 'N3wPassw0rd!' } }, mockRes(), next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })
})

describe('subjects controller', () => {
  test('createSubject requires name, code and class', async () => {
    const next = jest.fn()
    await subjects.createSubject({ body: { name: 'Maths' }, user: {} }, mockRes(), next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
    expect(Subject.create).not.toHaveBeenCalled()
  })

  test('createSubject upper-cases the code, links it to the class and clears caches', async () => {
    Subject.create.mockResolvedValue({ _id: 'sub1', name: 'Maths', code: 'MTH' })
    const res = mockRes()

    await subjects.createSubject({ body: { name: 'Maths', code: ' mth ', classId: 'c1' }, user: {} }, res, jest.fn())

    expect(Subject.create).toHaveBeenCalledWith(expect.objectContaining({ code: 'MTH', classId: 'c1', isActive: true }))
    expect(Class.findByIdAndUpdate).toHaveBeenCalledWith('c1', { $addToSet: { subjects: 'sub1' } })
    expect(cache.invalidateCache).toHaveBeenCalledWith('ref:subjects:class:c1')
    expect(res.status).toHaveBeenCalledWith(201)
  })

  test('getSubjectById gives 404 for an inactive or missing subject', async () => {
    const q = { populate: jest.fn().mockResolvedValue(null) }
    Subject.findOne.mockReturnValue(q)
    const next = jest.fn()

    await subjects.getSubjectById({ params: { id: 'x' } }, mockRes(), next)

    expect(Subject.findOne).toHaveBeenCalledWith({ _id: 'x', isActive: true })
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })

  test('updateSubject keeps Class.subjects in step with the active flag', async () => {
    const subject = { _id: 'sub1', classId: 'c1', isActive: true, save: jest.fn().mockResolvedValue() }
    Subject.findById.mockResolvedValue(subject)

    await subjects.updateSubject({ params: { id: 'sub1' }, body: { isActive: false }, user: {} }, mockRes(), jest.fn())

    expect(subject.isActive).toBe(false)
    expect(Class.findByIdAndUpdate).toHaveBeenCalledWith('c1', { $pull: { subjects: 'sub1' } })
  })
})

describe('guardian controller', () => {
  const guardianUser = { roleName: 'guardian', studentId: 's1', studentIds: ['s1', 's2'] }

  test('getMyChildren returns nothing for an account with no linked children', async () => {
    const res = mockRes()
    await guardian.getMyChildren({ user: { roleName: 'guardian' } }, res, jest.fn())
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [] })
    expect(Student.find).not.toHaveBeenCalled()
  })

  test('getMyChildren loads exactly the linked, non-deleted students', async () => {
    Student.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([{ _id: 's1' }, { _id: 's2' }]) })

    await guardian.getMyChildren({ user: guardianUser }, mockRes(), jest.fn())

    expect(Student.find).toHaveBeenCalledWith({ _id: { $in: ['s1', 's2'] }, deletedAt: null })
  })

  test('getMyChild refuses a child that is not linked to the guardian', async () => {
    const next = jest.fn()

    await guardian.getMyChild({ user: guardianUser, query: { studentId: 'someone-elses' } }, mockRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
    expect(Student.findOne).not.toHaveBeenCalled()
  })

  test('getMyChild returns 400 when nothing is linked and 404 when the record is gone', async () => {
    const next = jest.fn()
    await guardian.getMyChild({ user: { roleName: 'guardian' }, query: {} }, mockRes(), next)
    expect(next).toHaveBeenLastCalledWith(expect.objectContaining({ statusCode: 400 }))

    Student.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) })
    await guardian.getMyChild({ user: guardianUser, query: {} }, mockRes(), next)
    expect(next).toHaveBeenLastCalledWith(expect.objectContaining({ statusCode: 404 }))
  })
})
