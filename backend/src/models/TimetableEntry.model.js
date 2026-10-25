const mongoose = require('mongoose')
const { DAYS_OF_WEEK } = require('../config/constants')

const timetableEntrySchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  sectionId: { type: String, required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  dayOfWeek: { type: String, enum: DAYS_OF_WEEK, required: true },
  periodNumber: { type: Number, required: true }, // 1 to 8
  startTime: { type: String, required: true }, // "08:00"
  endTime: { type: String, required: true }, // "08:45"
  room: { type: String, default: 'Classroom' },
}, { timestamps: true })

timetableEntrySchema.index({ classId: 1, sectionId: 1, dayOfWeek: 1, periodNumber: 1 }, { unique: true })

module.exports = mongoose.model('TimetableEntry', timetableEntrySchema)
