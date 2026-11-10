const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Normalises a calendar date to local midnight.
 *
 * Plain "YYYY-MM-DD" strings (what <input type="date"> sends) are read as a local
 * calendar day. `new Date('2026-05-04')` would parse them as UTC midnight, which on a
 * server west of UTC becomes the previous local day once the time is zeroed.
 *
 * @param {string|Date|number|undefined|null} input - Defaults to "today" when empty
 * @returns {Date|null} Local-midnight Date, or null when the input is not a valid date
 */
const toStartOfLocalDay = (input) => {
  if (typeof input === 'string') {
    const match = DATE_ONLY_PATTERN.exec(input.trim())
    if (match) {
      const [, year, month, day] = match.map(Number)
      const date = new Date(year, month - 1, day)
      // Reject roll-overs such as 2026-02-31 -> 3 March
      return date.getMonth() === month - 1 && date.getDate() === day ? date : null
    }
  }

  const date = input === undefined || input === null || input === '' ? new Date() : new Date(input)
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return date
}

const invalidBound = (value) => {
  // Lazy require keeps this util free of a hard dependency cycle with the middleware.
  const { ApiError } = require('../middleware/error.middleware')
  return new ApiError(400, `Invalid date filter value: ${value}`)
}

/**
 * Lower bound of a user-supplied date range. A plain "YYYY-MM-DD" means the start
 * of that local day; full timestamps are used as given.
 */
const toRangeStart = (value) => {
  const isDateOnly = typeof value === 'string' && DATE_ONLY_PATTERN.test(value.trim())
  const date = isDateOnly ? toStartOfLocalDay(value) : new Date(value)
  if (!date || Number.isNaN(date.getTime())) throw invalidBound(value)
  return date
}

/**
 * Upper bound of a user-supplied date range. A plain "YYYY-MM-DD" is inclusive of the
 * whole day (23:59:59.999 local); `new Date('2026-05-31')` would stop at 00:00 UTC and
 * drop everything that happened on the last selected day.
 */
const toRangeEnd = (value) => {
  const isDateOnly = typeof value === 'string' && DATE_ONLY_PATTERN.test(value.trim())
  if (!isDateOnly) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) throw invalidBound(value)
    return date
  }
  const day = toStartOfLocalDay(value)
  if (!day) throw invalidBound(value)
  day.setHours(23, 59, 59, 999)
  return day
}

module.exports = { toStartOfLocalDay, toRangeStart, toRangeEnd }
