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
  // Exactly one year may be active: fees, challans, dashboards and promotion all read
  // `findOne({ isActive: true })`. Switch years only through activateAcademicYear().
  isActive: { type: Boolean, default: false },
}, { timestamps: true })

// At most one document can have isActive: true.
academicYearSchema.index(
  { isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true }, name: 'single_active_year' }
)

module.exports = mongoose.model('AcademicYear', academicYearSchema)
