const mongoose = require('mongoose')

const payrollRecordSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  month: { type: Number, required: true, min: 1, max: 12 }, // 1 to 12
  year: { type: Number, required: true }, // e.g. 2026
  basicPay: { type: Number, required: true },
  allowances: { type: Number, default: 0 },
  absentDaysDeduction: { type: Number, default: 0 },
  otherDeductions: { type: Number, default: 0 },
  incomeTax: { type: Number, default: 0 },
  eobi: { type: Number, default: 0 },
  sessi: { type: Number, default: 0 },
  providentFund: { type: Number, default: 0 },
  netPay: { type: Number, required: true },
  status: { type: String, enum: ['Draft', 'Finalized'], default: 'Draft' },
  paymentStatus: { type: String, enum: ['Generated', 'Paid'], default: 'Generated' },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

payrollRecordSchema.index({ staffId: 1, month: 1, year: 1 }, { unique: true })

module.exports = mongoose.model('PayrollRecord', payrollRecordSchema)
