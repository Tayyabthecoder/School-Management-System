const Subject = require('../../models/Subject.model')
const Class = require('../../models/Class.model')
const { getOrSet, invalidateCache } = require('../../utils/cache.util')
const { logAudit } = require('../../utils/audit-log.util')
const { ApiError } = require('../../middleware/error.middleware')

const getSubjects = async (req, res, next) => {
  try {
    const classId = req.query.classId
    const cacheKey = classId ? `ref:subjects:class:${classId}` : 'ref:subjects:class:all'

    const subjects = await getOrSet(cacheKey, 300, async () => {
      const filter = { isActive: true }
      if (classId) filter.classId = classId
      return Subject.find(filter).populate('classId').sort({ name: 1 }).lean()
    })

    res.json({ success: true, data: subjects })
  } catch (error) {
    next(error)
  }
}

const getSubjectById = async (req, res, next) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, isActive: true }).populate('classId')
    if (!subject) throw new ApiError(404, 'Subject not found')
    res.json({ success: true, data: subject })
  } catch (error) {
    next(error)
  }
}

const createSubject = async (req, res, next) => {
  try {
    const { name, code, classId, description } = req.body
    if (!name || !code || !classId) {
      throw new ApiError(400, 'Name, code, and classId are required')
    }

    const subject = await Subject.create({
      name,
      code: code.toUpperCase().trim(),
      classId,
      description: description || '',
      isActive: true,
    })

    await Class.findByIdAndUpdate(classId, { $addToSet: { subjects: subject._id } })

    await invalidateCache('ref:subjects:class:all')
    await invalidateCache(`ref:subjects:class:${classId}`)
    await invalidateCache('ref:classes:all')

    await logAudit({
      req,
      action: 'CREATE_SUBJECT',
      module: 'classes',
      documentId: subject._id,
      newValues: subject,
    })

    res.status(201).json({ success: true, data: subject })
  } catch (error) {
    next(error)
  }
}

const updateSubject = async (req, res, next) => {
  try {
    const { name, code, description, isActive } = req.body
    const subject = await Subject.findById(req.params.id)
    if (!subject) throw new ApiError(404, 'Subject not found')

    if (name !== undefined) subject.name = name
    if (code !== undefined) subject.code = code.toUpperCase().trim()
    if (description !== undefined) subject.description = description
    if (isActive !== undefined) subject.isActive = isActive

    await subject.save()

    await invalidateCache('ref:subjects:class:all')
    if (subject.classId) await invalidateCache(`ref:subjects:class:${subject.classId}`)
    await invalidateCache('ref:classes:all')

    await logAudit({
      req,
      action: 'UPDATE_SUBJECT',
      module: 'classes',
      documentId: subject._id,
      newValues: { name, code, description, isActive },
    })

    res.json({ success: true, data: subject })
  } catch (error) {
    next(error)
  }
}

const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )
    if (!subject) throw new ApiError(404, 'Subject not found')

    // Remove from class array
    if (subject.classId) {
      await Class.findByIdAndUpdate(subject.classId, { $pull: { subjects: subject._id } })
      await invalidateCache(`ref:subjects:class:${subject.classId}`)
    }

    await invalidateCache('ref:subjects:class:all')
    await invalidateCache('ref:classes:all')

    await logAudit({
      req,
      action: 'DELETE_SUBJECT',
      module: 'classes',
      documentId: subject._id,
    })

    res.json({ success: true, message: 'Subject deactivated successfully' })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
}
