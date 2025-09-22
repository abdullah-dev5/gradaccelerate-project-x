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
    const now = DateTime.now().setZone('Asia/Karachi') // Use local timezone
    console.log('[Reminder Service] ===== PROCESSING REMINDERS =====')
    console.log('[Reminder Service] Processing due reminders for user:', userId)
    console.log('[Reminder Service] Current time local (Asia/Karachi):', now.toISO())
    console.log('[Reminder Service] Current time SQL format:', now.toSQL())
    
    // First, let's see ALL reminders for this user
    const allReminders = await Reminder.query()
      .where('user_id', userId)
      .orderBy('remind_at', 'desc')
    
    console.log('[Reminder Service] All reminders for user:', allReminders.length)
    for (const reminder of allReminders) {
      console.log('[Reminder Service] All reminder:', {
        id: reminder.id,
        title: reminder.title,
        remindAt: reminder.remindAt,
        remindAtISO: reminder.remindAt?.toISO?.(),
        sentWeb: reminder.sentWeb,
        sentEmail: reminder.sentEmail
      })
    }
    
    // Convert current time to SQL format for database comparison
    const nowSql = now.toFormat('yyyy-MM-dd HH:mm:ss')
    console.log('[Reminder Service] Comparing against SQL format:', nowSql)
    
    const dueReminders = await Reminder.query()
      .where('user_id', userId)
      .where('remind_at', '<=', nowSql)
      .where((q) => {
        q.where('sent_web', false).orWhere('sent_email', false)
      })
    
    console.log('[Reminder Service] Found due reminders:', dueReminders.length)
    for (const reminder of dueReminders) {
      console.log('[Reminder Service] Due reminder:', {
        id: reminder.id,
        title: reminder.title,
        remindAt: reminder.remindAt,
        remindAtISO: reminder.remindAt?.toISO?.(),
        sentWeb: reminder.sentWeb,
        sentEmail: reminder.sentEmail
      })
    }

    const pusher = this.getPusher()
    if (!pusher) {
      console.warn('[Reminder Service] Pusher not configured (missing env). Web notifications will be skipped.')
    }
    const user = await User.findOrFail(userId)
    let processed = 0

    for (const reminder of dueReminders) {
      const sendWeb = reminder.channels.includes('web') && !reminder.sentWeb && (user.webNotificationsEnabled ?? true) && (user.reminderWebEnabled ?? true)
      const sendEmail = reminder.channels.includes('email') && !reminder.sentEmail && (user.emailNotificationsEnabled ?? true) && (user.reminderEmailsEnabled ?? true)
      console.log('[Reminder Service] Delivery decision:', { id: reminder.id, sendWeb, sendEmail, channels: reminder.channels })

      if (sendWeb && pusher) {
        console.log('[Reminder Service] Triggering Pusher event for user channel', `private-user.${reminder.userId}`)
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
        console.log('[Reminder Service] Sending reminder email to', user.email)
        const emailSent = await this.emailService.sendReminderEmail(user.email, {
          title: reminder.title,
          message: reminder.message || undefined,
          remindAt: reminder.remindAt.toISO() || new Date().toISOString(),
        })
        if (emailSent) {
          console.log('[Reminder Service] Email sent OK for reminder', reminder.id)
          reminder.sentEmail = true
        }
      }

      if (sendWeb || (sendEmail && reminder.sentEmail)) {
        reminder.sentAt = DateTime.now().setZone('Asia/Karachi')
        await reminder.save()
        console.log('[Reminder Service] Marked reminder as sent:', { id: reminder.id, sentAt: reminder.sentAt.toISO() })
        processed += 1
      }
    }

    console.log('[Reminder Service] Processing completed. Total processed:', processed)
    return { processedCount: processed }
  }
}


