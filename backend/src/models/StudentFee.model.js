const mongoose = require('mongoose')

const studentFeeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  feeStructureId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeStructure', required: true },
  amountDue: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  concessionType: {
    type: String,
    enum: ['None', 'Merit Scholarship', 'Need-Based Aid', 'Sibling Discount', 'Staff Ward Concession', 'Kinship Relief', 'Special Management Discount'],
    default: 'None',
  },
  concessionReason: { type: String, default: '' },
  netAmount: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  outstandingAmount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  challanDownloadedAt: { type: Date, default: null },
  challanDownloadCount: { type: Number, default: 0 },
  effectiveDueDate: { type: Date, default: null },
  status: { type: String, enum: ['Paid', 'Partial', 'Overdue', 'Pending'], default: 'Pending' },
}, { timestamps: true })

studentFeeSchema.pre('save', function (next) {
  if (this.amountDue !== undefined) {
    this.netAmount = Math.max(0, this.amountDue - (this.discount || 0))
    this.outstandingAmount = Math.max(0, this.netAmount - (this.amountPaid || 0))
    if (this.outstandingAmount === 0) {
      this.status = 'Paid'
    } else if (this.isModified('amountPaid') || !this.status) {
      this.status = (this.amountPaid || 0) > 0 ? 'Partial' : (this.status === 'Overdue' ? 'Overdue' : 'Pending')
    } else if (!this.isModified('status')) {
      if ((this.amountPaid || 0) > 0 && this.status !== 'Overdue') {
        this.status = 'Partial'
      } else if (this.status !== 'Overdue') {
        this.status = 'Pending'
      }
    }
  }
  next()
})

studentFeeSchema.index({ studentId: 1, status: 1 })
studentFeeSchema.index({ feeStructureId: 1 })
studentFeeSchema.index({ status: 1, dueDate: 1 })
studentFeeSchema.index({ studentId: 1, feeStructureId: 1 })

module.exports = mongoose.model('StudentFee', studentFeeSchema)

