const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const { BCRYPT_ROUNDS } = require('../config/constants')

// No look-alike characters (0/O, 1/l/I) so the password can be read out or printed safely.
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const DIGITS = '23456789'
const ALL = LETTERS + DIGITS

/**
 * Cryptographically random one-time password (always has a letter and a digit, to satisfy
 * the password policy). Shown to the administrator once; the account must change it on
 * first login (mustChangePassword).
 */
const generateInitialPassword = (length = 12) => {
  const pick = (set) => set[crypto.randomInt(set.length)]
  const chars = [pick(LETTERS), pick(DIGITS)]
  while (chars.length < length) chars.push(pick(ALL))
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

/** @returns {Promise<{ password: string, passwordHash: string }>} */
const createInitialCredentials = async () => {
  const password = generateInitialPassword()
  return { password, passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS) }
}

module.exports = { generateInitialPassword, createInitialCredentials }
