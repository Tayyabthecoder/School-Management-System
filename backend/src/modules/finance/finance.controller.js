const mongoose = require('mongoose')
const FeeStructure = require('../../models/FeeStructure.model')
const StudentFee = require('../../models/StudentFee.model')
const Payment = require('../../models/Payment.model')
const Student = require('../../models/Student.model')
const AcademicYear = require('../../models/AcademicYear.model')
const ChallanSettings = require('../../models/ChallanSettings.model')
const SchoolSettings = require('../../models/SchoolSettings.model')
const Counter = require('../../models/Counter.model')
const { generatePDFBuffer, buildPaymentReceiptPDF, buildFeeChallanPDF, DEFAULT_CHALLAN_SETTINGS } = require('../../utils/pdf.util')
const { getPagination, formatPaginatedResponse } = require('../../utils/pagination.util')
const { getGuardianStudentIds, isStudentAccessibleByGuardian } = require('../../utils/guardian-auth.util')
const { logAudit } = require('../../utils/audit-log.util')
const { ApiError } = require('../../middleware/error.middleware')
const { validateObjectId } = require('../../utils/validation.util')
const { escapeRegex } = require('../../utils/regex.util')
const { invalidateCache, getOrSet } = require('../../utils/cache.util')
const { broadcast } = require('../reports/sse.controller')
const {
  generateMonthlyFeeChallans,
  getMonthlyChallansStatus,
} = require('../../services/monthly-challan.service')
const { validatePayment, applyDiscountToFeeRecord, calculateNetFee } = require('./finance.service')

const withOptionalTransaction = async (workFn) => {
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    return workFn(null)
  }
  let session = null
  try {
    if (mongoose && typeof mongoose.startSession === 'function') {
      session = await mongoose.startSession().catch(() => null)
    }
    if (session) {
      session.startTransaction()
    }
    const result = await workFn(session)
    if (session && typeof session.inTransaction === 'function' && session.inTransaction()) {
      // A failed commit means nothing was persisted: surface it instead of returning success.
      await session.commitTransaction()
    }
    return result
  } catch (err) {
    if (session && typeof session.inTransaction === 'function' && session.inTransaction()) {
      await session.abortTransaction().catch(() => {})
    }
    if (err.message && (err.message.includes('replica set') || err.message.includes('Transactions are not supported'))) {
      return await workFn(null)
    }
    throw err
  } finally {
    if (session && typeof session.endSession === 'function') {
      session.endSession().catch(() => {})
    }
  }
}

/**
 * Students may only open their own fee documents; guardians may open those of any
 * linked child (user.studentId and user.studentIds). Staff roles are already scoped by RBAC.
 */
const assertOwnFeeDocument = (user, studentRef, label) => {
  if (!['student', 'guardian'].includes(user.roleName)) return
  const ownerId = studentRef?._id || studentRef
  if (!ownerId) {
    throw new ApiError(403, `Forbidden: You can only view your own ${label}`)
  }
  if (user.roleName === 'student') {
    if (!user.studentId || user.studentId.toString() !== ownerId.toString()) {
      throw new ApiError(403, `Forbidden: You can only view your own ${label}`)
    }
    return
  }
  if (!isStudentAccessibleByGuardian(user, ownerId)) {
    throw new ApiError(403, `Forbidden: You can only view the ${label} of your own children`)
  }
}

const getFeeStructures = async (req, res, next) => {
  try {
    const filter = { isActive: true }
    if (req.query.academicYearId) {
      validateObjectId(req.query.academicYearId, 'academicYearId')
      filter.academicYearId = req.query.academicYearId
    } else if (req.query.allYears !== 'true') {
      const activeYear = await AcademicYear.findOne({ isActive: true })
      if (activeYear) filter.academicYearId = activeYear._id
    }
    if (req.query.classId) {
      validateObjectId(req.query.classId, 'classId')
      filter.classId = req.query.classId
    }

    const structures = await FeeStructure.find(filter).populate('classId').populate('academicYearId')
    res.json({ success: true, data: structures })
  } catch (error) {
    next(error)
  }
}

const createFeeStructure = async (req, res, next) => {
  try {
    const payload = { ...req.body }
    if (!payload.title) payload.title = `${payload.feeType} Fee`
    if (!payload.academicYearId) {
      const activeYear = await AcademicYear.findOne({ isActive: true })
      if (activeYear) payload.academicYearId = activeYear._id
    }
    const structure = await FeeStructure.create(payload)

    // Auto-assign fee structure to all students in the class
    const students = await Student.find({ classId: structure.classId, status: 'Active' })
    const studentFees = students.map(s => ({
      studentId: s._id,
      feeStructureId: structure._id,
      amountDue: structure.amount,
      discount: 0,
      netAmount: structure.amount,
      amountPaid: 0,
      outstandingAmount: structure.amount,
      dueDate: structure.dueDate,
      status: 'Pending',
    }))

    if (studentFees.length > 0) {
      await StudentFee.insertMany(studentFees)
    }

    await invalidateCache('dashboard:stats')

    res.status(201).json({ success: true, data: structure, assignedCount: studentFees.length })
  } catch (error) {
    next(error)
  }
}

const getStudentFees = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query)
    const filter = {}

    const adminRoles = ['super_admin', 'accountant', 'hr_manager']

    if (req.user.roleName === 'student') {
      if (!req.user.studentId) throw new ApiError(403, 'No linked student record found')
      filter.studentId = req.user.studentId
    } else if (req.user.roleName === 'guardian') {
      const allowedChildIds = getGuardianStudentIds(req.user)
      if (allowedChildIds.length === 0) {
        throw new ApiError(403, 'No linked student record found')
      }
      if (req.query.studentId) {
        const requested = req.query.studentId.toString()
        if (!allowedChildIds.includes(requested)) {
          throw new ApiError(403, 'Forbidden: You can only view fee records for your own children')
        }
        filter.studentId = requested
      } else {
        filter.studentId = { $in: allowedChildIds }
      }
    } else if (adminRoles.includes(req.user.roleName)) {
      if (req.query.studentId) filter.studentId = req.query.studentId
      if (req.query.classId || req.query.sectionId) {
        const studentQuery = { status: 'Active' }
        if (req.query.classId) studentQuery.classId = req.query.classId
        if (req.query.sectionId) studentQuery.sectionId = req.query.sectionId
        const matchingStudents = await Student.find(studentQuery).select('_id')
        const studentIds = matchingStudents.map(s => s._id)
        if (filter.studentId) {
          filter.studentId = { $in: studentIds.filter(id => id.toString() === filter.studentId.toString()) }
        } else {
          filter.studentId = { $in: studentIds }
        }
      }
      if (req.query.search && req.query.search.trim()) {
        const queryTerm = req.query.search.trim()
        const searchRegex = new RegExp(escapeRegex(queryTerm), 'i')

        const studentMatches = await Student.find({
          $or: [
            { fullName: searchRegex },
            { studentId: searchRegex },
            { 'guardian.name': searchRegex },
            { guardianName: searchRegex },
          ],
        }).select('_id')
        const matchedStudentIds = studentMatches.map(s => s._id)

        const cleanSuffix = escapeRegex(queryTerm.replace(/^CHL(-\d{4})?-/i, ''))
        const searchConditions = []

        if (matchedStudentIds.length > 0) {
          searchConditions.push({ studentId: { $in: matchedStudentIds } })
        }

        if (mongoose.Types.ObjectId.isValid(queryTerm)) {
          searchConditions.push({ _id: new mongoose.Types.ObjectId(queryTerm) })
        }

        if (cleanSuffix.length >= 3 && cleanSuffix.length <= 24) {
          searchConditions.push({
            $expr: {
              $regexMatch: {
                input: { $toString: '$_id' },
                regex: cleanSuffix,
                options: 'i',
              },
            },
          })
        }

        if (searchConditions.length > 0) {
          filter.$or = searchConditions
        } else {
          filter._id = new mongoose.Types.ObjectId()
        }
      }
    } else {
      throw new ApiError(403, 'Forbidden: Insufficient permissions to view student fees')
    }
    if (req.query.status) filter.status = req.query.status
    if (req.query.academicYearId) {
      const structures = await FeeStructure.find({ academicYearId: req.query.academicYearId }).select('_id')
      filter.feeStructureId = { $in: structures.map(s => s._id) }
    }

    const [fees, total] = await Promise.all([
      StudentFee.find(filter)
        .populate({
          path: 'studentId',
          populate: { path: 'classId' },
        })
        .populate('feeStructureId')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      StudentFee.countDocuments(filter),
    ])

    res.json(formatPaginatedResponse(fees, total, page, limit))
  } catch (error) {
    next(error)
  }
}

const recordPayment = async (req, res, next) => {
  try {
    const { studentFeeId, amountPaid, paymentMode, referenceNo, remarks } = req.body
    const feeRecord = await StudentFee.findById(studentFeeId).populate('studentId')
    validatePayment(feeRecord, amountPaid)

    const seq = await Counter.getNextSequence('payment')
    const paymentYear = new Date().getFullYear()
    const receiptNo = `REC-${paymentYear}-${String(seq).padStart(5, '0')}`

    // Atomic conditional decrement within optional transaction
    const { payment, updatedFee } = await withOptionalTransaction(async (session) => {
      const opts = session ? { session } : {}
      const updated = await StudentFee.findOneAndUpdate(
        { _id: studentFeeId, outstandingAmount: { $gte: amountPaid } },
        { $inc: { amountPaid: amountPaid, outstandingAmount: -amountPaid } },
        { new: true, ...opts }
      )

      if (!updated) {
        throw new ApiError(400, 'Payment exceeds outstanding balance or was modified concurrently')
      }

      updated.status = updated.outstandingAmount <= 0 ? 'Paid' : 'Partial'
      await updated.save(opts)

      const paymentDoc = {
        receiptNo,
        studentFeeId,
        studentId: feeRecord.studentId._id,
        amountPaid,
        paymentMode: paymentMode || 'Cash',
        referenceNo: referenceNo || '',
        remarks: remarks || '',
        recordedBy: req.user._id,
      }
      // The receipt must join the same transaction as the balance decrement; Model.create
      // only accepts a session via the array form, so a bare object would commit outside it.
      const pmt = session
        ? await Payment.create([paymentDoc], opts)
        : await Payment.create(paymentDoc)

      return { payment: Array.isArray(pmt) ? pmt[0] : pmt, updatedFee: updated }
    })

    await logAudit({
      req,
      action: 'PAYMENT_RECORDED',
      module: 'finance',
      documentId: payment._id,
      newValues: {
        receiptNo,
        amountPaid,
        studentFeeId,
        studentId: feeRecord.studentId._id,
      },
    })

    await Promise.all([
      invalidateCache('dashboard:stats'),
      invalidateCache('reports:cashflow-forecast'),
      invalidateCache('reports:payment-velocity'),
    ])

    broadcast('fee:paid', { studentId: feeRecord.studentId._id, amountPaid })

    res.status(201).json({ success: true, data: { payment, feeRecord: updatedFee } })
  } catch (error) {
    next(error)
  }
}

const downloadReceiptPDF = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate({ path: 'studentId', populate: { path: 'classId' } })
      .populate('studentFeeId')

    if (!payment) throw new ApiError(404, 'Payment receipt not found')

    assertOwnFeeDocument(req.user, payment.studentId, 'payment receipt')

    const settings = await getOrSet('ref:school-settings', 300, async () => {
      return SchoolSettings.findOne({ isActive: true }).lean()
    })
    const branding = settings || {}

    const pdfBuffer = await generatePDFBuffer((doc) => {
      buildPaymentReceiptPDF(doc, {
        receiptNo: payment.receiptNo,
        paymentDate: payment.paymentDate,
        studentName: payment.studentId ? payment.studentId.fullName : 'N/A',
        studentId: payment.studentId ? payment.studentId.studentId : 'N/A',
        className: payment.studentId && payment.studentId.classId ? payment.studentId.classId.name : 'N/A',
        amountPaid: payment.amountPaid,
        paymentMode: payment.paymentMode,
        outstandingAmount: payment.studentFeeId ? payment.studentFeeId.outstandingAmount : 0,
      }, branding)
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=Receipt_${payment.receiptNo}.pdf`)
    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
}

const CHALLAN_GRACE_DAYS = 10

/**
 * The first download of a challan that is not yet due gives the payer CHALLAN_GRACE_DAYS
 * from the download. It never applies to a fee that is paid, already overdue, already past
 * its due date or already issued, so downloading can't be used to reset a deadline (DATA-02).
 */
const resolveChallanDueDate = (feeRecord, now = new Date()) => {
  const graceDueDate = new Date(now.getTime() + CHALLAN_GRACE_DAYS * 24 * 60 * 60 * 1000)
  graceDueDate.setHours(23, 59, 59, 999)

  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const currentDue = feeRecord.dueDate ? new Date(feeRecord.dueDate) : null

  const neverIssued = !feeRecord.challanDownloadCount
  const notYetDue = !currentDue || currentDue >= startOfToday
  const eligible = neverIssued && notYetDue && !['Paid', 'Overdue'].includes(feeRecord.status)

  if (!eligible) return { dueDate: currentDue || graceDueDate, extended: false }
  // Only ever move the deadline later, never earlier than what was already promised.
  if (currentDue && currentDue >= graceDueDate) return { dueDate: currentDue, extended: false }
  return { dueDate: graceDueDate, extended: true }
}

const downloadChallanPDF = async (req, res, next) => {
  try {
    const feeRecord = await StudentFee.findById(req.params.feeId)
      .populate({
        path: 'studentId',
        populate: { path: 'classId' },
      })
      .populate('feeStructureId')

    if (!feeRecord) throw new ApiError(404, 'Student fee record not found')

    assertOwnFeeDocument(req.user, feeRecord.studentId, 'fee challan')

    const downloadDate = new Date()
    // Issuing a challan (first-issue due-date grace, download counters) changes fee records, so only
    // finance staff do it. Students/guardians downloading a copy get a read-only render, which also
    // stops a GET from being replayed or prefetched to move a deadline.
    const issuesChallan = ['super_admin', 'accountant'].includes(req.user?.roleName)
    let nextDueDate
    if (issuesChallan) {
      const resolved = resolveChallanDueDate(feeRecord, downloadDate)
      nextDueDate = resolved.dueDate
      if (resolved.extended) {
        feeRecord.dueDate = nextDueDate
        feeRecord.effectiveDueDate = nextDueDate
      }
      if (!feeRecord.effectiveDueDate) {
        feeRecord.effectiveDueDate = feeRecord.dueDate || nextDueDate
      }
      feeRecord.challanDownloadedAt = downloadDate
      feeRecord.challanDownloadCount = (feeRecord.challanDownloadCount || 0) + 1
      await feeRecord.save()
      await invalidateCache('dashboard:stats')
    } else {
      nextDueDate = feeRecord.effectiveDueDate || feeRecord.dueDate || downloadDate
    }
    const dynamicDueDate = nextDueDate

    // Read active customizable settings
    const challanSettings = (await ChallanSettings.findOne({ isActive: true }).sort({ updatedAt: -1 })) || DEFAULT_CHALLAN_SETTINGS

    const displayDueDate = feeRecord.effectiveDueDate || feeRecord.dueDate || dynamicDueDate
    const challanYear = displayDueDate.getFullYear()
    const challanNo = `CHL-${challanYear}-${feeRecord._id.toString().slice(-6).toUpperCase()}`
    const student = feeRecord.studentId || {}
    const guardian = student.guardian?.name || (student.parentGuardians && student.parentGuardians[0] && student.parentGuardians[0].fullName) || student.guardianName || 'Guardian of Student'

    const pdfBuffer = await generatePDFBuffer(
      (doc) => {
        buildFeeChallanPDF(
          doc,
          {
            challanNo,
            issueDate: downloadDate.toLocaleDateString('en-GB'),
            dueDate: displayDueDate.toLocaleDateString('en-GB'),
            monthYear: new Date(feeRecord.dueDate || displayDueDate).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
            studentName: student.fullName || 'N/A',
            studentId: student.studentId || 'N/A',
            className: student.classId?.name || 'Class',
            sectionId: student.sectionId || 'A',
            guardianName: guardian,
            feeTitle: feeRecord.feeStructureId?.title || 'Monthly Tuition Fee',
            amountDue: feeRecord.amountDue,
            discount: feeRecord.discount || 0,
            concessionType: feeRecord.concessionType || 'None',
            netAmount: feeRecord.netAmount,
            amountPaid: feeRecord.amountPaid || 0,
            outstandingAmount: feeRecord.outstandingAmount,
            status: feeRecord.status,
          },
          challanSettings
        )
      },
      { size: 'A4', layout: 'landscape', margin: 15 }
    )

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=Fee_Challan_${challanNo}.pdf`)
    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
}

const applyConcession = async (req, res, next) => {
  try {
    const { studentFeeId, discountAmount, concessionType, concessionReason } = req.body
    // Optimistic retry: save only if amountPaid is unchanged since we read it, so a payment
    // recorded concurrently is never overwritten by a stale outstanding amount.
    let feeRecord = null
    for (let attempt = 0; attempt < 3; attempt++) {
      feeRecord = await StudentFee.findById(studentFeeId).populate({
        path: 'studentId',
        populate: { path: 'classId' },
      })
      if (!feeRecord) throw new ApiError(404, 'Student fee record not found')

      applyDiscountToFeeRecord(feeRecord, discountAmount, concessionType, concessionReason)
      feeRecord.$where = { amountPaid: feeRecord.amountPaid }
      try {
        await feeRecord.save()
        break
      } catch (saveErr) {
        if (saveErr.name !== 'DocumentNotFoundError' || attempt === 2) throw saveErr
      }
    }

    await logAudit({
      req,
      action: 'CONCESSION_APPLIED',
      module: 'finance',
      documentId: feeRecord._id,
      newValues: {
        studentFeeId,
        discountAmount: feeRecord.discount,
        concessionType: feeRecord.concessionType,
        concessionReason: feeRecord.concessionReason,
        netAmount: feeRecord.netAmount,
        outstandingAmount: feeRecord.outstandingAmount,
      },
    })

    res.json({
      success: true,
      message: 'Concession applied successfully',
      data: feeRecord,
    })
  } catch (error) {
    next(error)
  }
}

const getChallanSettings = async (req, res, next) => {
  try {
    const settings = await getOrSet('ref:challan-settings', 120, async () => {
      let doc = await ChallanSettings.findOne({ isActive: true }).sort({ updatedAt: -1 })
      return doc || DEFAULT_CHALLAN_SETTINGS
    })
    res.json({ success: true, data: settings })
  } catch (error) {
    next(error)
  }
}

const updateChallanSettings = async (req, res, next) => {
  try {
    const payload = req.body
    let settings = await ChallanSettings.findOne({ isActive: true }).sort({ updatedAt: -1 })

    if (settings) {
      if (Array.isArray(payload.paymentMethods)) settings.paymentMethods = payload.paymentMethods
      if (Array.isArray(payload.instructions)) settings.instructions = payload.instructions
      if (Array.isArray(payload.particulars)) settings.particulars = payload.particulars
      if (Array.isArray(payload.copies)) settings.copies = payload.copies
      if (payload.instituteName !== undefined) settings.instituteName = payload.instituteName
      if (payload.subHeader !== undefined) settings.subHeader = payload.subHeader
      if (payload.layout !== undefined) settings.layout = payload.layout
      if (payload.lateFeeSurcharge !== undefined) settings.lateFeeSurcharge = payload.lateFeeSurcharge
      if (payload.signatories !== undefined) settings.signatories = payload.signatories
      settings.markModified('paymentMethods')
      settings.markModified('instructions')
      settings.markModified('particulars')
      settings.markModified('copies')
      await settings.save()
    } else {
      const allowed = ['paymentMethods', 'instructions', 'particulars', 'copies', 'instituteName',
        'subHeader', 'layout', 'lateFeeSurcharge', 'signatories']
      const data = {}
      for (const key of allowed) if (payload[key] !== undefined) data[key] = payload[key]
      settings = await ChallanSettings.create({ ...data, isActive: true })
    }

    await invalidateCache('ref:challan-settings')

    await logAudit({
      req,
      action: 'UPDATE_CHALLAN_SETTINGS',
      module: 'finance',
      documentId: settings._id,
      newValues: {
        layout: settings.layout,
        instituteName: settings.instituteName,
        lateFeeSurcharge: settings.lateFeeSurcharge,
      },
    })

    res.json({
      success: true,
      message: 'Fee Challan customization settings saved successfully',
      data: settings,
    })
  } catch (error) {
    next(error)
  }
}

const assignFeeToStudent = async (req, res, next) => {
  try {
    const { studentId, feeStructureId, discount = 0, concessionType, concessionReason, dueDate } = req.body
    const student = await Student.findById(studentId)
    if (!student) throw new ApiError(404, 'Student not found')

    const structure = await FeeStructure.findById(feeStructureId)
    if (!structure) throw new ApiError(404, 'Fee structure not found')

    const amountDue = structure.amount
    const numDiscount = Number(discount) || 0
    if (numDiscount > amountDue) {
      throw new ApiError(400, `Discount (PKR ${numDiscount}) cannot exceed fee amount (PKR ${amountDue})`)
    }

    const { netAmount } = calculateNetFee(amountDue, numDiscount)
    const effectiveDueDate = dueDate || structure.dueDate

    const studentFee = await StudentFee.create({
      studentId: student._id,
      feeStructureId: structure._id,
      amountDue,
      discount: numDiscount,
      concessionType: numDiscount === 0 ? 'None' : (concessionType || 'Special Management Discount'),
      concessionReason: numDiscount === 0 ? '' : (concessionReason || ''),
      netAmount,
      amountPaid: 0,
      outstandingAmount: netAmount,
      dueDate: effectiveDueDate,
      status: netAmount === 0 ? 'Paid' : 'Pending',
    })

    await logAudit({
      req,
      action: 'FEE_ASSIGNED_TO_STUDENT',
      module: 'finance',
      documentId: studentFee._id,
      newValues: {
        studentId: student._id,
        feeStructureId: structure._id,
        amountDue,
        discount: numDiscount,
        netAmount,
      },
    })

    const populatedFee = await StudentFee.findById(studentFee._id)
      .populate('feeStructureId')
      .populate({ path: 'studentId', populate: { path: 'classId' } })

    res.status(201).json({ success: true, message: 'Fee assigned to student successfully', data: populatedFee })
  } catch (error) {
    next(error)
  }
}

const triggerMonthlyChallansManually = async (req, res, next) => {
  try {
    const { targetDate, academicYearId, force } = req.body
    const result = await generateMonthlyFeeChallans({
      targetDate: targetDate || new Date(),
      academicYearId,
      // User documents carry `username` (no fullName/email), which previously logged "undefined (...)".
      executedBy: req.user ? `${req.user.username || 'unknown'} (${req.user.roleName || 'admin'})` : 'MANUAL_ADMIN',
      force: Boolean(force),
    })

    broadcast('challans:generated', {
      month: result.month,
      year: result.year,
      count: result.generatedCount,
    })

    res.json({
      success: true,
      message: `Successfully processed monthly fee challans for ${result.month} ${result.year}`,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

const getMonthlyChallansCronStatus = async (req, res, next) => {
  try {
    const status = await getMonthlyChallansStatus()
    res.json({
      success: true,
      data: status,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getFeeStructures,
  createFeeStructure,
  getStudentFees,
  recordPayment,
  downloadReceiptPDF,
  downloadChallanPDF,
  resolveChallanDueDate,
  applyConcession,
  getChallanSettings,
  updateChallanSettings,
  assignFeeToStudent,
  triggerMonthlyChallansManually,
  getMonthlyChallansCronStatus,
}


