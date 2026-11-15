/**
 * Pure business calculation functions for HR & Payroll module
 */

const calculatePerDaySalary = (monthlySalary, daysInMonth = 30) => {
  const salary = Math.max(0, Number(monthlySalary) || 0)
  return Math.round(salary / daysInMonth)
}

const calculateAbsentDeductions = (monthlySalary, absentDaysCount, daysInMonth = 30) => {
  const perDay = calculatePerDaySalary(monthlySalary, daysInMonth)
  const days = Math.max(0, Number(absentDaysCount) || 0)
  return days * perDay
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DEFAULT_WORKING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const dayKey = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`

/**
 * Unpaid-leave days that should reduce a month's pay: every school working day inside an approved
 * Unpaid leave that falls in the month. A day already deducted as an absence (a full 1, or the 0.5
 * of a half day) is not charged twice, and overlapping leave requests count a day once.
 *
 * @param {{ fromDate: Date|string, toDate: Date|string }[]} leaves approved Unpaid leave of one staff member
 * @param {Date} monthStart first moment of the month
 * @param {Date} monthEnd last moment of the month
 * @param {string[]} workingDays weekday names the school operates on
 * @param {Map<string, number>} alreadyDeducted dayKey -> weight (1 or 0.5) already charged as absence
 */
const countUnpaidLeaveDays = (leaves, monthStart, monthEnd, workingDays = DEFAULT_WORKING_DAYS, alreadyDeducted = new Map()) => {
  const working = new Set(workingDays && workingDays.length ? workingDays : DEFAULT_WORKING_DAYS)
  const counted = new Set()
  let days = 0

  for (const leave of leaves || []) {
    const from = new Date(leave.fromDate)
    const to = new Date(leave.toDate)
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) continue

    const cursor = new Date(Math.max(from.getTime(), monthStart.getTime()))
    cursor.setHours(0, 0, 0, 0)
    const last = new Date(Math.min(to.getTime(), monthEnd.getTime()))

    // Bounded: a month has at most 31 days
    for (let guard = 0; cursor <= last && guard < 40; guard++) {
      const key = dayKey(cursor)
      if (working.has(DAY_NAMES[cursor.getDay()]) && !counted.has(key)) {
        counted.add(key)
        days += Math.max(0, 1 - (alreadyDeducted.get(key) || 0))
      }
      cursor.setDate(cursor.getDate() + 1)
    }
  }
  return days
}

/** Employee provident-fund contribution: a percentage of basic pay (0 when not configured). */
const calculateProvidentFund = (basicPay, percent) => {
  const basic = Math.max(0, Number(basicPay) || 0)
  const pct = Math.min(100, Math.max(0, Number(percent) || 0))
  return Math.round((basic * pct) / 100)
}

const EOBI_FIXED_PKR = 370 // Pakistan statutory rate

const computeIncomeTax = (annualGross) => {
  const gross = Math.max(0, Number(annualGross) || 0)
  if (gross <= 600000) return 0
  if (gross <= 1200000) return Math.round(((gross - 600000) * 0.05) / 12)
  if (gross <= 2400000) return Math.round((30000 + (gross - 1200000) * 0.15) / 12)
  if (gross <= 3600000) return Math.round((210000 + (gross - 2400000) * 0.25) / 12)
  if (gross <= 6000000) return Math.round((510000 + (gross - 3600000) * 0.30) / 12)
  return Math.round((1230000 + (gross - 6000000) * 0.35) / 12)
}

const computeNetSalary = ({
  basicPay,
  allowances = 0,
  absentDeduction = 0,
  otherDeductions = 0,
  incomeTax = 0,
  eobi = 0,
  sessi = 0,
  providentFund = 0,
  applyIncomeTax = false,
  applyEobi = false,
  applySessi = false,
}) => {
  const basic = Math.max(0, Number(basicPay) || 0)
  const allow = Math.max(0, Number(allowances) || 0)
  const absent = Math.max(0, Number(absentDeduction) || 0)
  const other = Math.max(0, Number(otherDeductions) || 0)

  const grossMonthly = basic + allow
  const computedTax = applyIncomeTax ? computeIncomeTax(grossMonthly * 12) : Math.max(0, Number(incomeTax) || 0)
  const computedEobi = applyEobi ? EOBI_FIXED_PKR : Math.max(0, Number(eobi) || 0)
  const computedSessi = applySessi ? Math.round(basic * 0.06) : Math.max(0, Number(sessi) || 0)
  const computedPf = Math.max(0, Number(providentFund) || 0)

  const totalEarnings = grossMonthly
  const totalDeductions = absent + other + computedTax + computedEobi + computedSessi + computedPf
  const netPay = Math.max(0, totalEarnings - totalDeductions)

  return {
    basicPay: basic,
    allowances: allow,
    absentDaysDeduction: absent,
    otherDeductions: other,
    incomeTax: computedTax,
    eobi: computedEobi,
    sessi: computedSessi,
    providentFund: computedPf,
    netPay,
  }
}

module.exports = {
  calculatePerDaySalary,
  calculateAbsentDeductions,
  countUnpaidLeaveDays,
  calculateProvidentFund,
  dayKey,
  computeIncomeTax,
  computeNetSalary,
}
