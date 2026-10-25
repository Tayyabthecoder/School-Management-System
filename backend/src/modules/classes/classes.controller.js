const Class = require('../../models/Class.model')
const Subject = require('../../models/Subject.model')
const AcademicYear = require('../../models/AcademicYear.model')
const Student = require('../../models/Student.model')
const TimetableEntry = require('../../models/TimetableEntry.model')
const { ApiError } = require('../../middleware/error.middleware')
const { getOrSet, invalidateCache } = require('../../utils/cache.util')
const { logAudit } = require('../../utils/audit-log.util')

const getClasses = async (req, res, next) => {
  try {
    const classes = await getOrSet('ref:classes:all', 300, async () => {
      return Class.find({ isActive: true }).populate('subjects').sort({ level: 1 }).lean()
    })
    res.json({ success: true, data: classes })
  } catch (error) {
    next(error)
  }
}

const createClass = async (req, res, next) => {
  try {
    const { name, level, sections } = req.body
    const parsedSections = Array.isArray(sections) ? sections : (sections ? sections.split(',').map(s => s.trim().toUpperCase()) : ['A', 'B'])
    const newClass = await Class.create({ name, level: Number(level), sections: parsedSections })
    await invalidateCache('ref:classes:all')
    res.status(201).json({ success: true, data: newClass })
  } catch (error) {
    next(error)
  }
}

const deleteClass = async (req, res, next) => {
  try {
    const { id } = req.params
    const force = req.query.force === 'true' || req.body?.force === true

    const cls = await Class.findById(id)
    if (!cls) throw new ApiError(404, 'Class not found')

    const activeStudents = await Student.countDocuments({
      classId: cls._id,
      deletedAt: null,
      status: 'Active',
    })

    if (activeStudents > 0 && !force) {
      throw new ApiError(
        400,
        `Cannot delete class "${cls.name}" because it has ${activeStudents} active enrolled student(s). Reassign students first or pass force=true to proceed.`
      )
    }

    // Cascade cleanups
    await TimetableEntry.deleteMany({ classId: cls._id })
    await Subject.deleteMany({ classId: cls._id })
    if (activeStudents > 0 && force) {
      await Student.updateMany(
        { classId: cls._id, deletedAt: null, status: 'Active' },
        { $set: { status: 'Withdrawn' } }
      )
    }

    await Class.findByIdAndDelete(cls._id)

    await invalidateCache('ref:classes:all')
    await invalidateCache(`ref:subjects:class:${cls._id}`)
    await invalidateCache('ref:subjects:class:all')

    await logAudit({
      req,
      action: 'DELETE_CLASS',
      module: 'classes',
      documentId: cls._id,
      oldValues: { name: cls.name, level: cls.level, sections: cls.sections },
    })

    res.json({ success: true, message: `Class "${cls.name}" deleted successfully` })
  } catch (error) {
    next(error)
  }
}

const addSectionToClass = async (req, res, next) => {
  try {
    const { id } = req.params
    const { sectionName } = req.body
    if (!sectionName) throw new ApiError(400, 'Section name is required')

    const updatedClass = await Class.findByIdAndUpdate(
      id,
      { $addToSet: { sections: sectionName.trim().toUpperCase() } },
      { new: true }
    ).populate('subjects')

    await invalidateCache('ref:classes:all')

    res.json({ success: true, data: updatedClass })
  } catch (error) {
    next(error)
  }
}

const deleteSectionFromClass = async (req, res, next) => {
  try {
    const { id, sectionName: paramSectionName } = req.params
    const sectionName = (paramSectionName || req.query.sectionName || req.body?.sectionName || '').trim().toUpperCase()
    const force = req.query.force === 'true' || req.body?.force === true

    if (!sectionName) {
      throw new ApiError(400, 'Section name is required')
    }

    const cls = await Class.findById(id)
    if (!cls) throw new ApiError(404, 'Class not found')

    if (!cls.sections || !cls.sections.includes(sectionName)) {
      throw new ApiError(404, `Section "${sectionName}" not found in class "${cls.name}"`)
    }

    const activeStudents = await Student.countDocuments({
      classId: cls._id,
      sectionId: sectionName,
      deletedAt: null,
      status: 'Active',
    })

    if (activeStudents > 0 && !force) {
      throw new ApiError(
        400,
        `Cannot delete section "${sectionName}" from "${cls.name}" because it has ${activeStudents} active enrolled student(s). Reassign students first or pass force=true to proceed.`
      )
    }

    // Cascade cleanups for this section
    await TimetableEntry.deleteMany({ classId: cls._id, sectionId: sectionName })
    if (activeStudents > 0 && force) {
      await Student.updateMany(
        { classId: cls._id, sectionId: sectionName, deletedAt: null, status: 'Active' },
        { $set: { status: 'Withdrawn' } }
      )
    }

    const updatedClass = await Class.findByIdAndUpdate(
      cls._id,
      { $pull: { sections: sectionName } },
      { new: true }
    ).populate('subjects')

    await invalidateCache('ref:classes:all')

    await logAudit({
      req,
      action: 'DELETE_SECTION',
      module: 'classes',
      documentId: cls._id,
      oldValues: { className: cls.name, sectionName },
    })

    res.json({
      success: true,
      message: `Section "${sectionName}" deleted from class "${cls.name}" successfully`,
      data: updatedClass,
    })
  } catch (error) {
    next(error)
  }
}

const getSubjects = async (req, res, next) => {
  try {
    const classId = req.query.classId
    const cacheKey = classId ? `ref:subjects:class:${classId}` : 'ref:subjects:class:all'

    const subjects = await getOrSet(cacheKey, 300, async () => {
      const filter = { isActive: true }
      if (classId) filter.classId = classId
      return Subject.find(filter).populate('classId').lean()
    })

    res.json({ success: true, data: subjects })
  } catch (error) {
    next(error)
  }
}

const createSubject = async (req, res, next) => {
  try {
    const { name, code, classId, description } = req.body
    const subject = await Subject.create({ name, code, classId, description })

    // Attach subject to Class model array
    await Class.findByIdAndUpdate(classId, { $addToSet: { subjects: subject._id } })

    await invalidateCache('ref:subjects:class:all')
    if (classId) await invalidateCache(`ref:subjects:class:${classId}`)
    await invalidateCache('ref:classes:all')

    res.status(201).json({ success: true, data: subject })
  } catch (error) {
    next(error)
  }
}

const getAcademicYears = async (req, res, next) => {
  try {
    const years = await getOrSet('ref:academic-years:all', 600, async () => {
      return AcademicYear.find().sort({ year: -1 }).lean()
    })
    res.json({ success: true, data: years })
  } catch (error) {
    next(error)
  }
}

const createAcademicYear = async (req, res, next) => {
  try {
    const { year, startDate, endDate, terms } = req.body
    const ay = await AcademicYear.create({ year, startDate, endDate, terms })
    await invalidateCache('ref:academic-years:all')
    res.status(201).json({ success: true, data: ay })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getClasses,
  createClass,
  deleteClass,
  addSectionToClass,
  deleteSectionFromClass,
  getSubjects,
  createSubject,
  getAcademicYears,
  createAcademicYear,
}
