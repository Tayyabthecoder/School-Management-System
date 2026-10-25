const fs = require('fs')
const path = require('path')
const winston = require('winston')

// Ensure logs directory exists
const logDir = path.resolve(__dirname, '../../logs')
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

const level = () => {
  const env = process.env.NODE_ENV || 'development'
  const isDevelopment = env === 'development'
  return isDevelopment ? 'debug' : 'info'
}

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

winston.addColors(colors)

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `[${info.timestamp}] [${info.level.toUpperCase()}]: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
)

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(
        (info) => `[${info.timestamp}] [${info.level}]: ${info.message}`
      )
    ),
    silent: process.env.NODE_ENV === 'test',
  }),
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.uncolorize(),
      format
    ),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    silent: process.env.NODE_ENV === 'test',
  }),
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    format: winston.format.combine(
      winston.format.uncolorize(),
      format
    ),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    silent: process.env.NODE_ENV === 'test',
  }),
]

const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
})

// Stream interface for Morgan integration
logger.stream = {
  write: (message) => {
    logger.http(message.trim())
  },
}

module.exports = logger
