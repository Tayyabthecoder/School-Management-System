const mongoose = require('mongoose')

const classSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g. "Grade 10"
  level: { type: Number, required: true }, // 1 to 12
  sections: [{ type: String, required: true }], // ['A', 'B', 'C']
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.model('Class', classSchema)
