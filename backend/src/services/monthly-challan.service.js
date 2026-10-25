const FeeStructure = require('../models/FeeStructure.model')
const StudentFee = require('../models/StudentFee.model')
const Student = require('../models/Student.model')
const Class = require('../models/Class.model')
const AcademicYear = require('../models/AcademicYear.model')
const { invalidateCache } = require('../utils/cache.util')
const { logAudit } = require('../utils/audit-log.util')

/**
 * Standard default tuition fees for classes if no previous fee structure exists
 */
const DEFAULT_CLASS_TUITION = {
  'Play Jouior': 8000,
  'Play Junior': 8000,
  'Grade 1': 8500,
  'Grade 2': 9000,
  'Grade 3': 9500,
  'Grade 4': 10000,
  'Grade 5': 10500,
  'Grade 6': 11000,
  'Grade 7': 11500,
  'Grade 8': 12000,
  'Grade 9': 12500,
  'Grade 10': 13000,
  'Grade 11': 13500,
  'Grade 12': 14000,
}

const getDefaultTuitionForClass = (className, level = 1) => {
  if (DEFAULT_CLASS_TUITION[className]) {
    return DEFAULT_CLASS_TUITION[className]
  }
  const numericLevel = level !== undefined && level !== null && !isNaN(Number(level)) ? Number(level) : 1
  if (numericLevel <= 0) return 8000
  return 8000 + (numericLevel * 500)
}

/**
 * Automatically generate monthly student fee challans for a given target date.
 * Typically runs on the 1st of every month at midnight.
 *
 * @param {Object} options
 * @param {Date|string} [options.targetDate=new Date()] - The reference date for the monthly fee cycle
 * @param {string} [options.academicYearId] - Optional academic year ID override
 * @param {string} [options.executedBy='CRON_SYSTEM'] - Identifier for audit logging
 * @param {boolean} [options.force=false] - If true, re-generates even if already generated
 * @returns {Promise<Object>} Summary of generated challans
 */
const generateMonthlyFeeChallans = async ({
  targetDate = new Date(),
  academicYearId = null,
  executedBy = 'CRON_SYSTEM',
  force = false,
} = {}) => {
  const refDate = targetDate instanceof Date ? targetDate : new Date(targetDate)
  if (isNaN(refDate.getTime())) {
    throw new Error('Invalid target date provided for monthly fee generation')
  }

  const targetYear = refDate.getFullYear()
  const targetMonthIndex = refDate.getMonth()
  const monthName = refDate.toLocaleString('en-US', { month: 'long' })

  // Standard monthly cycle dates:
  // Month start: 1st of month at 00:00:00
  const monthStart = new Date(targetYear, targetMonthIndex, 1, 0, 0, 0, 0)
  // Month end: last day of month at 23:59:59
  const monthEnd = new Date(targetYear, targetMonthIndex + 1, 0, 23, 59, 59, 999)
  // Initial cycle due date is set 10 days from generation.
  // When the student/guardian/admin downloads the fee challan, the due date automatically
  // updates to fall exactly 10 days after the download date.
  const targetDueDate = new Date(refDate.getTime() + 10 * 24 * 60 * 60 * 1000)
  targetDueDate.setHours(23, 59, 59, 999)

  // 1. Resolve Academic Year
  let activeYear = null
  if (academicYearId) {
    activeYear = await AcademicYear.findById(academicYearId)
  }
  if (!activeYear || !activeYear._id) {
    activeYear = await AcademicYear.findOne({ isActive: true })
  }
  if (!activeYear || !activeYear._id) {
    const fallbackQuery = AcademicYear.findOne()
    activeYear = fallbackQuery && typeof fallbackQuery.sort === 'function'
      ? await fallbackQuery.sort({ year: -1 })
      : await fallbackQuery
  }
  if (!activeYear || !activeYear._id) {
    throw new Error('No active academic year found in system')
  }

  // 2. Fetch all active classes
  const classesQuery = Class.find({ isActive: true })
  const classes = classesQuery && typeof classesQuery.sort === 'function'
    ? await classesQuery.sort({ level: 1 })
    : await classesQuery

  if (!classes || classes.length === 0) {
    return {
      success: true,
      month: monthName,
      year: targetYear,
      generatedCount: 0,
      skippedCount: 0,
      totalEligibleStudents: 0,
      message: 'No active classes found',
    }
  }

  // 3. Ensure a Tuition FeeStructure exists for each class for this month
  const classStructures = {}
  for (const cls of classes) {
    let structure = await FeeStructure.findOne({
      classId: cls._id,
      feeType: 'Tuition',
      academicYearId: activeYear._id,
      $or: [
        { dueDate: { $gte: monthStart, $lte: monthEnd } },
        { title: new RegExp(`${monthName}\\s+${targetYear}`, 'i') },
      ],
    })

    if (!structure || !structure._id) {
      // Find the most recent tuition fee structure for this class to preserve class pricing
      let prevStructure = null
      try {
        const query = FeeStructure.findOne({
          classId: cls._id,
          feeType: 'Tuition',
        })
        prevStructure = query && typeof query.sort === 'function' ? await query.sort({ createdAt: -1 }) : await query
      } catch (err) {
        prevStructure = null
      }

      const baseAmount = prevStructure && prevStructure.amount ? prevStructure.amount : getDefaultTuitionForClass(cls.name, cls.level)

      structure = await FeeStructure.create({
        title: `${cls.name} Monthly Tuition Fee - ${monthName} ${targetYear}`,
        feeType: 'Tuition',
        classId: cls._id,
        amount: baseAmount,
        dueDate: targetDueDate,
        academicYearId: activeYear._id,
        description: `Automated monthly tuition fee challan for ${cls.name} (${monthName} ${targetYear})`,
        isActive: true,
      })
    }

    classStructures[cls._id.toString()] = structure
  }

  // 4. Fetch all active students
  const studentQuery = Student.find({
    status: 'Active',
    deletedAt: null,
  })
  const students = studentQuery && typeof studentQuery.populate === 'function'
    ? await studentQuery.populate('classId')
    : await studentQuery

  if (!students || students.length === 0) {
    return {
      success: true,
      month: monthName,
      year: targetYear,
      dueDate: targetDueDate,
      generatedCount: 0,
      skippedCount: 0,
      totalEligibleStudents: 0,
      message: 'No active students found to bill',
    }
  }

  // 5. Check existing student fee challans for this month to guarantee idempotency
  const structureIds = Object.values(classStructures).map((s) => s._id)
  const existingFeesQuery = StudentFee.find({
    studentId: { $in: students.map((s) => s._id) },
    feeStructureId: { $in: structureIds },
  })
  const existingFees = existingFeesQuery && typeof existingFeesQuery.select === 'function'
    ? await existingFeesQuery.select('studentId feeStructureId dueDate')
    : (await existingFeesQuery || [])

  const existingStudentIds = new Set((existingFees || []).map((f) => (f.studentId?._id || f.studentId || '').toString()))

  // 6. Preload recent concessions for active students to preserve scholarships and discounts
  const studentsToGenerate = force
    ? students
    : students.filter((s) => !existingStudentIds.has(s._id.toString()))

  const skippedCount = students.length - studentsToGenerate.length

  if (studentsToGenerate.length === 0) {
    return {
      success: true,
      month: monthName,
      year: targetYear,
      dueDate: targetDueDate,
      totalEligibleStudents: students.length,
      generatedCount: 0,
      skippedCount,
      message: `All ${students.length} active students already have fee challans generated for ${monthName} ${targetYear}`,
      timestamp: new Date(),
    }
  }

  // Fetch recent student fees that had discounts to copy concession type and percentage
  const discountQuery = StudentFee.find({
    studentId: { $in: studentsToGenerate.map((s) => s._id) },
    discount: { $gt: 0 },
  })
  const historicalFeesWithDiscount = discountQuery && typeof discountQuery.sort === 'function'
    ? await discountQuery.sort({ createdAt: -1 })
    : (await discountQuery || [])

  // Map studentId -> latest discount info
  const studentConcessionMap = new Map()
  for (const prevFee of (historicalFeesWithDiscount || [])) {
    const sId = (prevFee.studentId?._id || prevFee.studentId || '').toString()
    if (!studentConcessionMap.has(sId)) {
      studentConcessionMap.set(sId, {
        discountAmount: prevFee.discount,
        baseAmount: prevFee.amountDue,
        concessionType: prevFee.concessionType,
        concessionReason: prevFee.concessionReason,
      })
    }
  }

  // 7. Assemble StudentFee records
  const challansToInsert = []
  for (const student of studentsToGenerate) {
    const classIdStr = student.classId?._id?.toString() || student.classId?.toString()
    const structure = classStructures[classIdStr]
    if (!structure) {
      continue // Skip if class has no fee structure
    }

    const baseAmount = structure.amount
    let discount = 0
    let concessionType = 'None'
    let concessionReason = ''

    // Preserve concession if student had one before
    const prevConcession = studentConcessionMap.get(student._id.toString())
    if (prevConcession && prevConcession.baseAmount > 0) {
      const discountRatio = prevConcession.discountAmount / prevConcession.baseAmount
      discount = Math.min(baseAmount, Math.round(baseAmount * discountRatio))
      concessionType = prevConcession.concessionType || 'Special Management Discount'
      concessionReason = prevConcession.concessionReason || `Recurring ${concessionType}`
    }

    const netAmount = Math.max(0, baseAmount - discount)
    const amountPaid = 0
    const outstandingAmount = netAmount
    const status = netAmount === 0 ? 'Paid' : 'Pending'

    challansToInsert.push({
      studentId: student._id,
      feeStructureId: structure._id,
      amountDue: baseAmount,
      discount,
      concessionType,
      concessionReason,
      netAmount,
      amountPaid,
      outstandingAmount,
      dueDate: targetDueDate,
      status,
    })
  }

  // 8. Bulk insert all new challans
  let insertedFees = []
  if (challansToInsert.length > 0) {
    insertedFees = await StudentFee.insertMany(challansToInsert, { ordered: false })
  }

  // 9. Invalidate caches and log audit
  await invalidateCache('dashboard:stats')

  await logAudit({
    req: null,
    action: 'MONTHLY_CHALLANS_AUTO_GENERATED',
    module: 'finance',
    newValues: {
      month: monthName,
      year: targetYear,
      dueDate: targetDueDate,
      totalEligible: students.length,
      generatedCount: (insertedFees || []).length,
      skippedCount,
      executedBy,
      runAt: new Date(),
    },
  })

  return {
    success: true,
    month: monthName,
    year: targetYear,
    dueDate: targetDueDate,
    totalEligibleStudents: students.length,
    generatedCount: (insertedFees || []).length,
    skippedCount,
    executedBy,
    timestamp: new Date(),
  }
}

/**
 * Returns the current automated monthly challans schedule and status
 */
const getMonthlyChallansStatus = async () => {
  const now = new Date()
  const currentMonthName = now.toLocaleString('en-US', { month: 'long' })
  const currentYear = now.getFullYear()

  const monthStart = new Date(currentYear, now.getMonth(), 1, 0, 0, 0, 0)
  const monthEnd = new Date(currentYear, now.getMonth() + 1, 0, 23, 59, 59, 999)

  // Next scheduled run is the 1st of the next month at 00:00 (Asia/Karachi)
  let nextRunYear = currentYear
  let nextRunMonth = now.getMonth() + 1
  if (nextRunMonth > 11) {
    nextRunMonth = 0
    nextRunYear += 1
  }
  const nextRunDate = new Date(nextRunYear, nextRunMonth, 1, 0, 0, 0, 0)

  // Total active students count
  const totalActiveStudents = await Student.countDocuments({
    status: 'Active',
    deletedAt: null,
  })

  // Count of student fees created for current month cycle
  const currentMonthChallansCount = await StudentFee.countDocuments({
    $or: [
      { createdAt: { $gte: monthStart, $lte: monthEnd } },
      { dueDate: { $gte: monthStart, $lte: monthEnd } },
    ],
  })

  // Latest fee created timestamp
  let latestFee = null
  try {
    const feeQuery = StudentFee.findOne()
    if (feeQuery && typeof feeQuery.sort === 'function') {
      const sorted = feeQuery.sort({ createdAt: -1 })
      latestFee = sorted && typeof sorted.select === 'function' ? await sorted.select('createdAt') : await sorted
    } else {
      latestFee = await feeQuery
    }
  } catch (err) {
    latestFee = null
  }

  let status = 'Pending'
  if (totalActiveStudents > 0 && currentMonthChallansCount >= totalActiveStudents) {
    status = 'Generated'
  } else if (currentMonthChallansCount > 0) {
    status = 'Partially Generated'
  }

  return {
    cronSchedule: '0 0 1 * *',
    cronScheduleDescription: 'Runs at 00:00 (Midnight PKT) on the 1st day of every month',
    timezone: 'Asia/Karachi',
    nextRunDate,
    currentMonth: currentMonthName,
    currentYear,
    totalActiveStudents,
    currentMonthChallansCount,
    status,
    lastGeneratedAt: latestFee ? latestFee.createdAt : null,
  }
}

module.exports = {
  generateMonthlyFeeChallans,
  getMonthlyChallansStatus,
  getDefaultTuitionForClass,
}
