const mongoose = require('mongoose')

const termSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Term 1", "Midterm", "Final Term"
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isCurrent: { type: Boolean, default: false },
}, { _id: true })

const academicYearSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true }, // 2026
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  terms: [termSchema],
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.model('AcademicYear', academicYearSchema)
