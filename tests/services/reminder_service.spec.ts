import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Reminder from '#models/reminder'
import User from '#models/user'
import ReminderService from '#services/reminder_service'

test.group('ReminderService', (group) => {
  group.each.setup(async () => {
    // Ensure env disables Pusher during test
    delete process.env.PUSHER_APP_ID
    delete process.env.PUSHER_APP_KEY
    delete process.env.PUSHER_APP_SECRET
    delete process.env.PUSHER_CLUSTER
  })

  test('processes due email reminder without pusher', async ({ expect }) => {
    // Arrange
    const user = await User.create({
      fullName: 'Reminder Tester',
      email: `tester_${Date.now()}@example.com`,
      password: 'password',
    })

    const reminder = await Reminder.create({
      userId: user.id,
      title: 'Test Reminder',
      message: 'This is a test',
      remindAt: DateTime.utc(),
      channels: ['email'], // choose email to bypass pusher dependency
      sentWeb: false,
      sentEmail: false,
      sentAt: null,
    })

    const service = new ReminderService()

    // Act
    const result = await service.processDueRemindersForUser(user.id)

    // Assert
    expect(result.processedCount).toEqual(1)

    const fresh = await Reminder.findOrFail(reminder.id)
    expect(fresh.sentEmail).toBe(true)
    expect(fresh.sentAt).toBeDefined()
  })
})
