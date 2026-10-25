const mongoose = require('mongoose')

const studentLeaveRequestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  guardianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  sectionId: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  category: {
    type: String,
    enum: ['Sick', 'Medical', 'Family', 'Other'],
    default: 'Sick',
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
  reviewRemarks: {
    type: String,
    default: '',
    trim: true,
  },
}, { timestamps: true })

studentLeaveRequestSchema.index({ studentId: 1, startDate: -1 })
studentLeaveRequestSchema.index({ classId: 1, sectionId: 1, status: 1 })
studentLeaveRequestSchema.index({ guardianId: 1, status: 1 })

module.exports = mongoose.model('StudentLeaveRequest', studentLeaveRequestSchema)
