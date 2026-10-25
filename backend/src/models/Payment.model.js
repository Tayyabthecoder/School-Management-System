const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema({
  receiptNo: { type: String, required: true, unique: true },
  studentFeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentFee', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  amountPaid: { type: Number, required: true, min: 0 },
  paymentDate: { type: Date, default: Date.now },
  paymentMode: { type: String, enum: ['Cash', 'Bank Transfer', 'Cheque', 'Online', 'JazzCash', 'EasyPaisa'], default: 'Cash' },
  referenceNo: { type: String, default: '' },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  remarks: { type: String, default: '' },
}, { timestamps: true })

paymentSchema.index({ studentFeeId: 1 })
paymentSchema.index({ studentId: 1, paymentDate: -1 })
paymentSchema.index({ paymentDate: -1 })

module.exports = mongoose.model('Payment', paymentSchema)
