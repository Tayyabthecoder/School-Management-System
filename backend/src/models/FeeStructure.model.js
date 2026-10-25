const mongoose = require('mongoose')

const feeStructureSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "Grade 10 Monthly Tuition Fee"
  feeType: { type: String, enum: ['Tuition', 'Admission', 'Exam', 'Other'], required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  amount: { type: Number, required: true, min: 0 },
  dueDate: { type: Date, required: true },
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.model('FeeStructure', feeStructureSchema)
