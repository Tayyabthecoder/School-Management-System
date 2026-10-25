const Staff = require('../../models/Staff.model')
const User = require('../../models/User.model')
const Role = require('../../models/Role.model')
const LeaveRequest = require('../../models/LeaveRequest.model')
const PayrollRecord = require('../../models/PayrollRecord.model')
const StaffAttendance = require('../../models/StaffAttendance.model')
const SchoolSettings = require('../../models/SchoolSettings.model')
const Counter = require('../../models/Counter.model')
const bcrypt = require('bcryptjs')
const { generatePDFBuffer, buildPayslipPDF } = require('../../utils/pdf.util')
const { getPagination, formatPaginatedResponse } = require('../../utils/pagination.util')
const { logAudit } = require('../../utils/audit-log.util')
const { ApiError } = require('../../middleware/error.middleware')
const { escapeRegex } = require('../../utils/regex.util')
const { BCRYPT_ROUNDS } = require('../../config/constants')
const { getOrSet } = require('../../utils/cache.util')
const { computeNetSalary } = require('./hr.service')

const getStaffList = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query)
    const filter = { deletedAt: null }

    if (req.query.department) filter.department = req.query.department
    if (req.query.search) {
      const safeSearch = escapeRegex(req.query.search)
      filter.$or = [
        { fullName: { $regex: safeSearch, $options: 'i' } },
        { staffId: { $regex: safeSearch, $options: 'i' } },
      ]
    }

    const [staff, total] = await Promise.all([
      Staff.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Staff.countDocuments(filter),
    ])

    res.json(formatPaginatedResponse(staff, total, page, limit))
  } catch (error) {
    next(error)
  }
}

const generateUniqueStaffId = async (joiningDate) => {
  const joiningYear = new Date(joiningDate || Date.now()).getFullYear()
  const prefix = `STF-${joiningYear}-`

  const existingStaff = await Staff.find({
    staffId: { $regex: `^${prefix}` },
  }).select('staffId').lean()

  let maxSeq = 0
  for (const s of existingStaff) {
    if (s.staffId) {
      const match = s.staffId.match(new RegExp(`^STF-\\d{4}-(\\d+)`))
      if (match) {
        const val = parseInt(match[1], 10)
        if (!isNaN(val) && val > maxSeq) {
          maxSeq = val
        }
      }
    }
  }

  const counter = await Counter.findById('staff')
  if (!counter || counter.seq < maxSeq) {
    await Counter.findByIdAndUpdate(
      'staff',
      { $set: { seq: maxSeq } },
      { upsert: true, new: true }
    )
  }

  let nextSeq = await Counter.getNextSequence('staff')
  let candidateId = `${prefix}${String(nextSeq).padStart(3, '0')}`

  while (await Staff.exists({ staffId: candidateId })) {
    nextSeq = await Counter.getNextSequence('staff')
    candidateId = `${prefix}${String(nextSeq).padStart(3, '0')}`
  }

  return candidateId
}

const createStaff = async (req, res, next) => {
  try {
    const { fullName, cnic, phone, email, designation, department, joiningDate, salary } = req.body

    const staffId = await generateUniqueStaffId(joiningDate)

    const staff = await Staff.create({
      staffId,
      fullName,
      cnic,
      phone,
      email,
      designation,
      department,
      joiningDate,
      salary,
    })

    // Assign appropriate user account role
    let roleName = 'teacher'
    if (department.toLowerCase().includes('finance') || designation.toLowerCase().includes('account')) {
      roleName = 'accountant'
    } else if (department.toLowerCase().includes('hr') || designation.toLowerCase().includes('hr')) {
      roleName = 'hr_manager'
    }

    const targetRole = await Role.findOne({ name: roleName })
    if (targetRole) {
      const defaultPassword = await bcrypt.hash('Staff@1234', BCRYPT_ROUNDS)
      await User.create({
        username: staffId.toLowerCase(),
        passwordHash: defaultPassword,
        role: targetRole._id,
        roleName: roleName,
        staffId: staff._id,
        mustChangePassword: true,
      })
    }

    res.status(201).json({ success: true, data: staff })
  } catch (error) {
    next(error)
  }
}

const getLeaveRequests = async (req, res, next) => {
  try {
    const filter = {}
    const isManager = ['super_admin', 'hr_manager'].includes(req.user.roleName)

    if (!isManager) {
      if (!req.user.staffId) {
        throw new ApiError(403, 'Forbidden: No linked staff record found for this user')
      }
      filter.staffId = req.user.staffId
    } else if (req.query.staffId) {
      filter.staffId = req.query.staffId
    }

    if (req.query.status) filter.status = req.query.status

    const leaves = await LeaveRequest.find(filter).populate('staffId').sort({ createdAt: -1 })
    res.json({ success: true, data: leaves })
  } catch (error) {
    next(error)
  }
}

const submitLeaveRequest = async (req, res, next) => {
  try {
    const payload = req.validatedData?.body || req.body
    const isManager = ['super_admin', 'hr_manager'].includes(req.user.roleName)
    const staffId = isManager
      ? (payload.staffId || req.user.staffId)
      : req.user.staffId

    if (!staffId) {
      throw new ApiError(400, 'Staff ID is required to submit a leave request')
    }

    const leave = await LeaveRequest.create({
      ...payload,
      staffId,
      status: 'Pending',
      reviewedBy: null,
      reviewRemarks: '',
    })
    res.status(201).json({ success: true, data: leave })
  } catch (error) {
    next(error)
  }
}

const reviewLeaveRequest = async (req, res, next) => {
  try {
    const { leaveId, status, reviewRemarks } = req.body
    const leave = await LeaveRequest.findByIdAndUpdate(
      leaveId,
      { status, reviewRemarks, reviewedBy: req.user._id },
      { new: true }
    )

    await logAudit({
      req,
      action: 'REVIEW_LEAVE_REQUEST',
      module: 'hr',
      documentId: leaveId,
      newValues: { status, reviewRemarks },
    })

    res.json({ success: true, data: leave })
  } catch (error) {
    next(error)
  }
}

const runPayroll = async (req, res, next) => {
  try {
    const { month, year, applyIncomeTax, applyEobi, applySessi } = req.body
    const activeStaff = await Staff.find({ isActive: true, deletedAt: null })

    const records = []
    for (const staff of activeStaff) {
      const existing = await PayrollRecord.findOne({ staffId: staff._id, month, year })
      if (existing && existing.status === 'Finalized') {
        records.push(existing)
        continue
      }

      // Calculate absent days from StaffAttendance
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)
      endDate.setHours(23, 59, 59, 999)

      const absentCount = await StaffAttendance.countDocuments({
        staffId: staff._id,
        status: 'Absent',
        date: { $gte: startDate, $lte: endDate },
      })

      const perDaySalary = Math.round(staff.salary / 30)
      const absentDeduction = absentCount * perDaySalary
      const salaryDetails = computeNetSalary({
        basicPay: staff.salary,
        allowances: staff.allowances || 0,
        absentDeduction,
        otherDeductions: staff.deductions || 0,
        applyIncomeTax: !!applyIncomeTax,
        applyEobi: applyEobi !== undefined ? !!applyEobi : true,
        applySessi: !!applySessi,
      })

      const record = await PayrollRecord.findOneAndUpdate(
        { staffId: staff._id, month, year },
        {
          basicPay: staff.salary,
          allowances: staff.allowances || 0,
          absentDaysDeduction: absentDeduction,
          otherDeductions: staff.deductions || 0,
          incomeTax: salaryDetails.incomeTax,
          eobi: salaryDetails.eobi,
          sessi: salaryDetails.sessi,
          providentFund: salaryDetails.providentFund,
          netPay: salaryDetails.netPay,
          status: 'Draft',
          generatedBy: req.user._id,
        },
        { upsert: true, new: true }
      )
      records.push(record)
    }

    res.json({ success: true, count: records.length, data: records })
  } catch (error) {
    next(error)
  }
}

const finalizePayroll = async (req, res, next) => {
  try {
    const { month, year } = req.body
    const result = await PayrollRecord.updateMany(
      { month, year, status: 'Draft' },
      { $set: { status: 'Finalized' } }
    )

    await logAudit({
      req,
      action: 'PAYROLL_FINALIZED',
      module: 'hr',
      newValues: { month, year, finalizedCount: result.modifiedCount },
    })

    res.json({ success: true, message: `${result.modifiedCount} payroll records finalized` })
  } catch (error) {
    next(error)
  }
}

const getPayrollRecords = async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.month) filter.month = parseInt(req.query.month, 10)
    if (req.query.year) filter.year = parseInt(req.query.year, 10)
    if (req.query.staffId) filter.staffId = req.query.staffId

    const records = await PayrollRecord.find(filter).populate('staffId').sort({ createdAt: -1 })
    res.json({ success: true, data: records })
  } catch (error) {
    next(error)
  }
}

const downloadPayslipPDF = async (req, res, next) => {
  try {
    const record = await PayrollRecord.findById(req.params.id).populate('staffId')
    if (!record) throw new ApiError(404, 'Payroll record not found')

    // Non-admin roles can only download their own payslip
    const elevatedRoles = ['super_admin', 'hr_manager', 'accountant']
    if (!elevatedRoles.includes(req.user.roleName)) {
      if (!req.user.staffId || record.staffId?._id?.toString() !== req.user.staffId.toString()) {
        throw new ApiError(403, 'Forbidden: You can only download your own payslip')
      }
    }

    const settings = await getOrSet('ref:school-settings', 300, async () => {
      return SchoolSettings.findOne({ isActive: true }).lean()
    })
    const branding = settings || {}

    const pdfBuffer = await generatePDFBuffer((doc) => {
      buildPayslipPDF(doc, {
        staffName: record.staffId ? record.staffId.fullName : 'N/A',
        staffId: record.staffId ? record.staffId.staffId : 'N/A',
        designation: record.staffId ? record.staffId.designation : 'Staff',
        month: record.month,
        year: record.year,
        basicPay: record.basicPay,
        allowances: record.allowances,
        absentDaysDeduction: record.absentDaysDeduction,
        otherDeductions: record.otherDeductions,
        incomeTax: record.incomeTax || 0,
        eobi: record.eobi || 0,
        sessi: record.sessi || 0,
        providentFund: record.providentFund || 0,
        netPay: record.netPay,
      }, branding)
    })

    const staffIdStr = record.staffId?.staffId || record._id
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=Payslip_${staffIdStr}_${record.month}_${record.year}.pdf`)
    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getStaffList,
  createStaff,
  getLeaveRequests,
  submitLeaveRequest,
  reviewLeaveRequest,
  runPayroll,
  finalizePayroll,
  getPayrollRecords,
  downloadPayslipPDF,
}
