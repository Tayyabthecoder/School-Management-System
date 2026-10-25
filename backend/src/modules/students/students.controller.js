const Student = require('../../models/Student.model')
const Class = require('../../models/Class.model')
const User = require('../../models/User.model')
const Role = require('../../models/Role.model')
const Counter = require('../../models/Counter.model')
const TimetableEntry = require('../../models/TimetableEntry.model')
const StudentAttendance = require('../../models/StudentAttendance.model')
const Grade = require('../../models/Grade.model')
const StudentFee = require('../../models/StudentFee.model')
const FeeStructure = require('../../models/FeeStructure.model')
const Payment = require('../../models/Payment.model')
const Exam = require('../../models/Exam.model')
const bcrypt = require('bcryptjs')
const { getPagination, formatPaginatedResponse } = require('../../utils/pagination.util')
const { logAudit } = require('../../utils/audit-log.util')
const { ApiError } = require('../../middleware/error.middleware')
const { escapeRegex } = require('../../utils/regex.util')
const { BCRYPT_ROUNDS } = require('../../config/constants')
const { invalidateCache } = require('../../utils/cache.util')
const mongoose = require('mongoose')
const studentsImport = require('./students.import.controller')

const ALLOWED_UPDATE_FIELDS = [
  'fullName', 'dob', 'gender', 'classId', 'sectionId', 'rollNumber',
  'guardian', 'bloodGroup', 'address', 'medicalNotes', 'status',
  'transferReason', 'transferDate', 'previousSchool', 'transportOption',
  'fatherName', 'photoUrl', 'bFormNumber', 'nationality', 'religion',
  'emergencyContact', 'city', 'joiningDate',
]

const getStudents = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query)
    const filter = { deletedAt: null }

    if (req.query.search) {
      const safeSearch = escapeRegex(req.query.search)
      filter.$or = [
        { fullName: { $regex: safeSearch, $options: 'i' } },
        { studentId: { $regex: safeSearch, $options: 'i' } },
      ]
    }
    if (req.query.classId) filter.classId = req.query.classId
    if (req.query.sectionId) filter.sectionId = req.query.sectionId
    if (req.query.status) filter.status = req.query.status

    const [students, total] = await Promise.all([
      Student.find(filter).populate('classId').skip(skip).limit(limit).sort({ createdAt: -1 }),
      Student.countDocuments(filter),
    ])

    res.json(formatPaginatedResponse(students, total, page, limit))
  } catch (error) {
    next(error)
  }
}

const getStudentById = async (req, res, next) => {
  try {
    if (['student', 'guardian'].includes(req.user.roleName)) {
      const userStudentId = req.user.studentId ? req.user.studentId.toString() : null
      if (!userStudentId || userStudentId !== req.params.id.toString()) {
        throw new ApiError(
          403,
          req.user.roleName === 'student'
            ? 'Forbidden: You can only view your own student profile'
            : 'Forbidden: You can only view student profiles for your own children'
        )
      }
    }
    const student = await Student.findOne({ _id: req.params.id, deletedAt: null }).populate({
      path: 'classId',
      populate: { path: 'subjects' },
    })
    if (!student) throw new ApiError(404, 'Student not found')
    res.json({ success: true, data: student })
  } catch (error) {
    next(error)
  }
}

const generateUniqueStudentId = async () => {
  const enrollmentYear = new Date().getFullYear()
  const prefix = `STU-${enrollmentYear}-`
  const counterKey = `student-${enrollmentYear}`

  // Ensure counter document exists; initialize once from database if missing
  let counter = await Counter.findById(counterKey)
  if (!counter) {
    const existingStudents = await Student.find({
      studentId: { $regex: `^${prefix}` },
    }).select('studentId').lean()

    let maxSeq = 0
    for (const s of existingStudents) {
      if (s.studentId) {
        const match = s.studentId.match(new RegExp(`^STU-\\d{4}-(\\d+)`))
        if (match) {
          const val = parseInt(match[1], 10)
          if (!isNaN(val) && val > maxSeq) {
            maxSeq = val
          }
        }
      }
    }

    await Counter.findByIdAndUpdate(
      counterKey,
      { $set: { seq: maxSeq } },
      { upsert: true, new: true }
    )
  }

  let nextSeq = await Counter.getNextSequence(counterKey)
  let candidateId = `${prefix}${String(nextSeq).padStart(4, '0')}`

  // Extra safety check in case of fragmentation or concurrency
  while (await Student.exists({ studentId: candidateId })) {
    nextSeq = await Counter.getNextSequence(counterKey)
    candidateId = `${prefix}${String(nextSeq).padStart(4, '0')}`
  }

  return candidateId
}

const createStudent = async (req, res, next) => {
  try {
    const {
      fullName,
      dob,
      gender,
      classId,
      sectionId,
      guardian,
      bloodGroup,
      bFormNumber,
      nationality,
      religion,
      emergencyContact,
      medicalNotes,
      previousSchool,
      address,
      city,
      fatherName,
      photoUrl,
      joiningDate,
      feeSetup,
    } = req.body

    // Generate guaranteed unique Student ID
    const studentId = await generateUniqueStudentId()

    const student = await Student.create({
      studentId,
      fullName,
      dob,
      gender,
      classId,
      sectionId: sectionId || 'A',
      guardian,
      bloodGroup: bloodGroup || '',
      bFormNumber: bFormNumber || '',
      nationality: nationality || 'Pakistani',
      religion: religion || 'Islam',
      emergencyContact: emergencyContact || { name: '', phone: '', relationship: 'Guardian' },
      medicalNotes: medicalNotes || 'None reported / General fitness',
      previousSchool: previousSchool || '',
      address: address || '',
      city: city || 'Karachi',
      fatherName: fatherName || '',
      photoUrl: photoUrl || '',
      joiningDate: joiningDate || Date.now(),
    })

    // Create user login account for the student
    const studentRole = await Role.findOne({ name: 'student' })
    if (studentRole) {
      const defaultPassword = await bcrypt.hash('Student@1234', BCRYPT_ROUNDS)
      const username = studentId.toLowerCase()
      const existingUser = await User.findOne({ username })
      if (!existingUser) {
        await User.create({
          username,
          passwordHash: defaultPassword,
          role: studentRole._id,
          roleName: 'student',
          studentId: student._id,
          mustChangePassword: true,
        })
      }
    }

    // Process Fee & Concession Setup if provided or active fee structures exist
    const createdFees = []
    const createdPayments = []

    if (feeSetup) {
      let structuresToAssign = []
      if (feeSetup.selectedFeeStructureIds && feeSetup.selectedFeeStructureIds.length > 0) {
        structuresToAssign = await FeeStructure.find({
          _id: { $in: feeSetup.selectedFeeStructureIds },
        })
      } else {
        structuresToAssign = await FeeStructure.find({
          classId: student.classId,
          isActive: true,
        })
      }

      for (const structure of structuresToAssign) {
        let discount = 0
        if (feeSetup.discountType === 'percentage' && Number(feeSetup.discountValue) > 0) {
          discount = Math.round((structure.amount * Math.min(Number(feeSetup.discountValue), 100)) / 100)
        } else if (feeSetup.discountType === 'fixed' && Number(feeSetup.discountValue) > 0) {
          discount = Math.min(Number(feeSetup.discountValue), structure.amount)
        } else if (Number(feeSetup.discountAmount) > 0) {
          discount = Math.min(Number(feeSetup.discountAmount), structure.amount)
        }

        const netAmount = Math.max(0, structure.amount - discount)
        const isPaidUpfront = feeSetup.initialPaymentStatus === 'Paid'
        const amountPaid = isPaidUpfront ? netAmount : 0
        const outstandingAmount = isPaidUpfront ? 0 : netAmount
        const status = isPaidUpfront ? 'Paid' : 'Pending'

        const studentFee = await StudentFee.create({
          studentId: student._id,
          feeStructureId: structure._id,
          amountDue: structure.amount,
          discount,
          concessionType: feeSetup.concessionType || (discount > 0 ? 'Special Management Discount' : 'None'),
          concessionReason: feeSetup.concessionReason || '',
          netAmount,
          amountPaid,
          outstandingAmount,
          dueDate: structure.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status,
        })
        createdFees.push(studentFee)

        if (isPaidUpfront && netAmount > 0) {
          const seq = await Counter.getNextSequence('payment')
          const paymentYear = new Date().getFullYear()
          const receiptNo = `REC-${paymentYear}-${String(seq).padStart(5, '0')}`

          const payment = await Payment.create({
            receiptNo,
            studentFeeId: studentFee._id,
            studentId: student._id,
            amountPaid: netAmount,
            paymentMode: feeSetup.paymentMode || 'Cash',
            referenceNo: feeSetup.referenceNo || '',
            remarks: feeSetup.paymentRemarks || `Upfront admission fee payment (${structure.name})`,
            recordedBy: req.user?._id || studentRole?._id,
          })
          createdPayments.push(payment)
        }
      }
    }

    await logAudit(req, 'STUDENT_CREATED', {
      studentId: student._id,
      name: student.fullName,
      assignedFeesCount: createdFees.length,
      isPaidUpfront: feeSetup?.initialPaymentStatus === 'Paid',
    })

    await invalidateCache('dashboard:stats')

    const primaryPayment = createdPayments[0] || null
    res.status(201).json({
      success: true,
      data: student,
      fees: createdFees,
      payment: primaryPayment,
      payments: createdPayments,
      paymentId: primaryPayment?._id,
      receiptNo: primaryPayment?.receiptNo,
      firstFeeId: createdFees[0]?._id,
    })
  } catch (error) {
    next(error)
  }
}

const updateStudent = async (req, res, next) => {
  try {
    const sanitized = {}
    for (const key of ALLOWED_UPDATE_FIELDS) {
      if (req.body[key] !== undefined) {
        sanitized[key] = req.body[key]
      }
    }

    if (sanitized.sectionId) {
      sanitized.sectionId = sanitized.sectionId.trim().toUpperCase()
      const current = await Student.findOne({ _id: req.params.id, deletedAt: null }).populate('classId')
      if (current && current.classId && Array.isArray(current.classId.sections)) {
        if (!current.classId.sections.includes(sanitized.sectionId)) {
          throw new ApiError(
            400,
            `Section "${sanitized.sectionId}" does not exist in class "${current.classId.name}". Available sections: ${current.classId.sections.join(', ')}`
          )
        }
      }
    }

    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { $set: sanitized },
      { new: true, runValidators: true }
    ).populate('classId')

    if (!student) throw new ApiError(404, 'Student not found')

    await logAudit(req, 'STUDENT_UPDATED', { studentId: student._id, updatedFields: Object.keys(sanitized) })
    res.json({ success: true, data: student })
  } catch (error) {
    next(error)
  }
}

const changeStudentSection = async (req, res, next) => {
  try {
    const { id } = req.params
    const newSection = (req.body.sectionId || req.body.newSectionId || req.body.section || '').trim().toUpperCase()

    if (!newSection) {
      throw new ApiError(400, 'New section identifier is required')
    }

    const student = await Student.findOne({ _id: id, deletedAt: null }).populate('classId')
    if (!student) {
      throw new ApiError(404, 'Student not found')
    }

    const classObj = student.classId
    if (!classObj) {
      throw new ApiError(400, 'Student is not currently assigned to a valid class')
    }

    const availableSections = classObj.sections || []
    if (!availableSections.includes(newSection)) {
      throw new ApiError(
        400,
        `Section "${newSection}" does not exist in class "${classObj.name}". Available sections: ${availableSections.join(', ') || 'None'}`
      )
    }

    if (student.sectionId === newSection) {
      throw new ApiError(400, `Student is already in section "${newSection}" of ${classObj.name}`)
    }

    const oldSection = student.sectionId
    student.sectionId = newSection
    await student.save()

    await logAudit(req, 'STUDENT_SECTION_CHANGED', {
      studentId: student._id,
      studentName: student.fullName,
      classId: classObj._id,
      className: classObj.name,
      oldSection,
      newSection,
      reason: req.body.reason || '',
    })

    res.json({
      success: true,
      message: `Student section successfully changed from "${oldSection}" to "${newSection}" in ${classObj.name}`,
      data: student,
    })
  } catch (error) {
    next(error)
  }
}

const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { deletedAt: new Date(), status: 'Withdrawn' },
      { new: true }
    )
    if (!student) throw new ApiError(404, 'Student not found')

    // Deactivate associated user login account
    await User.findOneAndUpdate(
      { studentId: student._id },
      { isActive: false, deletedAt: new Date() }
    )

    await logAudit(req, 'STUDENT_DELETED', { studentId: student._id })
    await invalidateCache('dashboard:stats')
    res.json({ success: true, message: 'Student marked as withdrawn' })
  } catch (error) {
    next(error)
  }
}

const bulkImportStudents = studentsImport.bulkImportStudents(generateUniqueStudentId)
const downloadImportTemplate = studentsImport.downloadImportTemplate
const importStudentsFromExcel = studentsImport.importStudentsFromExcel(generateUniqueStudentId)

/**
 * Get full data bundle for Student Academic Hub portal
 */
const getStudentPortalData = async (req, res, next) => {
  try {
    let studentId = req.user.studentId
    if (!studentId && req.user.roleName === 'super_admin') {
      if (req.query.studentId) {
        studentId = req.query.studentId
      } else {
        const firstStudent = await Student.findOne({ status: 'Active', deletedAt: null })
        if (firstStudent) studentId = firstStudent._id
      }
    }

    if (!studentId) {
      throw new ApiError(400, 'No linked student record found for this user account')
    }

    const student = await Student.findOne({ _id: studentId, deletedAt: null }).populate('classId')
    if (!student) throw new ApiError(404, 'Student profile not found')

    // 1. Timetable for student's class & section
    const timetable = await TimetableEntry.find({
      classId: student.classId?._id,
      sectionId: student.sectionId,
    })
      .populate('subjectId', 'name code')
      .populate('teacherId', 'fullName staffId')
      .sort({ periodNumber: 1 })

    // 2. Attendance metrics
    const attendanceRecords = await StudentAttendance.find({
      'records.studentId': student._id,
    }).sort({ date: -1 })

    let totalDays = 0
    let presentDays = 0
    let absentDays = 0
    let lateDays = 0
    let excusedDays = 0
    const history = []

    attendanceRecords.forEach((att) => {
      const rec = att.records.find(r => r.studentId && r.studentId.toString() === student._id.toString())
      if (rec) {
        totalDays++
        if (rec.status === 'Present') presentDays++
        else if (rec.status === 'Absent') absentDays++
        else if (rec.status === 'Late') lateDays++
        else if (rec.status === 'Excused') excusedDays++

        history.push({
          date: att.date,
          status: rec.status,
          remarks: rec.remarks || '',
          periodNumber: att.periodNumber,
        })
      }
    })

    const attendanceRate = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 100

    // 3. Exam Grades (published only unless admin)
    const examFilter = { deletedAt: null }
    if (req.user.roleName === 'student') {
      examFilter.isPublished = true
    }
    const publishedExams = await Exam.find(examFilter).select('_id')
    const publishedExamIds = publishedExams.map(e => e._id)

    const grades = await Grade.find({
      studentId: student._id,
      examId: { $in: publishedExamIds },
    })
      .populate({
        path: 'examId',
        populate: [{ path: 'subjectId' }, { path: 'classId' }],
      })
      .sort({ createdAt: -1 })

    // 4. Student Fees & Challans
    const fees = await StudentFee.find({ studentId: student._id })
      .populate('feeStructureId')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: {
        student,
        timetable,
        attendance: {
          summary: {
            totalDays,
            presentDays,
            absentDays,
            lateDays,
            excusedDays,
            rate: attendanceRate,
          },
          history: history.slice(0, 30),
        },
        grades,
        fees,
      },
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  changeStudentSection,
  deleteStudent,
  bulkImportStudents,
  getStudentPortalData,
  downloadImportTemplate,
  importStudentsFromExcel,
}
