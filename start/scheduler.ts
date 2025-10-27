import cron from 'node-cron'
import ReminderService from '#services/reminder_service'
import User from '#models/user'

const enabled = process.env.SCHEDULER_ENABLED === 'true'
let isRunning = false

function log(...args: unknown[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Scheduler]', ...args)
  }
}

async function processAllUsersDueReminders() {
  if (isRunning) {
    return log('Skip run: previous run still in progress')
  }
  isRunning = true
  const startedAt = Date.now()
  try {
    const service = new ReminderService()
    const users = await User.query().select('id')
    let totalProcessed = 0
    for (const u of users) {
      try {
        const res = await service.processDueRemindersForUser(u.id)
        totalProcessed += res.processedCount
      } catch (e) {
        console.error('[Scheduler] Error processing user', u.id, e)
      }
    }
    log('Run complete. Users:', users.length, 'Processed reminders:', totalProcessed, 'Duration(ms):', Date.now() - startedAt)
  } catch (e) {
    console.error('[Scheduler] Fatal error:', e)
  } finally {
    isRunning = false
  }
}

if (enabled) {
  log('Scheduler enabled - running every minute')
  // Every minute
  cron.schedule('* * * * *', async () => {
    await processAllUsersDueReminders()
  })
  
  // Run immediately on startup (delay to ensure DB is ready)
  setTimeout(async () => {
    log('Running initial check for due reminders...')
    await processAllUsersDueReminders()
  }, 5000)
} else {
  console.log('[Scheduler] Disabled. Set SCHEDULER_ENABLED=true in .env to enable.')
}





