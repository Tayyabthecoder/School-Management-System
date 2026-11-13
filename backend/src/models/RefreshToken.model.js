const mongoose = require('mongoose')

/**
 * Server-side record of every issued refresh token (SEC-04). A refresh token is only
 * accepted while its jti exists here, so logout, password change and rotation revoke it
 * whether or not Redis is running. MongoDB's TTL monitor removes expired entries.
 */
const refreshTokenSchema = new mongoose.Schema({
  jti: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  expiresAt: { type: Date, required: true },
  // Set when the token is exchanged for a new one. The record is kept (until it expires) so a
  // later replay of the same token can be recognised as theft rather than a plain expiry.
  rotatedAt: { type: Date, default: null },
}, { timestamps: { createdAt: true, updatedAt: false } })

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('RefreshToken', refreshTokenSchema)
