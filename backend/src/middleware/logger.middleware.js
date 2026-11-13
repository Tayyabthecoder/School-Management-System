const logger = require('../utils/logger')

const loggerMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    return next()
  }
  const start = Date.now()
  res.on('finish', () => {
    const elapsed = Date.now() - start
    const len = res.getHeader('content-length') || '-'
    // Log the path only: query strings carry search terms and student identifiers (PII).
    const urlPath = String(req.originalUrl || req.url || '').split('?')[0]
    logger.http(`${req.method} ${urlPath} ${res.statusCode} ${len} - ${elapsed} ms`)
  })
  next()
}

module.exports = loggerMiddleware
