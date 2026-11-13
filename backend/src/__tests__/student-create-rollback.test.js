// A failure while setting up a new student's login or fees must not leave a half-created student.
const Student = require('../models/Student.model')
const Class = require('../models/Class.model')
const User = require('../models/User.model')
const Role = require('../models/Role.model')
const Counter = require('../models/Counter.model')
const StudentFee = require('../models/StudentFee.model')
const FeeStructure = require('../models/FeeStructure.model')
const Payment = require('../models/Payment.model')
const { createStudent } = require('../modules/students/students.controller')

jest.mock('../models/Student.model')
jest.mock('../models/Class.model')
jest.mock('../models/User.model')
jest.mock('../models/Role.model')
jest.mock('../models/Counter.model')
jest.mock('../models/StudentFee.model')
jest.mock('../models/FeeStructure.model')
jest.mock('../models/Payment.model')
jest.mock('../models/TimetableEntry.model')
jest.mock('../models/StudentAttendance.model')
jest.mock('../models/Grade.model')
jest.mock('../models/Exam.model')
jest.mock('../utils/audit-log.util', () => ({ logAudit: jest.fn().mockResolvedValue() }))
jest.mock('../utils/cache.util', () => ({ invalidateCache: jest.fn().mockResolvedValue() }))
jest.mock('../utils/password.util', () => ({
  createInitialCredentials: jest.fn().mockResolvedValue({ password: 'Temp#1234', passwordHash: 'hash' }),
}))

const mockRes = () => {
  const res = { json: jest.fn(), status: jest.fn() }
  res.status.mockReturnValue(res)
  return res
}

const body = () => ({
  fullName: 'Ayesha Khan',
  dob: '2015-04-01',
  gender: 'Female',
  classId: 'class-1',
  sectionId: 'A',
  guardian: { name: 'Khan', phone: '+923001112233' },
  feeSetup: { selectedFeeStructureIds: ['fee-1'] },
})

beforeEach(() => {
  jest.clearAllMocks()
  Class.findById.mockResolvedValue({ _id: 'class-1', name: 'Grade 1', sections: ['A', 'B'] })
  Student.exists.mockResolvedValue(null)
  Counter.findById.mockResolvedValue({ _id: 'student-counter', seq: 0 })
  Counter.getNextSequence.mockResolvedValue(1)
  Student.create.mockResolvedValue({ _id: 'stu-1', studentId: 'STU-2026-0001', fullName: 'Ayesha Khan', classId: 'class-1' })
  Role.findOne.mockResolvedValue({ _id: 'role-student' })
  User.findOne.mockResolvedValue(null)
  User.create.mockResolvedValue({ _id: 'user-1' })
  FeeStructure.find.mockResolvedValue([{ _id: 'fee-1', amount: 5000, title: 'Tuition', dueDate: new Date() }])
  User.deleteMany.mockResolvedValue({})
  StudentFee.deleteMany.mockResolvedValue({})
  Payment.deleteMany.mockResolvedValue({})
  Student.deleteOne.mockResolvedValue({})
})

test('rejects an unknown class before creating anything', async () => {
  Class.findById.mockResolvedValue(null)
  const next = jest.fn()

  await createStudent({ body: body(), user: { _id: 'admin' } }, mockRes(), next)

  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  expect(Student.create).not.toHaveBeenCalled()
})

test('rejects a section that does not exist in the class', async () => {
  const next = jest.fn()

  await createStudent({ body: { ...body(), sectionId: 'Z' }, user: { _id: 'admin' } }, mockRes(), next)

  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400, message: expect.stringContaining('Section "Z"') }))
  expect(Student.create).not.toHaveBeenCalled()
})

test('rolls back the student, login and fees when fee assignment fails', async () => {
  StudentFee.create.mockRejectedValue(new Error('fee write failed'))
  const res = mockRes()
  const next = jest.fn()

  await createStudent({ body: body(), user: { _id: 'admin' } }, res, next)

  expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'fee write failed' }))
  expect(res.status).not.toHaveBeenCalled()
  expect(Payment.deleteMany).toHaveBeenCalledWith({ studentId: 'stu-1' })
  expect(StudentFee.deleteMany).toHaveBeenCalledWith({ studentId: 'stu-1' })
  expect(User.deleteMany).toHaveBeenCalledWith({ studentId: 'stu-1' })
  expect(Student.deleteOne).toHaveBeenCalledWith({ _id: 'stu-1' })
})

test('keeps everything and returns 201 when setup succeeds', async () => {
  StudentFee.create.mockResolvedValue({ _id: 'sf-1' })
  const res = mockRes()
  const next = jest.fn()

  await createStudent({ body: body(), user: { _id: 'admin' } }, res, next)

  expect(next).not.toHaveBeenCalled()
  expect(res.status).toHaveBeenCalledWith(201)
  expect(Student.deleteOne).not.toHaveBeenCalled()
})
