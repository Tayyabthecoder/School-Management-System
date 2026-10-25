const { ApiError } = require('../../middleware/error.middleware')

/**
 * Pure business calculation functions for Finance module
 */

const calculateNetFee = (baseAmount, discount = 0) => {
  const safeDiscount = Math.max(0, Number(discount) || 0)
  const safeBase = Math.max(0, Number(baseAmount) || 0)
  const net = Math.max(0, safeBase - safeDiscount)
  return {
    baseAmount: safeBase,
    discount: safeDiscount,
    netAmount: net,
  }
}

const validatePayment = (feeRecord, amountToPay) => {
  if (!feeRecord) throw new ApiError(404, 'Student fee record not found')
  const amount = Number(amountToPay)
  if (isNaN(amount) || amount <= 0) {
    throw new ApiError(400, 'Payment amount must be greater than zero')
  }
  if (amount > feeRecord.outstandingAmount) {
    throw new ApiError(400, `Amount paid (PKR ${amount}) exceeds outstanding amount (PKR ${feeRecord.outstandingAmount})`)
  }
  return true
}

const computeUpdatedFeeBalance = (feeRecord, amountPaid) => {
  const newAmountPaid = (feeRecord.amountPaid || 0) + Number(amountPaid)
  const newOutstanding = Math.max(0, (feeRecord.outstandingAmount || 0) - Number(amountPaid))
  const status = newOutstanding === 0 ? 'Paid' : 'Partial'

  return {
    amountPaid: newAmountPaid,
    outstandingAmount: newOutstanding,
    status,
  }
}

const applyDiscountToFeeRecord = (feeRecord, discountAmount, concessionType, concessionReason) => {
  const numDiscount = Number(discountAmount)
  if (isNaN(numDiscount) || numDiscount < 0) {
    throw new ApiError(400, 'Discount amount must be a positive number')
  }

  if (numDiscount > feeRecord.amountDue) {
    throw new ApiError(400, `Discount amount (PKR ${numDiscount}) cannot exceed base fee amount (PKR ${feeRecord.amountDue})`)
  }

  feeRecord.discount = numDiscount
  feeRecord.concessionType = numDiscount === 0 ? 'None' : (concessionType || 'Special Management Discount')
  feeRecord.concessionReason = numDiscount === 0 ? '' : (concessionReason || '')
  feeRecord.netAmount = Math.max(0, feeRecord.amountDue - numDiscount)
  feeRecord.outstandingAmount = Math.max(0, feeRecord.netAmount - (feeRecord.amountPaid || 0))

  if (feeRecord.outstandingAmount === 0) {
    feeRecord.status = 'Paid'
  } else if ((feeRecord.amountPaid || 0) > 0) {
    feeRecord.status = 'Partial'
  } else {
    feeRecord.status = 'Pending'
  }

  return feeRecord
}

module.exports = {
  calculateNetFee,
  validatePayment,
  computeUpdatedFeeBalance,
  applyDiscountToFeeRecord,
}
