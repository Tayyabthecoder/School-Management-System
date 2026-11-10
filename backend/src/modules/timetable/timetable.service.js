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

module.exports = { assertTeacherAvailable, TEACHER_PUBLIC_FIELDS }
