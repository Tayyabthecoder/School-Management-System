const logger = require('../utils/logger')

class ApiError extends Error {
  constructor(statusCode, message, details = null, code = null) {
    super(message)
    this.statusCode = statusCode
    this.details = details
    this.code = code || (details && typeof details === 'object' && details.code ? details.code : null)
    Error.captureStackTrace(this, this.constructor)
  }
}

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal Server Error'
  let details = err.details || null

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation Error'
    details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }))
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 409
    const field = Object.keys(err.keyValue)[0]
    message = `Duplicate entry for field: ${field}`
    details = [{ field, message: `${field} already exists` }]
  }

  // Handle JWT Error
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid authentication token'
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Authentication token expired'
  }

  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'An unexpected internal server error occurred.'
    details = null
  }

  if (process.env.NODE_ENV !== 'test') {
    logger.error(`${req.method} ${req.originalUrl} - ${statusCode}: ${err.message}`, {
      stack: statusCode === 500 ? err.stack : undefined,
    })
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || (err.details && err.details.code) || err.name || 'API_ERROR',
      message,
      ...(details && { details }),
    },
  })
}

module.exports = { ApiError, errorHandler }
