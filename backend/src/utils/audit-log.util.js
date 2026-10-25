const AuditLog = require('../models/AuditLog.model')

/**
 * Universal Audit Logging helper supporting both object and positional parameter signatures:
 * 1. logAudit({ req, action, module, documentId, oldValues, newValues })
 * 2. logAudit(req, action, metadata)
 */
const logAudit = async (...args) => {
  try {
    let req = null
    let action = 'UNKNOWN_ACTION'
    let module = 'general'
    let documentId = ''
    let oldValues = null
    let newValues = null

    if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
      const obj = args[0]
      req = obj.req || null
      action = obj.action || 'UNKNOWN_ACTION'
      module = obj.module || 'general'
      documentId = obj.documentId ? obj.documentId.toString() : ''
      oldValues = obj.oldValues || null
      newValues = obj.newValues || null
    } else if (args.length >= 2) {
      req = args[0]
      action = args[1]
      const meta = args[2] || {}
      module = meta.module || (typeof action === 'string' ? action.split('_')[0].toLowerCase() : 'general')
      documentId = meta.documentId || meta.studentId || meta.id || ''
      newValues = meta
    }

    const userId = req && req.user ? (req.user._id || req.user.id || null) : null
    const username = req && req.user ? (req.user.username || 'System') : 'System'
    const ipAddress = req ? (req.ip || req.socket?.remoteAddress || '') : ''

    await AuditLog.create({
      userId,
      username,
      action,
      module,
      documentId: documentId ? documentId.toString() : '',
      oldValues,
      newValues,
      ipAddress,
    })
  } catch (err) {
    console.error(`[AuditLog Error]: ${err.message}`)
  }
}

module.exports = { logAudit }
