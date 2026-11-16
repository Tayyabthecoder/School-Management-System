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
  // Set only on challans created by the monthly job (see the partial unique index below)
  monthlyKey: { type: String },
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

// Double-billing guard. The monthly challan job stamps each challan it creates with
// monthlyKey = the fee structure id, and this partial unique index lets MongoDB itself refuse a second
// one for the same student and structure, whichever server or process tries. That closes the race the
// "already billed?" lookup cannot: two servers (or a cron run and a manual run on different servers)
// can both see "nothing yet" and then both insert. Challans without a monthlyKey (manual assignment,
// admission fees, a deliberate force-regenerate) are outside the index and may repeat.
studentFeeSchema.index(
  { studentId: 1, monthlyKey: 1 },
  { unique: true, partialFilterExpression: { monthlyKey: { $type: 'string' } } }
)

module.exports = mongoose.model('StudentFee', studentFeeSchema)

