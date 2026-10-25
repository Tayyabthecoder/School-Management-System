const Exam = require('../../models/Exam.model')
const Grade = require('../../models/Grade.model')
const Student = require('../../models/Student.model')
const StudentAttendance = require('../../models/StudentAttendance.model')
const SchoolSettings = require('../../models/SchoolSettings.model')
const { generatePDFBuffer, buildReportCardPDF } = require('../../utils/pdf.util')
const { ApiError } = require('../../middleware/error.middleware')
const { validateObjectId } = require('../../utils/validation.util')
const { getOrSet } = require('../../utils/cache.util')
const { calculateGradeLetter } = require('./grades.service')

const getExams = async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.classId) {
      validateObjectId(req.query.classId, 'classId')
      filter.classId = req.query.classId
    }
    if (req.query.subjectId) {
      validateObjectId(req.query.subjectId, 'subjectId')
      filter.subjectId = req.query.subjectId
    }

    const exams = await Exam.find(filter)
      .populate('classId')
      .populate('subjectId')
      .populate('academicYearId')
      .sort({ examDate: -1 })

    res.json({ success: true, data: exams })
  } catch (error) {
    next(error)
  }
}

const createExam = async (req, res, next) => {
  try {
    const exam = await Exam.create(req.body)
    res.status(201).json({ success: true, data: exam })
  } catch (error) {
    next(error)
  }
}

const saveGrades = async (req, res, next) => {
  try {
    const { examId, grades } = req.body // grades: [{ studentId, marksObtained }]
    const exam = await Exam.findById(examId)
    if (!exam) throw new ApiError(404, 'Exam not found')

    const settings = await getOrSet('ref:school-settings', 300, async () => {
      return SchoolSettings.findOne({ isActive: true }).lean()
    })
    const gradingScale = settings?.gradingScale || null

    const saved = []
    for (const item of grades) {
      if (item.marksObtained > exam.maxMarks) {
        throw new ApiError(400, `Marks obtained cannot exceed maximum marks (${exam.maxMarks})`)
      }

      const percentage = Math.round((item.marksObtained / exam.maxMarks) * 100)
      const gradeLetter = calculateGradeLetter(percentage, gradingScale)

      const doc = await Grade.findOneAndUpdate(
        { examId, studentId: item.studentId },
        {
          marksObtained: item.marksObtained,
          percentage,
          gradeLetter,
          remarks: item.remarks || '',
          enteredBy: req.user._id,
        },
        { upsert: true, new: true, runValidators: true }
      )
      saved.push(doc)
    }

    res.json({ success: true, data: saved })
  } catch (error) {
    next(error)
  }
}

const getGradesByExam = async (req, res, next) => {
  try {
    const grades = await Grade.find({ examId: req.params.examId })
      .populate('studentId')
      .populate('enteredBy', 'username')

    res.json({ success: true, data: grades })
  } catch (error) {
    next(error)
  }
}

const generateReportCard = async (req, res, next) => {
  try {
    const { studentId, termName } = req.query
    const student = await Student.findById(studentId).populate('classId')
    if (!student) throw new ApiError(404, 'Student not found')

    const userRole = req.user?.roleName || req.user?.role?.name
    const isPrivileged = ['super_admin', 'teacher'].includes(userRole)

    if (!isPrivileged) {
      const allowedStudentId = req.user?.studentId?.toString()
      if (!allowedStudentId || allowedStudentId !== studentId?.toString()) {
        throw new ApiError(403, 'Forbidden: You can only view your own report card')
      }
    }

    const grades = await Grade.find({ studentId })
      .populate({ path: 'examId', populate: { path: 'subjectId' } })

    const formattedGrades = grades
      .filter(g => {
        if (!g.examId) return false
        if (isPrivileged) return true
        return g.examId.isPublished === true
      })
      .map(g => ({
        subjectName: g.examId && g.examId.subjectId ? g.examId.subjectId.name : 'Subject',
        marksObtained: g.marksObtained,
        maxMarks: g.examId ? g.examId.maxMarks : 100,
        percentage: g.percentage,
        gradeLetter: g.gradeLetter,
      }))

    const attRecords = await StudentAttendance.find({
      'records.studentId': student._id,
    })
    let totalDays = 0
    let presentDays = 0
    attRecords.forEach((att) => {
      const rec = att.records.find(
        (r) => r.studentId && r.studentId.toString() === student._id.toString()
      )
      if (rec) {
        totalDays++
        if (['Present', 'Late'].includes(rec.status)) {
          presentDays++
        }
      }
    })
    const attendancePercentage = totalDays > 0 ? `${Math.round((presentDays / totalDays) * 100)}%` : 'N/A'

    const settings = await getOrSet('ref:school-settings', 300, async () => {
      return SchoolSettings.findOne({ isActive: true }).lean()
    })
    const branding = settings || {}

    const pdfBuffer = await generatePDFBuffer((doc) => {
      buildReportCardPDF(doc, {
        studentName: student.fullName,
        studentId: student.studentId,
        className: student.classId ? student.classId.name : 'N/A',
        sectionId: student.sectionId,
        termName: termName || 'Final Term',
        grades: formattedGrades,
        attendancePercentage,
      }, branding)
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=ReportCard_${student.studentId}.pdf`)
    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
}

const getGradesByStudent = async (req, res, next) => {
  try {
    const userRole = req.user?.roleName || req.user?.role?.name
    const isPrivileged = ['super_admin', 'teacher'].includes(userRole)

    if (!isPrivileged) {
      const allowedStudentId = req.user?.studentId?.toString()
      if (!allowedStudentId || allowedStudentId !== req.params.studentId?.toString()) {
        throw new ApiError(403, 'Forbidden: You can only view your own grades')
      }
    }

    let examFilter = {}
    if (!isPrivileged) {
      examFilter.isPublished = true
    }

    const publishedExams = await Exam.find(examFilter).select('_id')
    const publishedExamIds = publishedExams.map(e => e._id)

    const grades = await Grade.find({
      studentId: req.params.studentId,
      examId: { $in: publishedExamIds },
    })
      .populate({ path: 'examId', populate: { path: 'subjectId' } })
      .sort({ createdAt: -1 })

    res.json({ success: true, data: grades })
  } catch (error) {
    next(error)
  }
}

const publishExam = async (req, res, next) => {
  try {
    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      { isPublished: true },
      { new: true, runValidators: true }
    )
      .populate('classId')
      .populate('subjectId')
      .populate('academicYearId')

    if (!exam) throw new ApiError(404, 'Exam not found')

    res.json({ success: true, message: 'Exam published successfully', data: exam })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getExams,
  createExam,
  saveGrades,
  getGradesByExam,
  generateReportCard,
  getGradesByStudent,
  publishExam,
}
