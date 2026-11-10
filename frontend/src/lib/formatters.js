/**
 * Centralized formatting helpers for School Management System
 */

export const formatPKR = (amount) => {
  if (amount === undefined || amount === null) return 'PKR 0'
  const num = Number(amount)
  if (Number.isNaN(num)) return 'PKR 0'
  return `PKR ${num.toLocaleString()}`
}

export const formatDate = (dateString, fallback = 'N/A') => {
  if (!dateString) return fallback
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return fallback
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const formatPercentage = (value, fallback = '0%') => {
  if (value === undefined || value === null) return fallback
  const num = Number(value)
  if (Number.isNaN(num)) return fallback
  return `${Math.round(num)}%`
}

/**
 * Returns the user's *local* calendar date as YYYY-MM-DD for <input type="date">.
 * `toISOString().split('T')[0]` returns the UTC date, which in Pakistan (UTC+5)
 * is still "yesterday" between midnight and 05:00.
 */
export const toLocalDateInput = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default {
  formatPKR,
  formatDate,
  formatPercentage,
  toLocalDateInput,
}
