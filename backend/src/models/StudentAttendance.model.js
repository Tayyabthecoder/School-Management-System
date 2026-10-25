const mongoose = require('mongoose')

const attendanceRecordSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Late', 'Excused'], required: true },
  remarks: { type: String, default: '' },
}, { _id: false })

const studentAttendanceSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  sectionId: { type: String, required: true },
  date: { type: Date, required: true },
  periodNumber: { type: Number, default: 0 }, // 0 = Daily attendance
  records: [attendanceRecordSchema],
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

studentAttendanceSchema.index({ classId: 1, sectionId: 1, date: 1, periodNumber: 1 }, { unique: true })

module.exports = mongoose.model('StudentAttendance', studentAttendanceSchema)
