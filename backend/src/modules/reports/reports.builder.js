const Student = require('../../models/Student.model')
const Staff = require('../../models/Staff.model')
const StudentFee = require('../../models/StudentFee.model')
const StudentAttendance = require('../../models/StudentAttendance.model')
const Grade = require('../../models/Grade.model')

/**
 * Field configuration dictionary for Dynamic Custom Report Builder (FR-RP-03)
 */
const ENTITY_FIELD_CONFIG = {
  students: {
    studentId: { header: 'Student ID', get: s => s.studentId || 'N/A' },
    fullName: { header: 'Full Name', get: s => s.fullName || 'N/A' },
    gender: { header: 'Gender', get: s => s.gender || 'N/A' },
    className: { header: 'Class', get: s => s.classId?.name || 'N/A' },
    sectionId: { header: 'Section', get: s => s.sectionId || 'A' },
    guardianName: { header: 'Guardian Name', get: s => s.guardian?.name || 'N/A' },
    guardianPhone: { header: 'Guardian Phone', get: s => s.guardian?.phone || 'N/A' },
    cnic: { header: 'B-Form / CNIC', get: s => s.bFormNumber || s.guardian?.cnic || 'N/A' },
    bloodGroup: { header: 'Blood Group', get: s => s.bloodGroup || 'N/A' },
    joiningDate: { header: 'Admission Date', get: s => s.joiningDate ? new Date(s.joiningDate).toLocaleDateString('en-GB') : 'N/A' },
    status: { header: 'Status', get: s => s.status || 'Active' },
  },
  staff: {
    staffId: { header: 'Staff ID', get: s => s.staffId || 'N/A' },
    fullName: { header: 'Full Name', get: s => s.fullName || 'N/A' },
    designation: { header: 'Designation', get: s => s.designation || 'N/A' },
    department: { header: 'Department', get: s => s.department || 'N/A' },
    phone: { header: 'Phone', get: s => s.phone || 'N/A' },
    email: { header: 'Email', get: s => s.email || 'N/A' },
    cnic: { header: 'CNIC', get: s => s.cnic || 'N/A' },
    joiningDate: { header: 'Joining Date', get: s => s.joiningDate ? new Date(s.joiningDate).toLocaleDateString('en-GB') : 'N/A' },
    salary: { header: 'Base Salary (PKR)', get: s => s.salary || 0 },
    status: { header: 'Status', get: s => s.isActive ? 'Active' : 'Inactive' },
  },
  fees: {
    studentId: { header: 'Student ID', get: f => f.studentId?.studentId || 'N/A' },
    fullName: { header: 'Student Name', get: f => f.studentId?.fullName || 'N/A' },
    className: { header: 'Class', get: f => f.studentId?.classId?.name || 'N/A' },
    sectionId: { header: 'Section', get: f => f.studentId?.sectionId || 'N/A' },
    amountDue: { header: 'Amount Due (PKR)', get: f => f.amountDue || 0 },
    amountPaid: { header: 'Amount Paid (PKR)', get: f => f.amountPaid || 0 },
    outstandingAmount: { header: 'Outstanding (PKR)', get: f => f.outstandingAmount || 0 },
    status: { header: 'Status', get: f => f.status || 'Pending' },
    dueDate: { header: 'Due Date', get: f => f.dueDate ? new Date(f.dueDate).toLocaleDateString('en-GB') : 'N/A' },
  },
  attendance: {
    date: { header: 'Date', get: a => a.date ? new Date(a.date).toLocaleDateString('en-GB') : 'N/A' },
    className: { header: 'Class', get: a => a.classId?.name || 'N/A' },
    sectionId: { header: 'Section', get: a => a.sectionId || 'A' },
    studentId: { header: 'Student ID', get: a => a.student?.studentId || 'N/A' },
    fullName: { header: 'Student Name', get: a => a.student?.fullName || 'N/A' },
    status: { header: 'Status', get: a => a.status || 'Present' },
  },
  grades: {
    studentId: { header: 'Student ID', get: g => g.studentId?.studentId || 'N/A' },
    fullName: { header: 'Student Name', get: g => g.studentId?.fullName || 'N/A' },
    className: { header: 'Class', get: g => g.examId?.classId?.name || 'N/A' },
    termName: { header: 'Term', get: g => g.examId?.termName || 'N/A' },
    subjectName: { header: 'Subject', get: g => g.examId?.subjectId?.name || 'N/A' },
    maxMarks: { header: 'Max Marks', get: g => g.examId?.maxMarks || 100 },
    marksObtained: { header: 'Marks Obtained', get: g => g.marksObtained || 0 },
    percentage: { header: 'Percentage (%)', get: g => `${g.percentage || 0}%` },
    gradeLetter: { header: 'Grade', get: g => g.gradeLetter || 'N/A' },
  },
}

const Exam = require('../../models/Exam.model')

/**
 * Compile Dynamic Custom Report dataset with database-level filtering (FR-RP-03)
 */
const compileDynamicCustomReport = async ({ entity = 'students', fields = [], filters = {}, sortBy, sortOrder = 1 }) => {
  const entityConfig = ENTITY_FIELD_CONFIG[entity] || ENTITY_FIELD_CONFIG.students
  const selectedKeys = Array.isArray(fields) && fields.length > 0
    ? fields.filter(k => entityConfig[k])
    : Object.keys(entityConfig)

  const columns = selectedKeys.map(k => ({
    header: entityConfig[k].header,
    key: k,
    width: Math.max(15, entityConfig[k].header.length + 4),
  }))

  let rawDocs = []

  if (entity === 'students') {
    const query = { deletedAt: null }
    if (filters.status && filters.status !== 'ALL') query.status = filters.status
    if (filters.classId && filters.classId !== 'ALL') query.classId = filters.classId
    if (filters.sectionId && filters.sectionId !== 'ALL') query.sectionId = filters.sectionId
    if (filters.gender && filters.gender !== 'ALL') query.gender = filters.gender
    if (filters.from || filters.to) {
      query.joiningDate = {}
      if (filters.from) query.joiningDate.$gte = new Date(filters.from)
      if (filters.to) query.joiningDate.$lte = new Date(filters.to)
    }
    const sortField = sortBy === 'fullName' ? 'fullName' : 'studentId'
    rawDocs = await Student.find(query).populate('classId').sort({ [sortField]: sortOrder === -1 ? -1 : 1 })

  } else if (entity === 'staff') {
    const query = { deletedAt: null }
    if (filters.status === 'Active') query.isActive = true
    if (filters.status === 'Inactive') query.isActive = false
    if (filters.department && filters.department !== 'ALL') query.department = filters.department
    const sortField = sortBy === 'fullName' ? 'fullName' : 'staffId'
    rawDocs = await Staff.find(query).sort({ [sortField]: sortOrder === -1 ? -1 : 1 })

  } else if (entity === 'fees') {
    const query = {}
    if (filters.status && filters.status !== 'ALL') query.status = filters.status
    if (filters.from || filters.to) {
      query.dueDate = {}
      if (filters.from) query.dueDate.$gte = new Date(filters.from)
      if (filters.to) query.dueDate.$lte = new Date(filters.to)
    }
    if (filters.classId && filters.classId !== 'ALL') {
      const studentMatch = { classId: filters.classId, deletedAt: null }
      if (filters.sectionId && filters.sectionId !== 'ALL') studentMatch.sectionId = filters.sectionId
      const studentIds = await Student.find(studentMatch).distinct('_id')
      query.studentId = { $in: studentIds }
    }
    rawDocs = await StudentFee.find(query)
      .populate({ path: 'studentId', populate: { path: 'classId' } })
      .sort({ dueDate: -1 })

  } else if (entity === 'attendance') {
    const query = {}
    if (filters.classId && filters.classId !== 'ALL') query.classId = filters.classId
    if (filters.sectionId && filters.sectionId !== 'ALL') query.sectionId = filters.sectionId
    if (filters.from || filters.to) {
      query.date = {}
      if (filters.from) query.date.$gte = new Date(filters.from)
      if (filters.to) query.date.$lte = new Date(filters.to)
    }
    const attDocs = await StudentAttendance.find(query)
      .populate('classId')
      .populate('records.studentId')
      .sort({ date: -1 })

    attDocs.forEach(att => {
      (att.records || []).forEach(r => {
        if (!r.studentId) return
        if (filters.status && filters.status !== 'ALL' && r.status !== filters.status) return
        rawDocs.push({
          date: att.date,
          classId: att.classId,
          sectionId: att.sectionId,
          student: r.studentId,
          status: r.status,
        })
      })
    })

  } else if (entity === 'grades') {
    const gradesQuery = {}
    if (filters.classId && filters.classId !== 'ALL') {
      const examIds = await Exam.find({ classId: filters.classId }).distinct('_id')
      gradesQuery.examId = { $in: examIds }
    }
    if (filters.from || filters.to) {
      gradesQuery.createdAt = {}
      if (filters.from) gradesQuery.createdAt.$gte = new Date(filters.from)
      if (filters.to) gradesQuery.createdAt.$lte = new Date(filters.to)
    }

    rawDocs = await Grade.find(gradesQuery)
      .populate('studentId')
      .populate({ path: 'examId', populate: [{ path: 'subjectId' }, { path: 'classId' }] })
      .sort({ createdAt: -1 })
  }

  const rows = rawDocs.map(doc => {
    const row = {}
    selectedKeys.forEach(k => {
      row[k] = entityConfig[k].get(doc)
    })
    return row
  })

  return { columns, rows, entity }
}

module.exports = {
  ENTITY_FIELD_CONFIG,
  compileDynamicCustomReport,
}
