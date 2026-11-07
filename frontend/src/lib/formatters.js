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

export default {
  formatPKR,
  formatDate,
  formatPercentage,
}
