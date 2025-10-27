import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import ReminderService from '#services/reminder_service'
import User from '#models/user'

export default class ProcessReminders extends BaseCommand {
  static commandName = 'process:reminders'
  static description = 'Process due reminders and send notifications'

  static options: CommandOptions = {}

  async run() {
    this.logger.info('Starting reminder processing...')

    const reminderService = new ReminderService()

    try {
      // Get all users who have reminders
      const users = await User.query().whereHas('reminders')

      let totalProcessed = 0

      for (const user of users) {
        this.logger.info(`Processing reminders for user ${user.id} (${user.email})`)

        const result = await reminderService.processDueRemindersForUser(user.id)
        totalProcessed += result.processedCount

        if (result.processedCount > 0) {
          this.logger.info(`Processed ${result.processedCount} reminders for user ${user.id}`)
        }
      }

      this.logger.info(`Reminder processing completed. Total processed: ${totalProcessed}`)
    } catch (error) {
      this.logger.error('Error processing reminders:', error)
      this.exitCode = 1
    }
  }
}
