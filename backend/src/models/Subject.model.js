const mongoose = require('mongoose')

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Mathematics"
  // Stored upper-case and trimmed so "math-10" and "MATH-10 " count as the same code
  code: { type: String, required: true, uppercase: true, trim: true }, // e.g., "MATH-10"
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

// A subject code is unique within its class (LOW-09); duplicates now fail with 409
subjectSchema.index({ classId: 1, code: 1 }, { unique: true, name: 'unique_subject_code_per_class' })

module.exports = mongoose.model('Subject', subjectSchema)
