const app = require('./app')
const env = require('./config/env')
const connectDB = require('./config/database')

const startServer = async () => {
  await connectDB()
  const PORT = env.PORT || 5000

  // Start background queue workers & cron schedules
  require('./jobs/fee-overdue.worker')
  const { initMonthlyChallanCron } = require('./jobs/monthly-challan.cron')
  initMonthlyChallanCron()

  app.listen(PORT, () => {
    console.log(`=================================================`)
    console.log(`🚀 School Management System (SMS) Backend Server`)
    console.log(`📡 Environment: ${env.NODE_ENV}`)
    console.log(`🌐 Server running at: http://localhost:${PORT}`)
    console.log(`=================================================`)
  })
}

startServer()
