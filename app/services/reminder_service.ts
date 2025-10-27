import Reminder from '#models/reminder'
import User from '#models/user'
import { DateTime } from 'luxon'
import Pusher from 'pusher'
import EmailService from '#services/email_service'

type ProcessResult = { processedCount: number }

export default class ReminderService {
  private emailService: EmailService

  constructor() {
    this.emailService = new EmailService()
  }

  private getPusher() {
    if (!process.env.PUSHER_APP_ID) return null
    return new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_APP_KEY!,
      secret: process.env.PUSHER_APP_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    })
  }

  async processDueRemindersForUser(userId: number): Promise<ProcessResult> {
    const now = DateTime.now()
    
    // Get all reminders for comparison
    const allReminders = await Reminder.query()
      .where('user_id', userId)
      .orderBy('remind_at', 'desc')
    
    // Filter due reminders using DateTime comparison (in memory)
    // This ensures proper timezone handling
    const dueReminders = allReminders.filter(reminder => {
      const reminderTime = reminder.remindAt
      if (!reminderTime) return false
      
      // Compare DateTime objects
      const isDue = reminderTime <= now
      
      // IMPORTANT: Convert database 0/1 to boolean
      const sentWebBool = Boolean(reminder.sentWeb)
      const sentEmailBool = Boolean(reminder.sentEmail)
      
      // Check if reminder needs to be sent (either channel not sent yet)
      const needsWeb = reminder.channels.includes('web') && !sentWebBool
      const needsEmail = reminder.channels.includes('email') && !sentEmailBool
      const needsSending = needsWeb || needsEmail
      
      return isDue && needsSending
    })

    const pusher = this.getPusher()
    if (!pusher) {
      console.warn('[Reminder Service] Pusher not configured (missing env). Web notifications will be skipped.')
    }
    const user = await User.findOrFail(userId)
    let processed = 0

    for (const reminder of dueReminders) {
      const sendWeb = reminder.channels.includes('web') && !reminder.sentWeb && (user.webNotificationsEnabled ?? true) && (user.reminderWebEnabled ?? true)
      const sendEmail = reminder.channels.includes('email') && !reminder.sentEmail && (user.emailNotificationsEnabled ?? true) && (user.reminderEmailsEnabled ?? true)

      if (sendWeb && pusher) {
        try {
        await pusher.trigger(`private-user.${reminder.userId}`, 'reminder.triggered', {
          reminder: {
            id: reminder.id,
            title: reminder.title,
            message: reminder.message,
            remindAt: reminder.remindAt.toISO(),
            channels: reminder.channels
          }
        })
        reminder.sentWeb = true
        } catch (pusherError) {
          console.error('[Reminder Service] Pusher trigger failed:', pusherError)
        }
      }

      if (sendEmail) {
        const emailSent = await this.emailService.sendReminderEmail(user.email, {
          title: reminder.title,
          message: reminder.message || undefined,
          remindAt: reminder.remindAt.toISO() || new Date().toISOString(),
        })
        if (emailSent) {
          reminder.sentEmail = true
        }
      }

      if (sendWeb || (sendEmail && reminder.sentEmail)) {
        reminder.sentAt = DateTime.now()
        await reminder.save()
        processed += 1
      }
    }
    return { processedCount: processed }
  }
}


