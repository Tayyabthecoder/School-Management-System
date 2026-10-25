const Student = require('../../models/Student.model')
const Exam = require('../../models/Exam.model')
const Grade = require('../../models/Grade.model')
const StudentAttendance = require('../../models/StudentAttendance.model')
const SchoolSettings = require('../../models/SchoolSettings.model')
const { generatePDFBuffer, buildReportCardPDF, buildTranscriptPDF } = require('../../utils/pdf.util')
const { ApiError } = require('../../middleware/error.middleware')
const { getOrSet } = require('../../utils/cache.util')
const { calculateGradeLetter } = require('../grades/grades.service')

const verifyStudentAccess = (user, student) => {
  const roleName = user.roleName || (typeof user.role === 'object' ? user.role?.name : user.role)

  if (['super_admin', 'teacher'].includes(roleName)) {
    return
  }

  if (['student', 'guardian'].includes(roleName)) {
    const linkedStudentId = user.studentId ? user.studentId.toString() : null
    if (!linkedStudentId || linkedStudentId !== student._id.toString()) {
      throw new ApiError(
        403,
        roleName === 'student'
          ? 'Forbidden: You can only view your own academic records'
          : 'Forbidden: You can only view academic records for your own children'
      )
    }
    return
  }

  throw new ApiError(403, 'Forbidden: Insufficient permissions to view report cards')
}

const compileStudentReportData = async (studentId, termName = 'Final Term', academicYearId = null) => {
  const student = await Student.findOne({ _id: studentId, deletedAt: null }).populate('classId')
  if (!student) throw new ApiError(404, 'Student not found')

  const examFilter = { classId: student.classId?._id }
  if (termName) examFilter.termName = termName
  if (academicYearId) examFilter.academicYearId = academicYearId

  const exams = await Exam.find(examFilter).populate('subjectId')
  const examIds = exams.map(e => e._id)

  const grades = await Grade.find({ studentId: student._id, examId: { $in: examIds } })
    .populate({ path: 'examId', populate: { path: 'subjectId' } })

  const settings = await getOrSet('ref:school-settings', 300, async () => {
    return SchoolSettings.findOne({ isActive: true }).lean()
  })
  const gradingScale = settings?.gradingScale || null

  const formattedGrades = exams.map(exam => {
    const gradeRecord = grades.find(g => g.examId && g.examId._id.toString() === exam._id.toString())
    const marksObtained = gradeRecord ? gradeRecord.marksObtained : 0
    const maxMarks = exam.maxMarks || 100
    const percentage = Math.round((marksObtained / maxMarks) * 100)
    const gradeLetter = gradeRecord ? gradeRecord.gradeLetter : calculateGradeLetter(percentage, gradingScale)

    return {
      examId: exam._id,
      subjectName: exam.subjectId ? exam.subjectId.name : 'Subject',
      maxMarks,
      passMarks: exam.passMarks || 40,
      marksObtained,
      percentage,
      gradeLetter,
      isPassed: marksObtained >= (exam.passMarks || 40),
      remarks: gradeRecord?.remarks || '',
    }
  })

  // Calculate student attendance %
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

  const totalMaxMarks = formattedGrades.reduce((sum, g) => sum + g.maxMarks, 0)
  const totalMarksObtained = formattedGrades.reduce((sum, g) => sum + g.marksObtained, 0)
  const overallPercentage = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100) : 0
  const overallGradeLetter = calculateGradeLetter(overallPercentage, gradingScale)

  return {
    student,
    studentName: student.fullName,
    studentId: student.studentId,
    className: student.classId ? student.classId.name : 'N/A',
    sectionId: student.sectionId,
    termName,
    grades: formattedGrades,
    attendancePercentage,
    summary: {
      totalSubjects: formattedGrades.length,
      totalMaxMarks,
      totalMarksObtained,
      overallPercentage,
      overallGradeLetter,
      passedSubjects: formattedGrades.filter(g => g.isPassed).length,
      failedSubjects: formattedGrades.filter(g => !g.isPassed).length,
    },
  }
}

const getReportCard = async (req, res, next) => {
  try {
    const { studentId } = req.params
    const student = await Student.findOne({ _id: studentId, deletedAt: null })
    if (!student) throw new ApiError(404, 'Student not found')
    verifyStudentAccess(req.user, student)

    const { termName, academicYearId } = req.query
    const reportData = await compileStudentReportData(studentId, termName, academicYearId)
    res.json({ success: true, data: reportData })
  } catch (error) {
    next(error)
  }
}

const downloadReportCardPDF = async (req, res, next) => {
  try {
    const { studentId } = req.params
    const student = await Student.findOne({ _id: studentId, deletedAt: null })
    if (!student) throw new ApiError(404, 'Student not found')
    verifyStudentAccess(req.user, student)

    const { termName, academicYearId } = req.query
    const reportData = await compileStudentReportData(studentId, termName, academicYearId)

    const settings = await getOrSet('ref:school-settings', 300, async () => {
      return SchoolSettings.findOne({ isActive: true }).lean()
    })
    const branding = settings || {}

    const pdfBuffer = await generatePDFBuffer((doc) => {
      buildReportCardPDF(doc, reportData, branding)
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=ReportCard_${reportData.studentId}_${termName || 'Term'}.pdf`)
    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
}

const bulkDownloadClassReportCards = async (req, res, next) => {
  try {
    const { classId } = req.params
    const { sectionId, termName, academicYearId } = req.query

    const filter = { classId, status: 'Active', deletedAt: null }
    if (sectionId) filter.sectionId = sectionId

    const students = await Student.find(filter).sort({ studentId: 1 })
    if (!students || students.length === 0) {
      throw new ApiError(404, 'No active students found in this class/section')
    }

    const reportCards = []
    for (const st of students) {
      const data = await compileStudentReportData(st._id, termName, academicYearId)
      reportCards.push(data)
    }

    const settings = await getOrSet('ref:school-settings', 300, async () => {
      return SchoolSettings.findOne({ isActive: true }).lean()
    })
    const branding = settings || {}

    const pdfBuffer = await generatePDFBuffer((doc) => {
      reportCards.forEach((rc, index) => {
        if (index > 0) doc.addPage()
        buildReportCardPDF(doc, rc, branding)
      })
    })

    const secLabel = sectionId ? `_Sec${sectionId}` : ''
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=Class_ReportCards_${classId}${secLabel}_${termName || 'Term'}.pdf`)
    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
}

/**
 * Compile Multi-Year Cumulative Transcript Data (FR-RC-03)
 */
const compileStudentTranscriptData = async (studentId) => {
  const student = await Student.findOne({ _id: studentId, deletedAt: null }).populate('classId')
  if (!student) throw new ApiError(404, 'Student not found')

  const grades = await Grade.find({ studentId: student._id })
    .populate({
      path: 'examId',
      populate: [
        { path: 'subjectId', select: 'name code' },
        { path: 'academicYearId', select: 'year' },
        { path: 'classId', select: 'name level' },
      ],
    })

  const settings = await getOrSet('ref:school-settings', 300, async () => {
    return SchoolSettings.findOne({ isActive: true }).lean()
  })
  const gradingScale = settings?.gradingScale || null

  // Group by Academic Year and Term
  const termGroups = {}
  grades.forEach((g) => {
    if (!g.examId) return
    const year = g.examId.academicYearId?.year || 'Current'
    const term = g.examId.termName || 'General Term'
    const key = `${year}___${term}`

    if (!termGroups[key]) {
      termGroups[key] = {
        academicYear: String(year),
        termName: term,
        className: g.examId.classId?.name || student.classId?.name || 'Class',
        grades: [],
      }
    }

    const maxMarks = g.examId.maxMarks || 100
    const marksObtained = g.marksObtained || 0
    const percentage = Math.round((marksObtained / maxMarks) * 100)
    const gradeLetter = g.gradeLetter || calculateGradeLetter(percentage, gradingScale)

    termGroups[key].grades.push({
      subjectName: g.examId.subjectId?.name || 'Subject',
      maxMarks,
      marksObtained,
      percentage,
      gradeLetter,
      remarks: g.remarks || '',
    })
  })

  // Calculate aggregates for each term
  const terms = Object.values(termGroups).map((t) => {
    const totalMaxMarks = t.grades.reduce((sum, item) => sum + item.maxMarks, 0)
    const totalMarksObtained = t.grades.reduce((sum, item) => sum + item.marksObtained, 0)
    const percentage = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100) : 0
    const gradeLetter = calculateGradeLetter(percentage, gradingScale)
    return {
      ...t,
      totalMaxMarks,
      totalMarksObtained,
      percentage,
      gradeLetter,
    }
  })

  terms.sort((a, b) => a.academicYear.localeCompare(b.academicYear))

  const cumulativeMaxMarks = terms.reduce((sum, t) => sum + t.totalMaxMarks, 0)
  const cumulativeMarksObtained = terms.reduce((sum, t) => sum + t.totalMarksObtained, 0)
  const cumulativePercentage = cumulativeMaxMarks > 0 ? Math.round((cumulativeMarksObtained / cumulativeMaxMarks) * 100) : 0
  const cumulativeGradeLetter = calculateGradeLetter(cumulativePercentage, gradingScale)

  return {
    student,
    studentName: student.fullName,
    studentId: student.studentId,
    currentClass: student.classId?.name || 'N/A',
    sectionId: student.sectionId,
    dob: student.dob,
    fatherName: student.fatherName,
    guardianName: student.guardian?.name,
    terms,
    cumulative: {
      totalTerms: terms.length,
      totalMaxMarks: cumulativeMaxMarks,
      totalMarksObtained: cumulativeMarksObtained,
      percentage: cumulativePercentage,
      gradeLetter: cumulativeGradeLetter,
    },
  }
}

const getStudentTranscript = async (req, res, next) => {
  try {
    const { studentId } = req.params
    const student = await Student.findOne({ _id: studentId, deletedAt: null })
    if (!student) throw new ApiError(404, 'Student not found')
    verifyStudentAccess(req.user, student)

    const transcriptData = await compileStudentTranscriptData(studentId)
    res.json({ success: true, data: transcriptData })
  } catch (error) {
    next(error)
  }
}

const downloadTranscriptPDF = async (req, res, next) => {
  try {
    const { studentId } = req.params
    const student = await Student.findOne({ _id: studentId, deletedAt: null })
    if (!student) throw new ApiError(404, 'Student not found')
    verifyStudentAccess(req.user, student)

    const transcriptData = await compileStudentTranscriptData(studentId)

    const settings = await getOrSet('ref:school-settings', 300, async () => {
      return SchoolSettings.findOne({ isActive: true }).lean()
    })
    const branding = settings || {}

    const pdfBuffer = await generatePDFBuffer((doc) => {
      buildTranscriptPDF(doc, transcriptData, branding)
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=Transcript_${transcriptData.studentId}.pdf`)
    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getReportCard,
  downloadReportCardPDF,
  bulkDownloadClassReportCards,
  getStudentTranscript,
  downloadTranscriptPDF,
  verifyStudentAccess,
}

