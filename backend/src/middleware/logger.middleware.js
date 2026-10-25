const morgan = require('morgan')
const logger = require('../utils/logger')

const morganFormat = ':method :url :status :res[content-length] - :response-time ms'

const loggerMiddleware = morgan(morganFormat, {
  stream: logger.stream,
  skip: () => process.env.NODE_ENV === 'test',
})

module.exports = loggerMiddleware
