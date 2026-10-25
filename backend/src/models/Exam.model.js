const mongoose = require('mongoose')

const examSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g. "Midterm Exam 2026"
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  termName: { type: String, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  examDate: { type: Date, required: true },
  maxMarks: { type: Number, required: true, default: 100 },
  passMarks: { type: Number, required: true, default: 40 },
  isPublished: { type: Boolean, default: false },
}, { timestamps: true })

module.exports = mongoose.model('Exam', examSchema)
