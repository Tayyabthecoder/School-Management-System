const mongoose = require('mongoose')

const permissionSchema = new mongoose.Schema({
  module: { type: String, required: true },
  actions: [{ type: String, enum: ['create', 'read', 'update', 'delete'] }],
}, { _id: false })

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['super_admin', 'teacher', 'student', 'guardian', 'accountant', 'hr_manager'],
  },
  displayName: { type: String, required: true },
  description: { type: String },
  permissions: [permissionSchema],
}, { timestamps: true })

module.exports = mongoose.model('Role', roleSchema)
