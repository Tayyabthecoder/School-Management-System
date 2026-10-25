const mongoose = require('mongoose')

const staffSchema = new mongoose.Schema({
  staffId: { type: String, required: true, unique: true, trim: true },
  fullName: { type: String, required: true, trim: true },
  cnic: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  designation: { type: String, required: true },
  department: { type: String, required: true },
  joiningDate: { type: Date, required: true },
  salary: { type: Number, required: true, min: 0 },
  allowances: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  bankDetails: {
    accountTitle: String,
    accountNumber: String,
    bankName: String,
  },
  isActive: { type: Boolean, default: true },
  deletedAt: { type: Date, default: null },
}, { timestamps: true })



staffSchema.index({ department: 1 })
staffSchema.index({ isActive: 1, deletedAt: 1 })

module.exports = mongoose.model('Staff', staffSchema)
