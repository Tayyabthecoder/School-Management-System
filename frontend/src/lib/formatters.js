export const formatPKR = (amount) => {
  if (amount === undefined || amount === null) return 'PKR 0'
  return `PKR ${Number(amount).toLocaleString()}`
}

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
