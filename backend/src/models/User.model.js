const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  roleName: {
    type: String,
    enum: ['super_admin', 'teacher', 'student', 'guardian', 'accountant', 'hr_manager'],
    required: true,
  },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null },
  mustChangePassword: { type: Boolean, default: true },
  tokenVersion: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  deletedAt: { type: Date, default: null },
}, { timestamps: true })

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash)
}

userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now()
}

module.exports = mongoose.model('User', userSchema)
