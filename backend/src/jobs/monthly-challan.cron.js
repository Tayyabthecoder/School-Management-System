const cron = require('node-cron')
const { generateMonthlyFeeChallans } = require('../services/monthly-challan.service')

let monthlyChallanJob = null

/**
 * Initializes the automated monthly fee challan cron job.
 * Runs on the 1st of every month at midnight (00:00:00) in Asia/Karachi timezone.
 */
const initMonthlyChallanCron = () => {
  try {
    // Cron pattern: 0 0 1 * * (At 00:00 on day-of-month 1)
    monthlyChallanJob = cron.schedule(
      '0 0 1 * *',
      async () => {
        console.log(`[Monthly Challan Cron]: Starting automated fee challan generation on 1st of month at ${new Date().toISOString()}`)
        try {
          const result = await generateMonthlyFeeChallans({
            targetDate: new Date(),
            executedBy: 'CRON_SYSTEM',
          })
          console.log(
            `[Monthly Challan Cron]: Finished successfully. Generated: ${result.generatedCount}, Skipped (already existed): ${result.skippedCount} for ${result.month} ${result.year}`
          )
        } catch (err) {
          console.error('[Monthly Challan Cron Error]: Failed to generate monthly challans:', err.message)
        }
      },
      {
        scheduled: true,
        timezone: 'Asia/Karachi',
      }
    )

    console.log('[Monthly Challan Cron]: Initialized. Scheduled for 1st of every month at 00:00 (Asia/Karachi).')
  } catch (error) {
    console.error('[Monthly Challan Cron Initialization Error]:', error.message)
  }
}

const getCronJob = () => monthlyChallanJob

const executeMonthlyChallanCronNow = async () => {
  return await generateMonthlyFeeChallans({
    targetDate: new Date(),
    executedBy: 'MANUAL_OR_TEST',
  })
}

module.exports = {
  initMonthlyChallanCron,
  getCronJob,
  executeMonthlyChallanCronNow,
}
