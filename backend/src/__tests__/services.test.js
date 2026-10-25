const { calculateNetFee, computeUpdatedFeeBalance, validatePayment } = require('../modules/finance/finance.service')
const { calculatePerDaySalary, calculateAbsentDeductions, computeNetSalary } = require('../modules/hr/hr.service')
const { calculatePercentage, calculateGradeLetter, isPassingGrade } = require('../modules/grades/grades.service')

describe('Service Layer Unit Tests', () => {
  describe('Finance Service', () => {
    it('should correctly calculate net fee with discount', () => {
      const result = calculateNetFee(10000, 1500)
      expect(result.netAmount).toBe(8500)
      expect(result.discount).toBe(1500)
      expect(result.baseAmount).toBe(10000)
    })

    it('should handle zero or excess discount gracefully', () => {
      const result = calculateNetFee(5000, 6000)
      expect(result.netAmount).toBe(0)
    })

    it('should compute updated fee balance and mark Paid when fully settled', () => {
      const feeRecord = { amountPaid: 2000, outstandingAmount: 3000 }
      const updated = computeUpdatedFeeBalance(feeRecord, 3000)
      expect(updated.amountPaid).toBe(5000)
      expect(updated.outstandingAmount).toBe(0)
      expect(updated.status).toBe('Paid')
    })

    it('should compute updated fee balance and mark Partial when partially settled', () => {
      const feeRecord = { amountPaid: 0, outstandingAmount: 5000 }
      const updated = computeUpdatedFeeBalance(feeRecord, 2000)
      expect(updated.amountPaid).toBe(2000)
      expect(updated.outstandingAmount).toBe(3000)
      expect(updated.status).toBe('Partial')
    })
  })

  describe('HR Service', () => {
    it('should calculate per-day salary accurately', () => {
      const perDay = calculatePerDaySalary(60000, 30)
      expect(perDay).toBe(2000)
    })

    it('should calculate absent deductions based on absent days', () => {
      const deductions = calculateAbsentDeductions(60000, 3, 30)
      expect(deductions).toBe(6000)
    })

    it('should compute net salary accurately with allowances and deductions', () => {
      const net = computeNetSalary({
        basicPay: 50000,
        allowances: 5000,
        absentDeduction: 2000,
        otherDeductions: 1000,
      })
      expect(net.netPay).toBe(52000)
      expect(net.basicPay).toBe(50000)
    })
  })

  describe('Grades Service', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(85, 100)).toBe(85)
      expect(calculatePercentage(38, 50)).toBe(76)
    })

    it('should return correct grade letter according to scale', () => {
      expect(calculateGradeLetter(95)).toBe('A+')
      expect(calculateGradeLetter(82)).toBe('A')
      expect(calculateGradeLetter(74)).toBe('B')
      expect(calculateGradeLetter(61)).toBe('C')
      expect(calculateGradeLetter(52)).toBe('D')
      expect(calculateGradeLetter(45)).toBe('F')
    })

    it('should evaluate passing grade properly', () => {
      expect(isPassingGrade(40, 40)).toBe(true)
      expect(isPassingGrade(45, 40)).toBe(true)
      expect(isPassingGrade(39, 40)).toBe(false)
    })
  })

  describe('Counter Model', () => {
    it('should invoke findByIdAndUpdate with increment and upsert', async () => {
      const Counter = require('../models/Counter.model')
      const mockFindByIdAndUpdate = jest.spyOn(Counter, 'findByIdAndUpdate').mockResolvedValue({ _id: 'payment', seq: 42 })

      const seq = await Counter.getNextSequence('payment')
      expect(seq).toBe(42)
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        'payment',
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      )

      mockFindByIdAndUpdate.mockRestore()
    })
  })
})
