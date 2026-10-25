const mongoose = require('mongoose')

const gradeSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  marksObtained: { type: Number, required: true, min: 0 },
  percentage: { type: Number, required: true },
  gradeLetter: { type: String, required: true }, // 'A+', 'A', 'B', 'C', 'D', 'F'
  remarks: { type: String, default: '' },
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

gradeSchema.index({ examId: 1, studentId: 1 }, { unique: true })
gradeSchema.index({ studentId: 1 })

module.exports = mongoose.model('Grade', gradeSchema)
