const TimetableEntry = require('../../models/TimetableEntry.model')
const { ApiError } = require('../../middleware/error.middleware')

/**
 * Throws 409 when the teacher already teaches a *different* class/section in the same
 * day + period. The slot being (re)assigned itself is excluded so an upsert of the
 * same class/section period is allowed. Shared by every endpoint that writes periods.
 */
const assertTeacherAvailable = async ({ teacherId, dayOfWeek, periodNumber, classId, sectionId }) => {
  const conflict = await TimetableEntry.findOne({
    teacherId,
    dayOfWeek,
    periodNumber,
    $nor: [{ classId, sectionId }],
  }).populate('classId')

  if (conflict) {
    const clsName = conflict.classId?.name || 'another class'
    throw new ApiError(
      409,
      `Teacher is already assigned to ${clsName} (Section ${conflict.sectionId}) on ${dayOfWeek}, Period ${periodNumber}`
    )
  }
}

/**
 * Staff fields that are safe to embed in timetable responses. The timetable is readable
 * by every role (students and guardians included), so salary, CNIC, phone and bank
 * details must never be populated here.
 */
const TEACHER_PUBLIC_FIELDS = 'fullName staffId designation department'

const teacherSlotKey = (teacherId, dayOfWeek, periodNumber) => `${teacherId}|${dayOfWeek}|${periodNumber}`

/**
 * Creates or updates the timetable slot identified by `filter` ({ classId, sectionId, dayOfWeek,
 * periodNumber }) and stamps it with the teacher key that the unique index enforces.
 *
 *  - If the teacher got booked into another class for the same period in the meantime (two admins
 *    saving at once), MongoDB refuses the write and this answers 409, like assertTeacherAvailable.
 *  - If two writers raced to create the very same slot, the loser is retried once and simply
 *    updates the slot the winner created.
 */
const upsertTimetableEntry = async (filter, fields, attempt = 0) => {
  const update = { ...fields, teacherSlotKey: teacherSlotKey(fields.teacherId, filter.dayOfWeek, filter.periodNumber) }
  try {
    return await TimetableEntry.findOneAndUpdate(filter, update, { upsert: true, new: true, runValidators: true })
      .populate('classId')
      .populate('subjectId')
      .populate('teacherId', TEACHER_PUBLIC_FIELDS)
  } catch (err) {
    if (err?.code !== 11000) throw err
    if (err.keyPattern?.teacherSlotKey) {
      throw new ApiError(409, `Teacher is already assigned to another class on ${filter.dayOfWeek}, Period ${filter.periodNumber}`)
    }
    if (attempt === 0) return upsertTimetableEntry(filter, fields, 1)
    throw err
  }
}

module.exports = { assertTeacherAvailable, upsertTimetableEntry, TEACHER_PUBLIC_FIELDS }
