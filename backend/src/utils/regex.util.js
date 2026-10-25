/**
 * Escapes characters that have special meaning in regular expressions
 * to protect against Regular Expression Denial of Service (ReDoS).
 * @param {string} str - Raw user input string
 * @returns {string} - Escaped string safe for new RegExp or Mongoose $regex
 */
const escapeRegex = (str) => {
  if (typeof str !== 'string') return ''
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

module.exports = {
  escapeRegex,
}
