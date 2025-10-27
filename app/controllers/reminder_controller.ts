import type { HttpContext } from '@adonisjs/core/http'
import Reminder from '#models/reminder'
import { DateTime } from 'luxon'
import CreateReminderValidator from '#validators/reminders/create_reminder_validator'
import UpdateReminderValidator from '#validators/reminders/update_reminder_validator'
import ReminderService from '#services/reminder_service'
import EmailService from '#services/email_service'
import Pusher from 'pusher'

export default class ReminderController {
  private isInertiaRequest(request: HttpContext['request']) {
    return request.header('x-inertia') === 'true'
  }

  // List reminders for the authenticated user
  async index({ auth, request, response, inertia }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.getUserOrFail()
      const page = Number(request.input('page', 1))
      const limit = Number(request.input('limit', 50))

      const reminders = await Reminder.query()
        .where('user_id', user.id)
        .orderBy('remind_at', 'asc')
        .paginate(page, limit)

      // Always render Inertia page for browser requests
      if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
        const raw = reminders.serialize().data || []
        const normalized = raw.map((r: any) => {
          const remindAtField = r.remindAt || r.remind_at
          try {
            // Keep the original timezone info - don't convert to UTC
            if (remindAtField && typeof remindAtField === 'string') {
              console.log('[Reminder API] Keeping original timezone:', remindAtField)
              if (remindAtField.includes(' ') && !remindAtField.includes('T')) {
                // SQL format: convert to ISO but keep as local time
                const withT = remindAtField.replace(' ', 'T')
                // Add timezone info if missing (assume Asia/Karachi for existing data)
                const normalized = withT.endsWith('Z') ? withT : withT + '+05:00'
                r.remindAt = normalized
                r.remind_at = normalized
                console.log('[Reminder API] Converted SQL to local time:', normalized)
              } else if (remindAtField.includes('+') || remindAtField.includes('-')) {
                // Already has timezone, keep as-is
                r.remindAt = remindAtField
                r.remind_at = remindAtField
                console.log('[Reminder API] Kept original timezone:', remindAtField)
              } else {
                // UTC format, convert to local timezone
                const dt = DateTime.fromISO(remindAtField, { zone: 'utc' })
                const local = dt.setZone('Asia/Karachi')
                const normalized = local.toISO()
                r.remindAt = normalized
                r.remind_at = normalized
                console.log('[Reminder API] Converted UTC to local:', normalized)
              }
            }
          } catch (e) {
            console.warn('[Reminder API] Failed to process remindAt:', remindAtField, e)
          }
          return r
        })
        return inertia.render('reminders/index', {
          reminders: normalized,
          user: user.serialize(),
        })
      }

      return response.ok(reminders)
    } catch (error) {
      // Handle authentication errors
      if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
        if (error.message?.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
          return response.redirect('/login')
        }
        return inertia.render('errors/server_error', {
          error: error.message || 'Failed to fetch reminders',
        })
      }

      if (error.message?.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
        return response.unauthorized({ message: 'Unauthorized', error: error.message })
      }
      return response
        .status(500)
        .send({ message: 'Failed to fetch reminders', error: error.message })
    }
  }

  // Show one reminder
  async show({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const reminder = await Reminder.query()
      .where('user_id', user.id)
      .where('id', params.id)
      .firstOrFail()
    return response.ok(reminder)
  }

  // Create
  async store({ auth, request, response }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.getUserOrFail()

      if (!user || !user.id) {
        if (this.isInertiaRequest(request)) {
          return response.redirect('/login')
        } else {
          return response.unauthorized({ message: 'Authentication required' })
        }
      }

      const payload = await request.validateUsing(CreateReminderValidator)

      console.log('[Reminder API] Create payload (raw):', payload)
      const parsedCreate = DateTime.fromISO(payload.remindAt)
      console.log(
        '[Reminder API] Parsed incoming ISO ->',
        parsedCreate.toISO(),
        'offset (minutes):',
        parsedCreate.offset
      )

      const reminder = await Reminder.create({
        userId: user.id,
        title: payload.title,
        message: payload.message ?? null,
        // Store as-is (with timezone info)
        remindAt: parsedCreate,
        channels: payload.channels ?? ['web'],
        sentWeb: false,
        sentEmail: false,
        sentAt: null,
      })
      console.log('[Reminder API] Created reminder stored:', reminder.remindAt.toISO())

      // Emit realtime event so clients can log/view the newly created reminder immediately
      try {
        if (process.env.PUSHER_APP_ID) {
          const pusher = new Pusher({
            appId: process.env.PUSHER_APP_ID!,
            key: process.env.PUSHER_APP_KEY!,
            secret: process.env.PUSHER_APP_SECRET!,
            cluster: process.env.PUSHER_CLUSTER!,
            useTLS: true,
          })
          await pusher.trigger(`private-user.${user.id}`, 'reminder.created', {
            reminder: {
              id: reminder.id,
              title: reminder.title,
              message: reminder.message,
              remindAt: reminder.remindAt.toISO(),
              channels: reminder.channels,
            },
          })
          console.log('[Reminder API] Emitted reminder.created for user', user.id)
        } else {
          console.warn('[Reminder API] Pusher env not configured; reminder.created not emitted')
        }
      } catch (e) {
        console.error('[Reminder API] Failed to emit reminder.created', e)
      }

      // Proper response handling for Inertia
      if (this.isInertiaRequest(request)) {
        // For Inertia requests, redirect back to reminders page
        return response.redirect('/reminders')
      } else {
        // For API requests, return JSON with complete reminder data
        return response.created({
          message: 'Reminder created successfully',
          reminder: {
            id: reminder.id,
            title: reminder.title,
            message: reminder.message,
            remindAt: reminder.remindAt.toISO(),
            channels: reminder.channels,
            sentWeb: reminder.sentWeb,
            sentEmail: reminder.sentEmail,
            createdAt: reminder.createdAt.toISO(),
            updatedAt: reminder.updatedAt?.toISO(),
          },
        })
      }
    } catch (error) {
      // Better error handling for Inertia
      if (this.isInertiaRequest(request)) {
        if (error.message?.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
          return response.redirect('/login')
        }

        // For validation errors, redirect back
        if (error.messages) {
          return response.redirect().back()
        }

        // Generic error for Inertia - redirect back
        return response.redirect().back()
      }

      // For API requests, return JSON error
      if (error.message?.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
        return response.unauthorized({ message: 'Unauthorized', error: error.message })
      }

      if (error.messages) {
        return response.badRequest({ message: 'Validation failed', errors: error.messages })
      }

      return response
        .status(500)
        .send({ message: 'Failed to create reminder', error: error.message })
    }
  }

  // Update
  async update({ auth, params, request, response }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.getUserOrFail()

      if (!user || !user.id) {
        if (this.isInertiaRequest(request)) {
          return response.redirect('/login')
        } else {
          return response.unauthorized({ message: 'Authentication required' })
        }
      }

      const payload = await request.validateUsing(UpdateReminderValidator)

      const reminder = await Reminder.query()
        .where('user_id', user.id)
        .where('id', params.id)
        .firstOrFail()

      if (payload.title !== undefined) reminder.title = payload.title
      if (payload.message !== undefined) reminder.message = payload.message
      if (payload.remindAt !== undefined) {
        const parsedUpdate = DateTime.fromISO(payload.remindAt)
        console.log('[Reminder API] Update payload remindAt (raw):', payload.remindAt)
        console.log(
          '[Reminder API] Update parsed incoming ISO ->',
          parsedUpdate.toISO(),
          'offset (minutes):',
          parsedUpdate.offset,
          'as UTC ->',
          parsedUpdate.toUTC().toISO()
        )
        // Frontend sends UTC ISO. Parse and keep UTC.
        reminder.remindAt = parsedUpdate.toUTC()
      }
      if (payload.channels !== undefined) reminder.channels = payload.channels

      await reminder.save()

      // Proper response handling for Inertia
      if (this.isInertiaRequest(request)) {
        return response.redirect('/reminders')
      } else {
        return response.ok({
          message: 'Reminder updated successfully',
          reminder: {
            id: reminder.id,
            title: reminder.title,
            message: reminder.message,
            remindAt: reminder.remindAt.toISO(),
            channels: reminder.channels,
            sentWeb: reminder.sentWeb,
            sentEmail: reminder.sentEmail,
            updatedAt: reminder.updatedAt?.toISO(),
          },
        })
      }
    } catch (error) {
      if (this.isInertiaRequest(request)) {
        if (error.message?.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
          return response.redirect('/login')
        }
        return response.redirect().back()
      }

      if (error.message?.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
        return response.unauthorized({ message: 'Unauthorized', error: error.message })
      }

      if (error.messages) {
        return response.badRequest({ message: 'Validation failed', errors: error.messages })
      }

      return response
        .status(500)
        .send({ message: 'Failed to update reminder', error: error.message })
    }
  }

  // Delete
  async destroy({ auth, params, request, response }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.getUserOrFail()

      if (!user || !user.id) {
        if (this.isInertiaRequest(request)) {
          return response.redirect('/login')
        } else {
          return response.unauthorized({ message: 'Authentication required' })
        }
      }

      const reminder = await Reminder.query()
        .where('user_id', user.id)
        .where('id', params.id)
        .firstOrFail()

      await reminder.delete()

      // Proper response handling for Inertia
      if (this.isInertiaRequest(request)) {
        return response.redirect('/reminders')
      } else {
        return response.ok({ message: 'Reminder deleted successfully' })
      }
    } catch (error) {
      if (this.isInertiaRequest(request)) {
        if (error.message?.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
          return response.redirect('/login')
        }
        return response.redirect().back()
      }

      if (error.message?.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
        return response.unauthorized({ message: 'Unauthorized', error: error.message })
      }

      return response
        .status(500)
        .send({ message: 'Failed to delete reminder', error: error.message })
    }
  }

  // Test trigger: process due reminders now (for current user only)
  async trigger({ auth, response }: HttpContext) {
    try {
      const user = auth.user!
      const service = new ReminderService()
      const result = await service.processDueRemindersForUser(user.id)
      return response.ok({ processed: result.processedCount })
    } catch (error) {
      // Do not fail the request due to Pusher/network errors; report processed count 0
      console.error('[Reminder API] Trigger failed:', error)
      return response.status(200).send({
        processed: 0,
        message: 'Processed with warnings',
        error: String(error?.message || error),
      })
    }
  }

  // Send a test email to verify SMTP configuration
  async testEmail({ request, response, auth, session }: HttpContext) {
    const user = auth.user
    const to = request.input('to') || user?.email
    if (!to) {
      const isInertia = !!(request.header('X-Inertia') || request.header('x-inertia'))
      if (isInertia) {
        session.flash('error', 'Provide ?to=email or login to use your email')
        return response.redirect().back()
      }
      return response.badRequest({ error: 'Provide ?to=email or login to use your email' })
    }

    const email = new EmailService()
    const ok = await email.sendReminderEmail(to, {
      title: 'SMTP Test',
      message: 'This is a test email to verify SMTP configuration.',
      remindAt: new Date().toISOString(),
    })

    const isInertia = !!(request.header('X-Inertia') || request.header('x-inertia'))
    if (isInertia) {
      if (!ok) {
        session.flash('error', 'Failed to send email')
        return response.redirect().back()
      }
      session.flash('success', `Email sent to ${to}`)
      return response.redirect().back()
    }

    if (!ok) return response.internalServerError({ ok: false, message: 'Failed to send email' })
    return response.ok({ ok: true, message: `Email sent to ${to}` })
  }
}
