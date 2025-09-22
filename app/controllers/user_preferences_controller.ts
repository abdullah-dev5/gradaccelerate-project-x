import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class UserPreferencesController {
  async show({ auth, inertia }: HttpContext) {
    const user = await auth.authenticate()
    await user.refresh()
    
    return inertia.render('user/preferences', {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        emailNotificationsEnabled: user.emailNotificationsEnabled,
        webNotificationsEnabled: user.webNotificationsEnabled,
        reminderEmailsEnabled: user.reminderEmailsEnabled,
        reminderWebEnabled: user.reminderWebEnabled,
      }
    })
  }

  async update({ auth, request, response }: HttpContext) {
    const user = await auth.authenticate()
    
    // Handle both JSON and form data
    let data: any = {}
    
    if (request.header('content-type')?.includes('application/json')) {
      // Handle JSON request
      data = request.body()
    } else {
      // Handle form data
      data = request.only([
        'emailNotificationsEnabled',
        'webNotificationsEnabled', 
        'reminderEmailsEnabled',
        'reminderWebEnabled'
      ])
    }

    console.log('Received data:', data)
    console.log('Data types:', Object.keys(data).map(key => `${key}: ${typeof data[key]}`))

    // Convert string values to boolean
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string') {
        data[key] = data[key] === 'true' || data[key] === '1'
      }
    })

    console.log('Converted data:', data)

    user.merge(data)
    await user.save()

    console.log('User after save:', {
      emailNotificationsEnabled: user.emailNotificationsEnabled,
      webNotificationsEnabled: user.webNotificationsEnabled,
      reminderEmailsEnabled: user.reminderEmailsEnabled,
      reminderWebEnabled: user.reminderWebEnabled
    })

    // Return JSON response for AJAX requests, redirect for form submissions
    if (request.header('accept')?.includes('application/json')) {
      return response.json({ 
        success: true, 
        message: 'Preferences updated successfully',
        preferences: {
          emailNotificationsEnabled: user.emailNotificationsEnabled,
          webNotificationsEnabled: user.webNotificationsEnabled,
          reminderEmailsEnabled: user.reminderEmailsEnabled,
          reminderWebEnabled: user.reminderWebEnabled
        }
      })
    }

    return response.redirect().back()
  }
}
