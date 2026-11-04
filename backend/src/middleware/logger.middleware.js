const logger = require('../utils/logger')

const loggerMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    return next()
  }
  const start = Date.now()
  res.on('finish', () => {
    const elapsed = Date.now() - start
    const len = res.getHeader('content-length') || '-'
    logger.http(`${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${len} - ${elapsed} ms`)
  })
  next()
}

module.exports = loggerMiddleware
