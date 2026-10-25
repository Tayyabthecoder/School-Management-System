const mongoose = require('mongoose')

const staffAttendanceSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Late', 'On Leave', 'Leave', 'Half Day'], required: true },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  remarks: { type: String, default: '' },
}, { timestamps: true })

staffAttendanceSchema.index({ staffId: 1, date: 1 }, { unique: true })

module.exports = mongoose.model('StaffAttendance', staffAttendanceSchema)
