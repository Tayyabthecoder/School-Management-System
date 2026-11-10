const hrController = require('../modules/hr/hr.controller')
const teachersController = require('../modules/teachers/teachers.controller')
const LeaveRequest = require('../models/LeaveRequest.model')
const TimetableEntry = require('../models/TimetableEntry.model')
const StudentLeaveRequest = require('../models/StudentLeaveRequest.model')
const Staff = require('../models/Staff.model')
const Counter = require('../models/Counter.model')
const Role = require('../models/Role.model')
const User = require('../models/User.model')
const auditUtil = require('../utils/audit-log.util')

jest.mock('../models/LeaveRequest.model')
jest.mock('../models/TimetableEntry.model')
jest.mock('../models/StudentLeaveRequest.model')
jest.mock('../models/Staff.model')
jest.mock('../models/Counter.model')
jest.mock('../models/Role.model')
jest.mock('../models/User.model')
jest.mock('../utils/audit-log.util')
jest.mock('bcryptjs', () => ({ hash: jest.fn().mockResolvedValue('hashed') }))

const mockRes = () => {
  const res = { json: jest.fn(), status: jest.fn() }
  res.status.mockReturnValue(res)
  return res
}

beforeEach(() => {
  jest.clearAllMocks()
  auditUtil.logAudit.mockResolvedValue()
})

describe('resolveStaffRoleName', () => {
  test.each([
    ['Christian Studies', 'Teacher', 'teacher'],
    ['Chemistry', 'Lab Assistant', 'teacher'],
    ['HR', 'Officer', 'hr_manager'],
    ['Administration', 'Human Resources Manager', 'hr_manager'],
    ['Finance', 'Clerk', 'accountant'],
    ['Administration', 'Senior Accountant', 'accountant'],
  ])('department "%s" / designation "%s" -> %s', (department, designation, expected) => {
    expect(hrController.resolveStaffRoleName(department, designation)).toBe(expected)
  })
})

describe('HR reviewLeaveRequest', () => {
  test('returns 404 (and writes no audit) for an unknown leave id', async () => {
    LeaveRequest.findById.mockResolvedValue(null)
    const next = jest.fn()

    await hrController.reviewLeaveRequest(
      { body: { leaveId: 'nope', status: 'Approved' }, user: { _id: 'u1', roleName: 'hr_manager' } }, mockRes(), next
    )

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
    expect(auditUtil.logAudit).not.toHaveBeenCalled()
  })

  test('an HR manager cannot approve their own leave', async () => {
    LeaveRequest.findById.mockResolvedValue({ _id: 'l1', staffId: 'staff-9' })
    const next = jest.fn()

    await hrController.reviewLeaveRequest(
      { body: { leaveId: 'l1', status: 'Approved' }, user: { _id: 'u1', roleName: 'hr_manager', staffId: 'staff-9' } },
      mockRes(), next
    )

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
    expect(LeaveRequest.findByIdAndUpdate).not.toHaveBeenCalled()
  })

  test('an HR manager can approve someone else\'s leave', async () => {
    LeaveRequest.findById.mockResolvedValue({ _id: 'l1', staffId: 'staff-2' })
    LeaveRequest.findByIdAndUpdate.mockResolvedValue({ _id: 'l1', status: 'Approved' })
    const res = mockRes()
    const next = jest.fn()

    await hrController.reviewLeaveRequest(
      { body: { leaveId: 'l1', status: 'Approved' }, user: { _id: 'u1', roleName: 'hr_manager', staffId: 'staff-9' } },
      res, next
    )

    expect(next).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { _id: 'l1', status: 'Approved' } })
  })
})

describe('HR submitLeaveRequest', () => {
  test('rejects a leave whose end date is before its start date', async () => {
    const next = jest.fn()
    const body = { leaveType: 'Sick', fromDate: '2026-05-10', toDate: '2026-05-01', reason: 'Fever' }

    await hrController.submitLeaveRequest(
      { body, validatedData: { body }, user: { roleName: 'teacher', staffId: 'staff-1' } }, mockRes(), next
    )

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
    expect(LeaveRequest.create).not.toHaveBeenCalled()
  })
})

describe('teachers assignTeacherPeriod', () => {
  test('refuses to double-book a teacher in the same day and period', async () => {
    TimetableEntry.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ classId: { name: 'Grade 4' }, sectionId: 'B' }),
    })
    const next = jest.fn()
    const body = { classId: 'c1', sectionId: 'A', subjectId: 's1', teacherId: 't1', dayOfWeek: 'Monday', periodNumber: 2 }

    await teachersController.assignTeacherPeriod({ body, user: { roleName: 'super_admin' } }, mockRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409 }))
    expect(TimetableEntry.findOneAndUpdate).not.toHaveBeenCalled()
  })
})

describe('teachers getTeacherLeaveRequests', () => {
  test('a teacher with no linked staff profile sees no requests (not all of them)', async () => {
    const res = mockRes()

    await teachersController.getTeacherLeaveRequests({ query: {}, user: { roleName: 'teacher' } }, res, jest.fn())

    expect(StudentLeaveRequest.find).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 0, data: [] })
  })
})

describe('teachers createTeacher id allocation', () => {
  test('uses the current year and an atomic counter for the staff id', async () => {
    Counter.findById.mockResolvedValue({ _id: 'teacher-x', seq: 4 })
    Counter.getNextSequence.mockResolvedValue(5)
    Staff.exists.mockResolvedValue(null)
    Staff.create.mockImplementation(async (doc) => doc)
    Role.findOne.mockResolvedValue(null)
    const res = mockRes()

    await teachersController.createTeacher({ body: { fullName: 'Ali', phone: '0300000000' } }, res, jest.fn())

    const year = new Date().getFullYear()
    expect(Staff.create).toHaveBeenCalledWith(expect.objectContaining({ staffId: `TCH-${year}-005` }))
    expect(Staff.countDocuments).not.toHaveBeenCalled()
    expect(User.create).not.toHaveBeenCalled()
  })
})
