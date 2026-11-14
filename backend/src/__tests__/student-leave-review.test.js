// A teacher approving a student's leave marks every register of those days as Excused.
const StudentLeaveRequest = require('../models/StudentLeaveRequest.model')
const StudentAttendance = require('../models/StudentAttendance.model')
const TimetableEntry = require('../models/TimetableEntry.model')
const teachers = require('../modules/teachers/teachers.controller')

jest.mock('../models/Staff.model')
jest.mock('../models/User.model')
jest.mock('../models/Role.model')
jest.mock('../models/TimetableEntry.model')
jest.mock('../models/Class.model')
jest.mock('../models/Subject.model')
jest.mock('../models/Student.model')
jest.mock('../models/StudentAttendance.model')
jest.mock('../models/StudentLeaveRequest.model')
jest.mock('../models/Counter.model')
jest.mock('../utils/audit-log.util', () => ({ logAudit: jest.fn().mockResolvedValue() }))

const mockRes = () => {
  const res = { json: jest.fn(), status: jest.fn() }
  res.status.mockReturnValue(res)
  return res
}

const leave = (overrides = {}) => ({
  _id: 'leave-1',
  status: 'Pending',
  classId: 'class-1',
  sectionId: 'A',
  startDate: '2026-10-05',
  endDate: '2026-10-06',
  category: 'Medical',
  reason: 'Fever',
  studentId: { _id: 'stu-1' },
  save: jest.fn().mockResolvedValue(),
  ...overrides,
})

const register = (records = []) => ({ records, save: jest.fn().mockResolvedValue() })

const admin = { _id: 'admin', roleName: 'super_admin' }

const review = (doc, body = { status: 'Approved' }, user = admin) => {
  StudentLeaveRequest.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(doc) })
  const res = mockRes()
  const next = jest.fn()
  return teachers.reviewLeaveRequest({ params: { id: 'leave-1' }, body, user }, res, next).then(() => ({ res, next }))
}

beforeEach(() => jest.clearAllMocks())

describe('student leave review', () => {
  test('marks the student Excused in every period register of each leave day', async () => {
    const periodOne = register([{ studentId: 'stu-1', status: 'Absent' }])
    const periodTwo = register([{ studentId: 'stu-1', status: 'Absent' }])
    const other = register([]) // the student has no row yet in this register
    StudentAttendance.find
      .mockResolvedValueOnce([periodOne, periodTwo]) // 5 Oct: two registers
      .mockResolvedValueOnce([other]) // 6 Oct: one register without the student

    const { res, next } = await review(leave())

    expect(next).not.toHaveBeenCalled()
    expect(StudentAttendance.find).toHaveBeenCalledTimes(2)
    expect(periodOne.records[0]).toMatchObject({ status: 'Excused' })
    expect(periodTwo.records[0]).toMatchObject({ status: 'Excused' })
    expect(periodOne.save).toHaveBeenCalled()
    expect(periodTwo.save).toHaveBeenCalled()
    expect(other.records).toEqual([expect.objectContaining({ studentId: 'stu-1', status: 'Excused' })])
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
  })

  test('rejecting a request does not touch attendance', async () => {
    const { next } = await review(leave(), { status: 'Rejected', remarks: 'No certificate' })

    expect(next).not.toHaveBeenCalled()
    expect(StudentAttendance.find).not.toHaveBeenCalled()
  })

  test('a request that was already decided cannot be reviewed again', async () => {
    const { next } = await review(leave({ status: 'Approved' }))

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409 }))
    expect(StudentAttendance.find).not.toHaveBeenCalled()
  })

  test('a teacher who does not teach the class cannot review its leave', async () => {
    TimetableEntry.findOne.mockResolvedValue(null)

    const { next } = await review(leave(), { status: 'Approved' }, { _id: 't1', roleName: 'teacher', staffId: 'staff-9' })

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
  })

  test('an absurd multi-year range is bounded instead of looping for ages', async () => {
    StudentAttendance.find.mockResolvedValue([])

    await review(leave({ startDate: '2020-01-01', endDate: '2030-12-31' }))

    expect(StudentAttendance.find.mock.calls.length).toBeLessThanOrEqual(366)
  })
})
