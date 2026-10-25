const express = require('express')
const path = require('path')
const cors = require('cors')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const mongoSanitize = require('express-mongo-sanitize')
const rateLimit = require('express-rate-limit')
const env = require('./config/env')
const loggerMiddleware = require('./middleware/logger.middleware')
const { errorHandler } = require('./middleware/error.middleware')

// Routes imports
const authRoutes = require('./modules/auth/auth.routes')
const usersRoutes = require('./modules/users/users.routes')
const studentsRoutes = require('./modules/students/students.routes')
const classesRoutes = require('./modules/classes/classes.routes')
const timetableRoutes = require('./modules/timetable/timetable.routes')
const attendanceRoutes = require('./modules/attendance/attendance.routes')
const gradesRoutes = require('./modules/grades/grades.routes')
const financeRoutes = require('./modules/finance/finance.routes')
const hrRoutes = require('./modules/hr/hr.routes')
const reportsRoutes = require('./modules/reports/reports.routes')
const reportCardsRoutes = require('./modules/reportcards/reportcards.routes')
const guardianRoutes = require('./modules/guardian/guardian.routes')
const teachersRoutes = require('./modules/teachers/teachers.routes')
const subjectsRoutes = require('./modules/subjects/subjects.routes')
const settingsRoutes = require('./modules/settings/settings.routes')
const uploadsRoutes = require('./modules/uploads/uploads.routes')
const serveUploadsRoutes = require('./modules/uploads/serve.routes')
const { verifyToken } = require('./middleware/auth.middleware')
const { RedisStore } = require('rate-limit-redis')
const { getRedisClient, checkRedisAvailable } = require('./config/redis')

const app = express()

// Trust reverse proxy (Nginx) for accurate client IP identification in rate limiting & audit logs
app.set('trust proxy', 1)

// Security & Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-origin' },
}))
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())
app.use(mongoSanitize())

if (env.NODE_ENV !== 'test') {
  app.use(loggerMiddleware)
}

// Helper to configure Redis-backed rate limiter store if available
const createRateLimiterStore = () => {
  try {
    const client = getRedisClient()
    if (client && checkRedisAvailable()) {
      return new RedisStore({
        sendCommand: (...args) => client.call(...args),
      })
    }
  } catch (e) {
    // Fall back to in-memory store
  }
  return undefined
}

// Rate Limiter for Login Endpoint (10 attempts per 15 mins)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimiterStore(),
  message: { success: false, error: { message: 'Too many login attempts. Please try again in 15 minutes.' } },
})
app.use('/api/v1/auth/login', loginLimiter)

// Rate Limiter for Refresh Endpoint (30 requests per 15 mins)
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimiterStore(),
  message: { success: false, error: { message: 'Too many token refresh attempts. Please try again later.' } },
})
app.use('/api/v1/auth/refresh', refreshLimiter)

// Rate Limiter for Password Change Endpoint (5 requests per 15 mins)
const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimiterStore(),
  message: { success: false, error: { message: 'Too many password change attempts. Please try again later.' } },
})
app.use('/api/v1/auth/change-password', changePasswordLimiter)

// Rate Limiter for Heavy Endpoints
const heavyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimiterStore(),
  message: { success: false, error: { message: 'Too many requests. Please wait a moment.' } },
})
app.use('/api/v1/students/import', heavyLimiter)
app.use('/api/v1/students/import-excel', heavyLimiter)
app.use('/api/v1/students/bulk-import', heavyLimiter)
app.use('/api/v1/reports/custom/export', heavyLimiter)
app.use('/api/v1/reports/export', heavyLimiter)

// Welcome & API Information (sanitized, no internal env leaks)
app.get(['/', '/api', '/api/v1'], (req, res) => {
  res.json({
    success: true,
    message: 'School Management System (SMS) REST API is running.',
    version: '1.0.0',
    documentation: {
      healthCheck: '/api/v1/health',
      frontendUrl: env.CORS_ORIGIN || 'http://localhost:3000',
    },
    note: 'This is the backend REST API service. To interact with the graphical user interface, open the frontend application in your browser at http://localhost:3000.',
  })
})

// Health Check (clean status without environment disclosure)
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Protected authenticated file serving for uploads
app.use('/uploads', verifyToken, serveUploadsRoutes)
app.use('/api/v1/uploads/files', verifyToken, serveUploadsRoutes)

// API V1 Routes
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', usersRoutes)
app.use('/api/v1/students', studentsRoutes)
app.use('/api/v1/classes', classesRoutes)
app.use('/api/v1/subjects', subjectsRoutes)
app.use('/api/v1/teachers', teachersRoutes)
app.use('/api/v1/timetable', timetableRoutes)
app.use('/api/v1/attendance', attendanceRoutes)
app.use('/api/v1/grades', gradesRoutes)
app.use('/api/v1/finance', financeRoutes)
app.use('/api/v1/hr', hrRoutes)
app.use('/api/v1/reports', reportsRoutes)
app.use('/api/v1/report-cards', reportCardsRoutes)
app.use('/api/v1/guardian', guardianRoutes)
app.use('/api/v1/settings', settingsRoutes)
app.use('/api/v1/uploads', uploadsRoutes)

// 404 Route Handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: { message: `Route ${req.originalUrl} not found` } })
})

// Global Error Handler
app.use(errorHandler)

module.exports = app
