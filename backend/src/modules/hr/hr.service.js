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
  computeIncomeTax,
  computeNetSalary,
}
