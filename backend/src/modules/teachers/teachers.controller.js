const Staff = require('../../models/Staff.model')
const User = require('../../models/User.model')
const Role = require('../../models/Role.model')
const TimetableEntry = require('../../models/TimetableEntry.model')
const Class = require('../../models/Class.model')
const Subject = require('../../models/Subject.model')
const Student = require('../../models/Student.model')
const StudentAttendance = require('../../models/StudentAttendance.model')
const StudentLeaveRequest = require('../../models/StudentLeaveRequest.model')
const bcrypt = require('bcryptjs')
const { ApiError } = require('../../middleware/error.middleware')
const { logAudit } = require('../../utils/audit-log.util')
const { escapeRegex } = require('../../utils/regex.util')
const { BCRYPT_ROUNDS } = require('../../config/constants')

/**
 * Helper to get current day of week string
 */
const getDayName = (date = new Date()) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[date.getDay()]
}

/**
 * Get all teachers with aggregated teaching workload metrics
 */
const getTeachers = async (req, res, next) => {
  try {
    const filter = { deletedAt: null }
    if (req.query.search) {
      const safeSearch = escapeRegex(req.query.search)
      filter.$or = [
        { fullName: { $regex: safeSearch, $options: 'i' } },
        { staffId: { $regex: safeSearch, $options: 'i' } },
        { designation: { $regex: safeSearch, $options: 'i' } },
      ]
    }

    const isHrOrAdmin = ['super_admin', 'hr_manager'].includes(req.user.roleName)
    let staffQuery = Staff.find(filter).sort({ createdAt: -1 })
    if (!isHrOrAdmin) {
      staffQuery = staffQuery.select('-salary -allowances -deductions -bankDetails -cnic')
    }
    const teachers = await staffQuery

    const enriched = await Promise.all(
      teachers.map(async (t) => {
        const entries = await TimetableEntry.find({ teacherId: t._id })
          .populate('classId', 'name level')
          .populate('subjectId', 'name code')

        const uniqueClasses = []
        const classIdsSeen = new Set()
        const uniqueSubjects = []
        const subjectIdsSeen = new Set()

        entries.forEach((e) => {
          if (e.classId && !classIdsSeen.has(String(e.classId._id))) {
            classIdsSeen.add(String(e.classId._id))
            uniqueClasses.push({
              _id: e.classId._id,
              name: e.classId.name,
              section: e.sectionId,
            })
          }
          if (e.subjectId && !subjectIdsSeen.has(String(e.subjectId._id))) {
            subjectIdsSeen.add(String(e.subjectId._id))
            uniqueSubjects.push({
              _id: e.subjectId._id,
              name: e.subjectId.name,
              code: e.subjectId.code,
            })
          }
        })

        return {
          ...t.toObject(),
          weeklyPeriodsCount: entries.length,
          assignedClasses: uniqueClasses,
          assignedSubjects: uniqueSubjects,
          isAcademicFaculty: (t.department || '').toLowerCase().includes('academic') || (t.designation || '').toLowerCase().includes('teacher'),
        }
      })
    )

    res.json({ success: true, count: enriched.length, data: enriched })
  } catch (error) {
    next(error)
  }
}

/**
 * Get full weekly schedule for a specific teacher
 */
const getTeacherSchedule = async (req, res, next) => {
  try {
    const teacher = await Staff.findById(req.params.id)
    if (!teacher) throw new ApiError(404, 'Teacher not found')

    const entries = await TimetableEntry.find({ teacherId: req.params.id })
      .populate('classId', 'name level')
      .populate('subjectId', 'name code')
      .sort({ periodNumber: 1 })

    res.json({
      success: true,
      teacher: {
        id: teacher._id,
        fullName: teacher.fullName,
        staffId: teacher.staffId,
        designation: teacher.designation,
      },
      schedule: entries,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Assign / Upsert a teacher into a timetable period slot
 */
const assignTeacherPeriod = async (req, res, next) => {
  try {
    const { classId, sectionId, subjectId, teacherId, dayOfWeek, periodNumber, startTime, endTime, room } = req.body

    if (!classId || !sectionId || !subjectId || !teacherId || !dayOfWeek || !periodNumber) {
      throw new ApiError(400, 'Class, section, subject, teacher, dayOfWeek, and periodNumber are required')
    }

    const entry = await TimetableEntry.findOneAndUpdate(
      { classId, sectionId, dayOfWeek, periodNumber },
      {
        subjectId,
        teacherId,
        startTime: startTime || '08:00',
        endTime: endTime || '08:45',
        room: room || 'Classroom',
      },
      { upsert: true, new: true, runValidators: true }
    )
      .populate('classId')
      .populate('subjectId')
      .populate('teacherId')

    res.json({ success: true, message: 'Class period assigned successfully', data: entry })
  } catch (error) {
    next(error)
  }
}

/**
 * Create a new faculty member with credentials
 */
const createTeacher = async (req, res, next) => {
  try {
    const { fullName, cnic, phone, email, designation, department, joiningDate, salary, qualification } = req.body

    const count = await Staff.countDocuments()
    const staffId = `TCH-2026-${String(count + 1).padStart(3, '0')}`

    const teacher = await Staff.create({
      staffId,
      fullName,
      cnic: cnic || `42101-${String(Math.floor(1000000 + Math.random() * 9000000))}-1`,
      phone,
      email: email || `${staffId.toLowerCase()}@school.edu.pk`,
      designation: designation || 'Teacher',
      department: department || 'Academics',
      joiningDate: joiningDate || new Date(),
      salary: Number(salary) || 50000,
    })

    const targetRole = await Role.findOne({ name: 'teacher' })
    if (targetRole) {
      const defaultPassword = await bcrypt.hash('Teacher@1234', BCRYPT_ROUNDS)
      await User.create({
        username: staffId.toLowerCase(),
        passwordHash: defaultPassword,
        role: targetRole._id,
        roleName: 'teacher',
        staffId: teacher._id,
        mustChangePassword: true,
      })
    }

    res.status(201).json({
      success: true,
      message: 'Faculty member created successfully with portal credentials',
      data: teacher,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get personalized Teacher Workspace dashboard
 */
const getTeacherWorkspace = async (req, res, next) => {
  try {
    let staffId = req.user.staffId
    if (!staffId && req.user.roleName === 'super_admin') {
      if (req.query.teacherId) {
        staffId = req.query.teacherId
      } else {
        const firstTeacher = await Staff.findOne({ deletedAt: null })
        if (firstTeacher) staffId = firstTeacher._id
      }
    }

    if (!staffId) {
      throw new ApiError(400, 'No linked staff profile found for this user')
    }

    const teacher = await Staff.findById(staffId)
    if (!teacher) throw new ApiError(404, 'Teacher profile not found')

    const currentDay = getDayName()

    // 1. Get today's timetable periods
    const todayEntries = await TimetableEntry.find({
      teacherId: staffId,
      dayOfWeek: currentDay,
    })
      .populate('classId', 'name level sections')
      .populate('subjectId', 'name code')
      .sort({ periodNumber: 1 })

    // Calculate active period
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()

    const parseTimeToMinutes = (tStr) => {
      if (!tStr) return 0
      const [h, m] = tStr.split(':').map(Number)
      return (h || 0) * 60 + (m || 0)
    }

    let activePeriod = null
    let nextPeriod = null

    const periodsWithStatus = todayEntries.map((e) => {
      const startMin = parseTimeToMinutes(e.startTime)
      const endMin = parseTimeToMinutes(e.endTime)
      let status = 'upcoming'

      if (nowMinutes >= startMin && nowMinutes <= endMin) {
        status = 'active'
        activePeriod = e
      } else if (nowMinutes > endMin) {
        status = 'completed'
      } else if (!nextPeriod && nowMinutes < startMin) {
        nextPeriod = e
      }

      return {
        _id: e._id,
        periodNumber: e.periodNumber,
        startTime: e.startTime,
        endTime: e.endTime,
        room: e.room,
        class: e.classId ? { _id: e.classId._id, name: e.classId.name, level: e.classId.level } : null,
        sectionId: e.sectionId,
        subject: e.subjectId ? { _id: e.subjectId._id, name: e.subjectId.name, code: e.subjectId.code } : null,
        status,
      }
    })

    // 2. Aggregate all assigned unique classes
    const allEntries = await TimetableEntry.find({ teacherId: staffId })
      .populate('classId', 'name level sections')
      .populate('subjectId', 'name code')

    const classSectionMap = new Map()
    allEntries.forEach((e) => {
      if (e.classId) {
        const key = `${e.classId._id}_${e.sectionId}`
        if (!classSectionMap.has(key)) {
          classSectionMap.set(key, {
            classId: e.classId._id,
            className: e.classId.name,
            level: e.classId.level,
            sectionId: e.sectionId,
            subjects: new Set(),
          })
        }
        if (e.subjectId) {
          classSectionMap.get(key).subjects.add(e.subjectId.name)
        }
      }
    })

    // Count students across assigned classes
    const assignedClasses = []
    let totalStudentsCount = 0

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    for (const item of classSectionMap.values()) {
      const count = await Student.countDocuments({
        classId: item.classId,
        sectionId: item.sectionId,
        status: 'Active',
        deletedAt: null,
      })
      totalStudentsCount += count

      const attendanceToday = await StudentAttendance.findOne({
        classId: item.classId,
        sectionId: item.sectionId,
        date: { $gte: todayStart, $lte: todayEnd },
      })

      assignedClasses.push({
        classId: item.classId,
        className: item.className,
        level: item.level,
        sectionId: item.sectionId,
        studentCount: count,
        subjects: Array.from(item.subjects),
        isAttendanceMarkedToday: !!attendanceToday,
      })
    }

    // 3. Pending Student Leave Requests for teacher's classes
    const assignedClassIds = assignedClasses.map(c => c.classId)
    const pendingLeaveCount = await StudentLeaveRequest.countDocuments({
      classId: { $in: assignedClassIds },
      status: 'Pending',
    })

    res.json({
      success: true,
      data: {
        teacher: {
          _id: teacher._id,
          fullName: teacher.fullName,
          staffId: teacher.staffId,
          designation: teacher.designation,
          department: teacher.department,
          phone: teacher.phone,
          email: teacher.email,
        },
        today: {
          dayName: currentDay,
          date: new Date(),
          totalPeriodsToday: todayEntries.length,
          activePeriod: activePeriod ? activePeriod._id : null,
          periods: periodsWithStatus,
        },
        workload: {
          weeklyPeriodsCount: allEntries.length,
          totalAssignedClasses: assignedClasses.length,
          totalStudents: totalStudentsCount,
          pendingLeaveRequests: pendingLeaveCount,
        },
        assignedClasses,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get assigned classes with student rosters
 */
const getMyClasses = async (req, res, next) => {
  try {
    let staffId = req.user.staffId
    if (!staffId && req.user.roleName === 'super_admin') {
      const firstTeacher = await Staff.findOne({ deletedAt: null })
      if (firstTeacher) staffId = firstTeacher._id
    }

    if (!staffId) throw new ApiError(400, 'No linked staff profile found')

    const entries = await TimetableEntry.find({ teacherId: staffId }).populate('classId')
    const classMap = new Map()

    for (const e of entries) {
      if (e.classId) {
        const key = `${e.classId._id}_${e.sectionId}`
        if (!classMap.has(key)) {
          classMap.set(key, {
            class: e.classId,
            sectionId: e.sectionId,
          })
        }
      }
    }

    const result = []
    for (const item of classMap.values()) {
      const students = await Student.find({
        classId: item.class._id,
        sectionId: item.sectionId,
        status: 'Active',
        deletedAt: null,
      }).sort({ rollNumber: 1, fullName: 1 })

      result.push({
        classId: item.class._id,
        className: item.class.name,
        sectionId: item.sectionId,
        students,
      })
    }

    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

/**
 * Get student leave requests for classes taught by this teacher
 */
const getTeacherLeaveRequests = async (req, res, next) => {
  try {
    let filter = {}
    if (req.user.roleName === 'teacher' && req.user.staffId) {
      const entries = await TimetableEntry.find({ teacherId: req.user.staffId })
      const classIds = entries.map(e => e.classId).filter(Boolean)
      filter.classId = { $in: classIds }
    }

    if (req.query.status) {
      filter.status = req.query.status
    }

    const requests = await StudentLeaveRequest.find(filter)
      .populate('studentId', 'fullName studentId rollNumber')
      .populate('classId', 'name')
      .populate('guardianId', 'username')
      .populate('reviewedBy', 'username')
      .sort({ createdAt: -1 })

    res.json({ success: true, count: requests.length, data: requests })
  } catch (error) {
    next(error)
  }
}

/**
 * Review (Approve / Reject) a student leave request
 */
const reviewLeaveRequest = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, remarks } = req.body

    if (!['Approved', 'Rejected'].includes(status)) {
      throw new ApiError(400, 'Status must be Approved or Rejected')
    }

    const leave = await StudentLeaveRequest.findById(id).populate('studentId')
    if (!leave) throw new ApiError(404, 'Leave request not found')

    // Enforce teacher class assignment for leave review (AUTHZ-05)
    if (req.user.roleName !== 'super_admin') {
      if (!req.user.staffId) {
        throw new ApiError(403, 'Forbidden: No linked staff record found for this user')
      }
      const isAssigned = await TimetableEntry.findOne({
        teacherId: req.user.staffId,
        classId: leave.classId,
      })
      if (!isAssigned) {
        throw new ApiError(403, 'Forbidden: You can only review leave requests for classes you are assigned to teach')
      }
    }

    leave.status = status
    leave.reviewedBy = req.user._id
    leave.reviewedAt = new Date()
    leave.reviewRemarks = remarks || ''
    await leave.save()

    // If Approved, update student attendance records in the date range to 'Excused'
    if (status === 'Approved' && leave.studentId) {
      const curDate = new Date(leave.startDate)
      const endDate = new Date(leave.endDate)

      while (curDate <= endDate) {
        const startOfDay = new Date(curDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(curDate)
        endOfDay.setHours(23, 59, 59, 999)

        // Find existing attendance for the class & date
        const att = await StudentAttendance.findOne({
          classId: leave.classId,
          sectionId: leave.sectionId,
          date: { $gte: startOfDay, $lte: endOfDay },
        })

        if (att) {
          const rec = att.records.find(r => r.studentId && r.studentId.toString() === leave.studentId._id.toString())
          if (rec) {
            rec.status = 'Excused'
            rec.remarks = `Approved Leave: ${leave.category} - ${leave.reason}`
          } else {
            att.records.push({
              studentId: leave.studentId._id,
              status: 'Excused',
              remarks: `Approved Leave: ${leave.category} - ${leave.reason}`,
            })
          }
          await att.save()
        }

        curDate.setDate(curDate.getDate() + 1)
      }
    }

    await logAudit(req, 'STUDENT_LEAVE_REVIEWED', {
      leaveId: leave._id,
      studentId: leave.studentId?._id,
      status,
      remarks,
    })

    res.json({
      success: true,
      message: `Leave request ${status.toLowerCase()} successfully`,
      data: leave,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getTeachers,
  getTeacherSchedule,
  assignTeacherPeriod,
  createTeacher,
  getTeacherWorkspace,
  getMyClasses,
  getTeacherLeaveRequests,
  reviewLeaveRequest,
}
