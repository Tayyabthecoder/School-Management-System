const mongoose = require('mongoose')

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Mathematics"
  code: { type: String, required: true }, // e.g., "MATH-10"
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.model('Subject', subjectSchema)
