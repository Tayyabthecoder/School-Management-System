const mongoose = require('mongoose')

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  username: { type: String, default: 'System' },
  action: { type: String, required: true }, // e.g., "CREATE_STUDENT", "MARK_ATTENDANCE"
  module: { type: String, required: true },
  documentId: { type: String, default: '' },
  oldValues: { type: mongoose.Schema.Types.Mixed, default: null },
  newValues: { type: mongoose.Schema.Types.Mixed, default: null },
  ipAddress: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true })

auditLogSchema.index({ userId: 1, timestamp: -1 })
auditLogSchema.index({ module: 1, createdAt: -1 })
auditLogSchema.index({ action: 1, timestamp: -1 })

module.exports = mongoose.model('AuditLog', auditLogSchema)
