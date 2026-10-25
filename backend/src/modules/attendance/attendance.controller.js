const StudentAttendance = require('../../models/StudentAttendance.model')
const StaffAttendance = require('../../models/StaffAttendance.model')
const Student = require('../../models/Student.model')
const SchoolSettings = require('../../models/SchoolSettings.model')
const { getOrSet, invalidateCache } = require('../../utils/cache.util')
const { logAudit } = require('../../utils/audit-log.util')
const { broadcast } = require('../reports/sse.controller')

const markStudentAttendance = async (req, res, next) => {
  try {
    const { classId, sectionId, date, periodNumber, records } = req.body
    const attendanceDate = new Date(date || Date.now())
    attendanceDate.setHours(0, 0, 0, 0)

    const existing = await StudentAttendance.findOne({
      classId,
      sectionId,
      date: attendanceDate,
      periodNumber: periodNumber || 0,
    })

    let doc
    if (existing) {
      existing.records = records
      existing.markedBy = req.user._id
      doc = await existing.save()
    } else {
      doc = await StudentAttendance.create({
        classId,
        sectionId,
        date: attendanceDate,
        periodNumber: periodNumber || 0,
        records,
        markedBy: req.user._id,
      })
    }

    // Check low-attendance threshold for absent students
    const absentRecords = records.filter(r => r.status === 'Absent')
    if (absentRecords.length > 0) {
      const absentStudentIds = absentRecords.map(r => r.studentId)
      const students = await Student.find({ _id: { $in: absentStudentIds } })

      // Low-Attendance Threshold Check for current month
      const settings = await getOrSet('ref:school-settings', 60, async () => {
        let s = await SchoolSettings.findOne({ isActive: true }).sort({ updatedAt: -1 })
        return s || { attendanceAlertThreshold: 75 }
      })
      const threshold = settings.attendanceAlertThreshold ?? 75

      const monthStart = new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), 1)
      const monthEnd = new Date(attendanceDate.getFullYear(), attendanceDate.getMonth() + 1, 0, 23, 59, 59, 999)

      const monthlyAttDocs = await StudentAttendance.find({
        classId,
        date: { $gte: monthStart, $lte: monthEnd },
      })

      for (const st of students) {
        let totalDays = 0
        let presentDays = 0

        monthlyAttDocs.forEach(attDoc => {
          const rec = attDoc.records.find(r => r.studentId && r.studentId.toString() === st._id.toString())
          if (rec) {
            totalDays++
            if (['Present', 'Late'].includes(rec.status)) {
              presentDays++
            }
          }
        })

        if (totalDays >= 3) {
          const monthlyRate = Math.round((presentDays / totalDays) * 100)
          if (monthlyRate < threshold) {
            await logAudit({
              req,
              action: 'LOW_ATTENDANCE_ALERT',
              module: 'attendance',
              documentId: st._id,
              newValues: {
                studentId: st._id,
                monthlyRate,
                threshold,
                totalDays,
                presentDays,
              },
            })
          }
        }
      }
    }

    await invalidateCache('dashboard:stats')

    broadcast('attendance:updated', { classId, date: attendanceDate })

    res.json({ success: true, data: doc })
  } catch (error) {
    next(error)
  }
}

const getStudentAttendance = async (req, res, next) => {
  try {
    const { classId, sectionId, date, studentId } = req.query
    const filter = {}

    if (classId) filter.classId = classId
    if (sectionId) filter.sectionId = sectionId
    if (date) {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      filter.date = d
    }

    let records = await StudentAttendance.find(filter)
      .populate('classId')
      .populate('records.studentId')
      .sort({ date: -1 })

    if (studentId) {
      records = records.map(r => ({
        ...r.toObject(),
        records: r.records.filter(rec => rec.studentId && rec.studentId._id.toString() === studentId),
      }))
    }

    res.json({ success: true, data: records })
  } catch (error) {
    next(error)
  }
}

const markStaffAttendance = async (req, res, next) => {
  try {
    const { staffId, date, status, remarks } = req.body
    const attendanceDate = new Date(date || Date.now())
    attendanceDate.setHours(0, 0, 0, 0)

    const doc = await StaffAttendance.findOneAndUpdate(
      { staffId, date: attendanceDate },
      { status, remarks, markedBy: req.user._id },
      { upsert: true, new: true, runValidators: true }
    )

    res.json({ success: true, data: doc })
  } catch (error) {
    next(error)
  }
}

const getStaffAttendance = async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.staffId) filter.staffId = req.query.staffId
    if (req.query.date) {
      const d = new Date(req.query.date)
      d.setHours(0, 0, 0, 0)
      filter.date = d
    }

    const records = await StaffAttendance.find(filter).populate('staffId').sort({ date: -1 })
    res.json({ success: true, data: records })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  markStudentAttendance,
  getStudentAttendance,
  markStaffAttendance,
  getStaffAttendance,
}
