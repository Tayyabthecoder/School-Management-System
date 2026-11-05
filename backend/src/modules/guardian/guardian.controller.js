const Student = require('../../models/Student.model')
const StudentAttendance = require('../../models/StudentAttendance.model')
const Grade = require('../../models/Grade.model')
const StudentFee = require('../../models/StudentFee.model')
const StudentLeaveRequest = require('../../models/StudentLeaveRequest.model')
const { ApiError } = require('../../middleware/error.middleware')
const { logAudit } = require('../../utils/audit-log.util')

const resolveGuardianStudentId = (req) => {
  if (req.query.studentId) {
    const requestedId = req.query.studentId.toString()
    if (req.user.roleName === 'super_admin') return requestedId
    if (req.user.studentId && req.user.studentId.toString() === requestedId) return requestedId
    if (Array.isArray(req.user.studentIds) && req.user.studentIds.some(id => id.toString() === requestedId)) {
      return requestedId
    }
  }
  return req.user.studentId || (Array.isArray(req.user.studentIds) && req.user.studentIds[0]) || null
}

const getMyChildren = async (req, res, next) => {
  try {
    const studentIds = []
    if (req.user.studentId) studentIds.push(req.user.studentId)
    if (Array.isArray(req.user.studentIds)) {
      req.user.studentIds.forEach(id => {
        if (!studentIds.some(existing => existing.toString() === id.toString())) {
          studentIds.push(id)
        }
      })
    }
    if (studentIds.length === 0) {
      return res.json({ success: true, data: [] })
    }
    const children = await Student.find({ _id: { $in: studentIds }, deletedAt: null }).populate('classId')
    res.json({ success: true, data: children })
  } catch (error) {
    next(error)
  }
}

const getMyChild = async (req, res, next) => {
  try {
    const studentId = resolveGuardianStudentId(req)
    if (!studentId) throw new ApiError(400, 'No linked student record found for this guardian account')

    const student = await Student.findOne({ _id: studentId, deletedAt: null }).populate('classId')
    if (!student) throw new ApiError(404, 'Student record not found')

    res.json({ success: true, data: student })
  } catch (error) {
    next(error)
  }
}

const getChildAttendance = async (req, res, next) => {
  try {
    const studentId = resolveGuardianStudentId(req)
    if (!studentId) throw new ApiError(400, 'No linked student record found')

    const records = await StudentAttendance.find({
      'records.studentId': studentId,
    })
      .populate('classId')
      .sort({ date: -1 })

    const history = []
    let totalDays = 0
    let presentDays = 0

    records.forEach(att => {
      const rec = att.records.find(r => r.studentId && r.studentId.toString() === studentId.toString())
      if (rec) {
        totalDays++
        if (['Present', 'Late'].includes(rec.status)) presentDays++
        history.push({
          date: att.date,
          status: rec.status,
          remarks: rec.remarks || '',
          periodNumber: att.periodNumber,
        })
      }
    })

    const rate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100

    res.json({
      success: true,
      data: {
        summary: { totalDays, presentDays, attendancePercentage: `${rate}%` },
        history,
      },
    })
  } catch (error) {
    next(error)
  }
}

const getChildGrades = async (req, res, next) => {
  try {
    const studentId = resolveGuardianStudentId(req)
    if (!studentId) throw new ApiError(400, 'No linked student record found')

    const grades = await Grade.find({ studentId })
      .populate({
        path: 'examId',
        populate: [{ path: 'subjectId' }, { path: 'classId' }],
      })
      .sort({ createdAt: -1 })

    res.json({ success: true, data: grades })
  } catch (error) {
    next(error)
  }
}

const getChildFees = async (req, res, next) => {
  try {
    const studentId = resolveGuardianStudentId(req)
    if (!studentId) throw new ApiError(400, 'No linked student record found')

    const fees = await StudentFee.find({ studentId })
      .populate('feeStructureId')
      .sort({ createdAt: -1 })

    res.json({ success: true, data: fees })
  } catch (error) {
    next(error)
  }
}

/**
 * Submit leave application on behalf of child
 */
const submitLeaveRequest = async (req, res, next) => {
  try {
    const studentId = req.body.studentId || resolveGuardianStudentId(req)
    if (!studentId) throw new ApiError(400, 'No linked student record found for this guardian')

    const { startDate, endDate, category, reason } = req.body
    if (!startDate || !endDate || !reason) {
      throw new ApiError(400, 'Start date, end date, and reason are required')
    }

    const student = await Student.findById(studentId)
    if (!student) throw new ApiError(404, 'Student profile not found')

    const leave = await StudentLeaveRequest.create({
      studentId: student._id,
      guardianId: req.user._id,
      classId: student.classId,
      sectionId: student.sectionId || 'A',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      category: category || 'Sick',
      reason,
      status: 'Pending',
    })

    await logAudit(req, 'STUDENT_LEAVE_REQUESTED', {
      leaveId: leave._id,
      studentId: student._id,
      startDate,
      endDate,
    })

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully for review',
      data: leave,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get all leave requests submitted for child
 */
const getGuardianLeaveRequests = async (req, res, next) => {
  try {
    const studentId = req.user.studentId
    if (!studentId) throw new ApiError(400, 'No linked student record found')

    const requests = await StudentLeaveRequest.find({
      studentId,
    })
      .populate('reviewedBy', 'username')
      .sort({ createdAt: -1 })

    res.json({ success: true, count: requests.length, data: requests })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getMyChildren,
  getMyChild,
  getChildAttendance,
  getChildGrades,
  getChildFees,
  submitLeaveRequest,
  getGuardianLeaveRequests,
}
