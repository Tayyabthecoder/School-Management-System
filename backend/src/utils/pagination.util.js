const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page || '1', 10))
  const limit = Math.min(1000, Math.max(1, parseInt(query.limit || '25', 10)))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

const formatPaginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit) || 1
  return {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  }
}

module.exports = { getPagination, formatPaginatedResponse }
