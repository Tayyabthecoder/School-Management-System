const mongoose = require('mongoose')

const challanSettingsSchema = new mongoose.Schema({
  layout: {
    type: String,
    enum: ['2-part', '3-part'],
    default: '3-part',
  },
  instituteName: {
    type: String,
    default: 'SCHOOL MANAGEMENT SYSTEM',
  },
  subHeader: {
    type: String,
    default: 'BANK & DIGITAL PAYMENT FEE CHALLAN - ACADEMIC 2026',
  },
  copies: [
    {
      name: { type: String, required: true },
      subtitle: { type: String, default: '' },
      badgeColor: { type: String, default: '#1E3A8A' },
    },
  ],
  paymentMethods: [
    {
      id: { type: String },
      type: {
        type: String,
        enum: ['bank', 'easypaisa', 'jazzcash', 'raast', 'other'],
        default: 'bank',
      },
      name: { type: String, required: true },
      accountTitle: { type: String, required: true },
      accountNumber: { type: String, required: true },
      branchCode: { type: String, default: '' },
      branchName: { type: String, default: '' },
      iban: { type: String, default: '' },
      isEnabled: { type: Boolean, default: true },
      isPrimary: { type: Boolean, default: false },
    },
  ],
  particulars: [
    {
      id: { type: String },
      name: { type: String, required: true },
      type: {
        type: String,
        enum: ['tuition', 'fixed', 'concession', 'late_fee'],
        default: 'fixed',
      },
      defaultAmount: { type: Number, default: 0 },
      isEnabled: { type: Boolean, default: true },
      isDeduction: { type: Boolean, default: false },
    },
  ],
  lateFeeSurcharge: {
    type: Number,
    default: 500,
  },
  instructions: [
    { type: String },
  ],
  signatories: {
    leftTitle: { type: String, default: 'Depositor / Student Sign' },
    rightTitle: { type: String, default: 'Bank / Cashier Stamp' },
    middleTitle: { type: String, default: 'Accounts Officer' },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true })

module.exports = mongoose.model('ChallanSettings', challanSettingsSchema)
