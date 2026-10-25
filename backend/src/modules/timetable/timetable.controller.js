const TimetableEntry = require('../../models/TimetableEntry.model')
const { ApiError } = require('../../middleware/error.middleware')

const PERIOD_TIMES = [
  { start: '08:00', end: '08:45' },
  { start: '08:45', end: '09:30' },
  { start: '09:30', end: '10:15' },
  { start: '10:15', end: '11:00' },
  { start: '11:30', end: '12:15' },
  { start: '12:15', end: '13:00' },
  { start: '13:00', end: '13:45' },
  { start: '13:45', end: '14:30' },
]

const getTimetable = async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.classId) filter.classId = req.query.classId
    if (req.query.sectionId) filter.sectionId = req.query.sectionId
    if (req.query.teacherId) filter.teacherId = req.query.teacherId
    if (req.query.dayOfWeek) filter.dayOfWeek = req.query.dayOfWeek

    const entries = await TimetableEntry.find(filter)
      .populate('classId')
      .populate('subjectId')
      .populate('teacherId')
      .sort({ dayOfWeek: 1, periodNumber: 1 })

    res.json({ success: true, data: entries })
  } catch (error) {
    next(error)
  }
}

const createTimetableEntry = async (req, res, next) => {
  try {
    const { classId, sectionId, subjectId, teacherId, dayOfWeek, periodNumber, startTime, endTime, room } = req.body

    if (!classId || !sectionId || !subjectId || !teacherId || !dayOfWeek || !periodNumber) {
      throw new ApiError(400, 'All schedule fields (classId, sectionId, subjectId, teacherId, dayOfWeek, periodNumber) are required')
    }

    // Check for teacher schedule conflict across different classes/sections
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

    const entry = await TimetableEntry.findOneAndUpdate(
      { classId, sectionId, dayOfWeek, periodNumber },
      {
        subjectId,
        teacherId,
        startTime: startTime || PERIOD_TIMES[periodNumber - 1]?.start || '08:00',
        endTime: endTime || PERIOD_TIMES[periodNumber - 1]?.end || '08:45',
        room: room || 'Classroom',
      },
      { upsert: true, new: true, runValidators: true }
    )
      .populate('classId')
      .populate('subjectId')
      .populate('teacherId')

    res.status(201).json({ success: true, data: entry })
  } catch (error) {
    next(error)
  }
}

const deleteTimetableEntry = async (req, res, next) => {
  try {
    const entry = await TimetableEntry.findByIdAndDelete(req.params.id)
    if (!entry) throw new ApiError(404, 'Timetable period not found')
    res.json({ success: true, message: 'Schedule period cleared successfully' })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getTimetable,
  createTimetableEntry,
  deleteTimetableEntry,
}
