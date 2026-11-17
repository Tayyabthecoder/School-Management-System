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
  // "<teacherId>|<day>|<period>", set on every write by upsertTimetableEntry(). With the partial unique
  // index below, MongoDB itself refuses to put one teacher in two classrooms in the same period even
  // when two admins save at the same moment (the lookup in assertTeacherAvailable alone cannot stop that).
  teacherSlotKey: { type: String },
}, { timestamps: true })

timetableEntrySchema.index({ classId: 1, sectionId: 1, dayOfWeek: 1, periodNumber: 1 }, { unique: true })
timetableEntrySchema.index({ teacherId: 1, dayOfWeek: 1, periodNumber: 1 })
timetableEntrySchema.index(
  { teacherSlotKey: 1 },
  { unique: true, partialFilterExpression: { teacherSlotKey: { $type: 'string' } } }
)

module.exports = mongoose.model('TimetableEntry', timetableEntrySchema)
