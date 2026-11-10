const app = require('./app')
const env = require('./config/env')
const connectDB = require('./config/database')

const startServer = async () => {
  await connectDB()

  // Bring built-in role permissions in existing databases in line with src/config/roles.js
  try {
    const { syncDefaultRoles } = require('./config/roles')
    await syncDefaultRoles(require('./models/Role.model'))
    console.log('[RBAC]: Built-in role permissions synchronised.')
  } catch (err) {
    console.error('[RBAC]: Failed to synchronise role permissions:', err.message)
  }

  // Older databases may have several active academic years (DATA-01); keep exactly one
  try {
    const { normalizeActiveAcademicYear } = require('./services/academic-year.service')
    const { previouslyActive, activeId } = await normalizeActiveAcademicYear()
    if (previouslyActive !== 1) {
      console.log(`[AcademicYear]: ${previouslyActive} active years found; active year is now ${activeId || 'none'}.`)
    }
  } catch (err) {
    console.error('[AcademicYear]: Failed to normalise the active academic year:', err.message)
  }

  const PORT = env.PORT || 5000

  // Start background queue workers & cron schedules
  const { initQueues } = require('./jobs/queues')
  initQueues()
  const { initFeeOverdueSchedule } = require('./jobs/fee-overdue.worker')
  initFeeOverdueSchedule()
  const { initMonthlyChallanCron } = require('./jobs/monthly-challan.cron')
  initMonthlyChallanCron()

  const server = app.listen(PORT, () => {
    console.log(`=================================================`)
    console.log(`🚀 School Management System (SMS) Backend Server`)
    console.log(`📡 Environment: ${env.NODE_ENV}`)
    console.log(`🌐 Server running at: http://localhost:${PORT}`)
    console.log(`=================================================`)
  })

  // Graceful shutdown handling for container stops and rolling updates
  const handleShutdown = async (signal) => {
    console.log(`\n[Server]: Received ${signal}. Starting graceful shutdown...`)
    server.close(async () => {
      console.log('[Server]: HTTP server closed to new connections.')
      try {
        const mongoose = require('mongoose')
        await mongoose.connection.close()
        console.log('[MongoDB]: Database connection closed cleanly.')
      } catch (err) {
        console.error('[MongoDB]: Error during disconnect:', err.message)
      }
      process.exit(0)
    })

    // Force termination if operations take longer than 10 seconds
    setTimeout(() => {
      console.error('[Server]: Forced termination after timeout.')
      process.exit(1)
    }, 10000).unref()
  }

  process.on('SIGTERM', () => handleShutdown('SIGTERM'))
  process.on('SIGINT', () => handleShutdown('SIGINT'))
}

startServer()
