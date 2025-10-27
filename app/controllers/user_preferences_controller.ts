import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class UserPreferencesController {
  async update({ auth, request, response }: HttpContext) {
    try {
      console.log('🔔 Preferences update request received')
      const user = await auth.authenticate()
      await user.refresh()
      
      // Get JSON data from request
      const data = request.body()
      console.log('📥 Received data:', data)
      
      // Update only the preference fields
      if ('emailNotificationsEnabled' in data) {
        user.emailNotificationsEnabled = Boolean(data.emailNotificationsEnabled)
      }
      if ('webNotificationsEnabled' in data) {
        user.webNotificationsEnabled = Boolean(data.webNotificationsEnabled)
      }
      if ('reminderEmailsEnabled' in data) {
        user.reminderEmailsEnabled = Boolean(data.reminderEmailsEnabled)
      }
      if ('reminderWebEnabled' in data) {
        user.reminderWebEnabled = Boolean(data.reminderWebEnabled)
      }

      console.log('💾 Saving preferences...')
      await user.save()
      console.log('✅ Preferences saved successfully')

      return response.json({ 
        success: true, 
        message: 'Preferences updated successfully',
        data: {
          emailNotificationsEnabled: user.emailNotificationsEnabled,
          webNotificationsEnabled: user.webNotificationsEnabled,
          reminderEmailsEnabled: user.reminderEmailsEnabled,
          reminderWebEnabled: user.reminderWebEnabled
        }
      })
    } catch (error) {
      console.error('❌ Error updating preferences:', error)
      return response.status(500).json({ 
        success: false, 
        message: 'Failed to update preferences',
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }
}
