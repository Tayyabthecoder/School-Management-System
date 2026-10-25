const mongoose = require('mongoose')

const promotionConfigSchema = new mongoose.Schema({
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  targetAcademicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' },
  finalExamTermName: { type: String, required: true, default: 'Final Term' },
  mappings: [{
    fromClassId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    toClassId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  }],
  isExecuted: { type: Boolean, default: false },
  executedAt: { type: Date, default: null },
  executedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true })

module.exports = mongoose.model('PromotionConfig', promotionConfigSchema)
