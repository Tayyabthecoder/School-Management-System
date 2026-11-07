const getPagination = (query = {}) => {
  const safeQuery = query && typeof query === 'object' ? query : {}
  const rawPage = parseInt(safeQuery.page, 10)
  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage

  const rawLimit = parseInt(safeQuery.limit, 10)
  const defaultLimit = 25
  const parsedLimit = Number.isNaN(rawLimit) || rawLimit < 1 ? defaultLimit : rawLimit
  const limit = Math.min(1000, parsedLimit)

  const skip = (page - 1) * limit
  return { page, limit, skip }
}

const formatPaginatedResponse = (data, total, page, limit) => {
  const safeLimit = limit && limit > 0 ? limit : 25
  const safeTotal = total && total > 0 ? total : 0
  const totalPages = Math.ceil(safeTotal / safeLimit) || 1
  return {
    success: true,
    data: Array.isArray(data) ? data : [],
    meta: {
      page: page || 1,
      limit: safeLimit,
      total: safeTotal,
      totalPages,
    },
  }
}

module.exports = { getPagination, formatPaginatedResponse }
