const mongoose = require('mongoose')
const { DAYS_OF_WEEK, DEFAULT_ALLOWED_DAYS } = require('../config/constants')

const schoolSettingsSchema = new mongoose.Schema({
  attendanceAlertThreshold: {
    type: Number,
    default: 75,
    min: 50,
    max: 100,
  },
  autoFeeOverdueAlerts: {
    type: Boolean,
    default: true,
  },
  allowedDays: {
    type: [String],
    enum: DAYS_OF_WEEK,
    default: DEFAULT_ALLOWED_DAYS,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Branding fields (Gap 5)
  schoolName: {
    type: String,
    default: 'School Management System',
    trim: true,
  },
  schoolTagline: {
    type: String,
    default: '',
    trim: true,
  },
  primaryColor: {
    type: String,
    default: '#3730A3',
    trim: true,
  },
  schoolAddress: {
    type: String,
    default: '',
    trim: true,
  },
  schoolPhone: {
    type: String,
    default: '',
    trim: true,
  },
  schoolEmail: {
    type: String,
    default: '',
    trim: true,
  },
  // Additional Branding & Identification
  regNo: {
    type: String,
    default: '',
    trim: true,
  },
  hotline: {
    type: String,
    default: '',
    trim: true,
  },
  website: {
    type: String,
    default: '',
    trim: true,
  },
  // Regional & Localization
  currency: {
    type: String,
    default: 'PKR',
    trim: true,
  },
  timezone: {
    type: String,
    default: 'Asia/Karachi (GMT+5)',
    trim: true,
  },
  dateFormat: {
    type: String,
    default: 'DD/MM/YYYY',
    trim: true,
  },
  // Academic Policies & Thresholds
  activeTerm: {
    type: String,
    default: 'Term 1',
    trim: true,
  },
  minAttendancePercentage: {
    type: Number,
    default: 75,
    min: 50,
    max: 100,
  },
  maxStudentsPerSection: {
    type: Number,
    default: 35,
    min: 5,
    max: 100,
  },
  // Grading scale fields (Gap 6)
  gradingScale: {
    type: [{
      label: { type: String, required: true },
      minPercent: { type: Number, required: true },
      maxPercent: { type: Number, required: true },
    }],
    default: [
      { label: 'A+', minPercent: 90, maxPercent: 100 },
      { label: 'A', minPercent: 80, maxPercent: 89 },
      { label: 'B', minPercent: 70, maxPercent: 79 },
      { label: 'C', minPercent: 60, maxPercent: 69 },
      { label: 'D', minPercent: 50, maxPercent: 59 },
      { label: 'F', minPercent: 0, maxPercent: 49 },
    ],
  },
  passingPercentage: {
    type: Number,
    default: 40,
    min: 0,
    max: 100,
  },
}, { timestamps: true })

module.exports = mongoose.model('SchoolSettings', schoolSettingsSchema)
