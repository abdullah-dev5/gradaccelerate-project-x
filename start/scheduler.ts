import cron from 'node-cron'
import ReminderService from '#services/reminder_service'
import User from '#models/user'

const enabled = process.env.SCHEDULER_ENABLED === 'true'
let isRunning = false

function log(...args: unknown[]) {
  // Keep logs concise; expand if needed
  console.log('[Scheduler]', ...args)
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
  // Every minute
  cron.schedule('* * * * *', async () => {
    await processAllUsersDueReminders()
  })
  log('Initialized. Schedule: every minute (SCHEDULER_ENABLED=true)')
} else {
  log('Scheduler disabled. Set SCHEDULER_ENABLED=true to enable.')
}





