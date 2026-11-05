const app = require('./app')
const env = require('./config/env')
const connectDB = require('./config/database')

const startServer = async () => {
  await connectDB()
  const PORT = env.PORT || 5000

  // Start background queue workers & cron schedules
  const { initQueues } = require('./jobs/queues')
  initQueues()
  require('./jobs/fee-overdue.worker')
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
