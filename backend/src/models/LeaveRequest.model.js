const mongoose = require('mongoose')

const leaveRequestSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  leaveType: { type: String, enum: ['Annual', 'Sick', 'Casual', 'Unpaid', 'Medical', 'Maternity', 'Paternity'], required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewRemarks: { type: String, default: '' },
}, { timestamps: true })

leaveRequestSchema.index({ status: 1 })
leaveRequestSchema.index({ staffId: 1, fromDate: -1 })

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema)
