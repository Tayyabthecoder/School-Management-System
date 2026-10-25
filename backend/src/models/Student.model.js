const mongoose = require('mongoose')

const guardianSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  relationship: { type: String, default: 'Parent' },
  cnic: { type: String, default: '' },
  occupation: { type: String, default: '' },
}, { _id: false })

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true, trim: true },
  fullName: { type: String, required: true, trim: true },
  dob: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  sectionId: { type: String, required: true },
  guardian: { type: guardianSchema, required: true },
  joiningDate: { type: Date, default: Date.now },
  bloodGroup: { type: String, default: '' },
  bFormNumber: { type: String, default: '' },
  nationality: { type: String, default: 'Pakistani' },
  religion: { type: String, default: 'Islam' },
  emergencyContact: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    relationship: { type: String, default: 'Guardian' },
  },
  medicalNotes: { type: String, default: 'None reported / General fitness' },
  previousSchool: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: 'Karachi' },
  fatherName: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Transferred', 'Withdrawn', 'Graduated'], default: 'Active' },
  transferReason: { type: String, default: '' },
  transferDate: { type: Date, default: null },
  documents: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
  }],
  isActive: { type: Boolean, default: true },
  deletedAt: { type: Date, default: null },
}, { timestamps: true })

studentSchema.index({ classId: 1, sectionId: 1 })

module.exports = mongoose.model('Student', studentSchema)
