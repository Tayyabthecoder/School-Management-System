const PromotionConfig = require('../../models/PromotionConfig.model')
const Student = require('../../models/Student.model')
const Exam = require('../../models/Exam.model')
const Grade = require('../../models/Grade.model')
const Class = require('../../models/Class.model')
const AcademicYear = require('../../models/AcademicYear.model')
const { logAudit } = require('../../utils/audit-log.util')
const { ApiError } = require('../../middleware/error.middleware')

const getPromotionConfig = async (req, res, next) => {
  try {
    let { academicYearId } = req.query
    if (!academicYearId) {
      const activeYear = await AcademicYear.findOne({ isActive: true })
      if (activeYear) academicYearId = activeYear._id
    }

    let config = await PromotionConfig.findOne({ academicYearId })
      .populate('academicYearId')
      .populate('targetAcademicYearId')
      .populate('mappings.fromClassId')
      .populate('mappings.toClassId')

    if (!config) {
      // Default mappings by class level
      const classes = await Class.find({ isActive: true }).sort({ level: 1 })
      const defaultMappings = []
      for (let i = 0; i < classes.length - 1; i++) {
        defaultMappings.push({
          fromClassId: classes[i]._id,
          toClassId: classes[i + 1]._id,
        })
      }

      config = await PromotionConfig.create({
        academicYearId,
        finalExamTermName: 'Final Term',
        mappings: defaultMappings,
      })

      config = await PromotionConfig.findById(config._id)
        .populate('academicYearId')
        .populate('targetAcademicYearId')
        .populate('mappings.fromClassId')
        .populate('mappings.toClassId')
    }

    res.json({ success: true, data: config })
  } catch (error) {
    next(error)
  }
}

const savePromotionConfig = async (req, res, next) => {
  try {
    const { academicYearId, targetAcademicYearId, finalExamTermName, mappings } = req.body

    const config = await PromotionConfig.findOneAndUpdate(
      { academicYearId },
      {
        targetAcademicYearId,
        finalExamTermName: finalExamTermName || 'Final Term',
        mappings,
      },
      { upsert: true, new: true, runValidators: true }
    )
      .populate('academicYearId')
      .populate('targetAcademicYearId')
      .populate('mappings.fromClassId')
      .populate('mappings.toClassId')

    res.json({ success: true, message: 'Promotion configuration saved', data: config })
  } catch (error) {
    next(error)
  }
}

const previewPromotion = async (req, res, next) => {
  try {
    const { configId, academicYearId } = req.body

    const filter = configId ? { _id: configId } : { academicYearId }
    const config = await PromotionConfig.findOne(filter)
      .populate('mappings.fromClassId')
      .populate('mappings.toClassId')

    if (!config) throw new ApiError(404, 'Promotion configuration not found')

    const promote = []
    const retain = []
    const unresolved = []

    for (const mapping of config.mappings) {
      const fromClass = mapping.fromClassId
      const toClass = mapping.toClassId

      if (!fromClass || !toClass) continue

      // Active students in fromClass
      const students = await Student.find({ classId: fromClass._id, status: 'Active', deletedAt: null })

      // Final term exams in fromClass
      const exams = await Exam.find({
        classId: fromClass._id,
        termName: config.finalExamTermName || 'Final Term',
      }).populate('subjectId')

      const studentIds = students.map(s => s._id)
      const examIds = exams.map(e => e._id)
      const allClassGrades = (studentIds.length > 0 && examIds.length > 0)
        ? await Grade.find({ studentId: { $in: studentIds }, examId: { $in: examIds } }).lean()
        : []
      const gradeMap = new Map()
      allClassGrades.forEach(g => {
        const sId = (g.studentId?._id || g.studentId || '').toString()
        const eId = (g.examId?._id || g.examId || '').toString()
        gradeMap.set(sId + '_' + eId, g)
      })

      for (const student of students) {
        if (exams.length === 0) {
          unresolved.push({
            studentId: student._id,
            rollNo: student.studentId,
            fullName: student.fullName,
            currentClass: fromClass.name,
            targetClass: toClass.name,
            fromClassId: fromClass._id,
            toClassId: toClass._id,
            reason: 'No Final Term exams recorded for this class',
            decision: 'unresolved',
          })
          continue
        }

        let hasMissingGrade = false
        let hasFailedExam = false
        const examDetails = []

        for (const exam of exams) {
          const sId = student._id.toString()
          const eId = exam._id.toString()
          const grade = gradeMap.get(sId + '_' + eId)
          if (!grade) {
            hasMissingGrade = true
            examDetails.push({ subject: exam.subjectId?.name || 'Subject', status: 'Missing Grade' })
          } else {
            const passMarks = exam.passMarks || 40
            const isPassed = grade.marksObtained >= passMarks
            if (!isPassed) hasFailedExam = true
            examDetails.push({
              subject: exam.subjectId?.name || 'Subject',
              marks: grade.marksObtained,
              maxMarks: exam.maxMarks || 100,
              passMarks,
              isPassed,
            })
          }
        }

        const studentData = {
          studentId: student._id,
          rollNo: student.studentId,
          fullName: student.fullName,
          currentClass: fromClass.name,
          targetClass: toClass.name,
          fromClassId: fromClass._id,
          toClassId: toClass._id,
          examDetails,
        }

        if (hasMissingGrade) {
          unresolved.push({ ...studentData, reason: 'Pending Exam Grades', decision: 'unresolved' })
        } else if (hasFailedExam) {
          retain.push({ ...studentData, reason: 'Failed Final Exam', decision: 'retain' })
        } else {
          promote.push({ ...studentData, reason: 'Passed All Final Exams', decision: 'promote' })
        }
      }
    }

    res.json({
      success: true,
      data: {
        configId: config._id,
        isExecuted: config.isExecuted,
        summary: {
          totalStudents: promote.length + retain.length + unresolved.length,
          promoteCount: promote.length,
          retainCount: retain.length,
          unresolvedCount: unresolved.length,
        },
        promote,
        retain,
        unresolved,
      },
    })
  } catch (error) {
    next(error)
  }
}

const executePromotion = async (req, res, next) => {
  try {
    const { configId, overrides = [] } = req.body

    const config = await PromotionConfig.findById(configId)
      .populate('mappings.fromClassId')
      .populate('mappings.toClassId')

    if (!config) throw new ApiError(404, 'Promotion configuration not found')
    if (config.isExecuted) {
      throw new ApiError(400, 'This promotion has already been executed')
    }

    const previewRes = await previewPromotionInternal(config)
    const { promote, retain, unresolved } = previewRes

    const overrideMap = new Map()
    overrides.forEach(ov => overrideMap.set(ov.studentId.toString(), ov.decision))

    const allStudents = [...promote, ...retain, ...unresolved]
    let promotedCount = 0
    let retainedCount = 0

    const bulkOps = []
    for (const item of allStudents) {
      const studentId = item.studentId.toString()
      const finalDecision = overrideMap.get(studentId) || item.decision

      if (finalDecision === 'promote') {
        bulkOps.push({
          updateOne: {
            filter: { _id: item.studentId },
            update: { $set: { classId: item.toClassId } },
          },
        })
        promotedCount++
      } else {
        retainedCount++
      }
    }

    if (bulkOps.length > 0) {
      await Student.bulkWrite(bulkOps)
    }

    config.isExecuted = true
    config.executedAt = new Date()
    config.executedBy = req.user._id
    await config.save()

    await logAudit({
      req,
      action: 'PROMOTION_EXECUTED',
      module: 'students',
      documentId: config._id,
      newValues: {
        academicYearId: config.academicYearId,
        targetAcademicYearId: config.targetAcademicYearId,
        promotedCount,
        retainedCount,
      },
    })

    res.json({
      success: true,
      message: `Promotion completed: ${promotedCount} students promoted, ${retainedCount} students retained`,
      data: { promotedCount, retainedCount },
    })
  } catch (error) {
    next(error)
  }
}

const previewPromotionInternal = async (config) => {
  const promote = []
  const retain = []
  const unresolved = []

  for (const mapping of config.mappings) {
    const fromClass = mapping.fromClassId
    const toClass = mapping.toClassId
    if (!fromClass || !toClass) continue

    const students = await Student.find({ classId: fromClass._id, status: 'Active', deletedAt: null })
    const exams = await Exam.find({
      classId: fromClass._id,
      termName: config.finalExamTermName || 'Final Term',
    }).populate('subjectId')

    const studentIds = students.map(s => s._id)
    const examIds = exams.map(e => e._id)
    const allClassGrades = (studentIds.length > 0 && examIds.length > 0)
      ? await Grade.find({ studentId: { $in: studentIds }, examId: { $in: examIds } }).lean()
      : []
    const gradeMap = new Map()
    allClassGrades.forEach(g => {
      const sId = (g.studentId?._id || g.studentId || '').toString()
      const eId = (g.examId?._id || g.examId || '').toString()
      gradeMap.set(sId + '_' + eId, g)
    })

    for (const student of students) {
      if (exams.length === 0) {
        unresolved.push({
          studentId: student._id,
          rollNo: student.studentId,
          fullName: student.fullName,
          fromClassId: fromClass._id,
          toClassId: toClass._id,
          decision: 'unresolved',
        })
        continue
      }

      let hasMissing = false
      let hasFailed = false

      for (const exam of exams) {
        const sId = student._id.toString()
        const eId = exam._id.toString()
        const grade = gradeMap.get(sId + '_' + eId)
        if (!grade) {
          hasMissing = true
        } else if (grade.marksObtained < (exam.passMarks || 40)) {
          hasFailed = true
        }
      }

      const item = {
        studentId: student._id,
        rollNo: student.studentId,
        fullName: student.fullName,
        fromClassId: fromClass._id,
        toClassId: toClass._id,
      }

      if (hasMissing) {
        unresolved.push({ ...item, decision: 'unresolved' })
      } else if (hasFailed) {
        retain.push({ ...item, decision: 'retain' })
      } else {
        promote.push({ ...item, decision: 'promote' })
      }
    }
  }

  return { promote, retain, unresolved }
}

module.exports = {
  getPromotionConfig,
  savePromotionConfig,
  previewPromotion,
  executePromotion,
}
