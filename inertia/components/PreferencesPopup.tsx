import React, { useState, useEffect } from 'react'
import { X, User, Bell, Mail, Settings } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Switch } from './ui/switch'

interface PreferencesPopupProps {
  onClose: () => void
  user: any
}

export default function PreferencesPopup({ onClose, user }: PreferencesPopupProps) {
  const { updateUser } = useAuth()
  const [preferences, setPreferences] = useState({
    emailNotificationsEnabled: user?.emailNotificationsEnabled ?? true,
    webNotificationsEnabled: user?.webNotificationsEnabled ?? true,
    reminderEmailsEnabled: user?.reminderEmailsEnabled ?? true,
    reminderWebEnabled: user?.reminderWebEnabled ?? true,
  })

  // Update preferences when user data changes
  useEffect(() => {
    if (user) {
      setPreferences({
        emailNotificationsEnabled: user.emailNotificationsEnabled ?? true,
        webNotificationsEnabled: user.webNotificationsEnabled ?? true,
        reminderEmailsEnabled: user.reminderEmailsEnabled ?? true,
        reminderWebEnabled: user.reminderWebEnabled ?? true,
      })
    }
  }, [user])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    console.log('Sending preferences:', preferences)

    try {
      const getCsrfToken = (): string => {
        // Prefer meta tag
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null
        if (meta?.content) return meta.content.trim()
        // Fallback: common cookie name used by many backends
        const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/)
        return match ? decodeURIComponent(match[1]) : ''
      }

      const getXsrfCookie = (): string => {
        const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/)
        return match ? decodeURIComponent(match[1]) : ''
      }

      const doPost = async () => fetch('/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Send multiple common header names to satisfy middleware
          'X-CSRF-Token': getCsrfToken(),
          'X-CSRF-TOKEN': getCsrfToken(),
          'X-XSRF-TOKEN': getXsrfCookie(),
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: JSON.stringify(preferences)
      })

      let response = await doPost()

      console.log('Response status:', response.status)

      const contentType = response.headers.get('content-type') || ''

      if (!response.ok) {
        // Try to recover from CSRF/redirect by priming a GET and retrying once
        const text = await response.text()
        const looksHtml = (response.headers.get('content-type') || '').includes('text/html')
        if ((response.status === 419 || response.status === 302 || looksHtml) && !text.includes('retry-done')) {
          try {
            await fetch('/user/preferences', { method: 'GET', credentials: 'include', headers: { 'Accept': 'text/html,*/*' } })
            response = await doPost()
          } catch {}
        }
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`)
        }
      }

      if (!contentType.includes('application/json')) {
        const text2 = await response.text()
        throw new Error(`Unexpected response (content-type=${contentType}). Body: ${text2.slice(0, 200)}`)
      }

      const result = await response.json()
      console.log('Response data:', result)

      // Show success message
      alert('Preferences updated successfully!')
      // Update in-memory auth user so UI reflects changes immediately
      updateUser({
        emailNotificationsEnabled: preferences.emailNotificationsEnabled,
        webNotificationsEnabled: preferences.webNotificationsEnabled,
        reminderEmailsEnabled: preferences.reminderEmailsEnabled,
        reminderWebEnabled: preferences.reminderWebEnabled,
      })
      onClose()
    } catch (error) {
      console.error('Failed to update preferences:', error)
      alert('Failed to update preferences. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePreferenceChange = (key: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2C2C2E] rounded-2xl p-6 w-full max-w-md border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Notification Preferences</h2>
              <p className="text-sm text-gray-400 text-white">Manage your notification settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#3A3A3C] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white">Email Notifications</h3>
            </div>
            
            <div className="space-y-3 pl-8">
              <div className="flex items-center justify-between p-3 bg-[#3A3A3C] rounded-lg">
                <div>
                  <p className="text-white font-medium">General Email Notifications</p>
                  <p className="text-sm text-gray-400">Receive general email updates</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    preferences.emailNotificationsEnabled 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-600 text-gray-300'
                  }`}>
                    {preferences.emailNotificationsEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <Switch
                    checked={preferences.emailNotificationsEnabled}
                    onCheckedChange={(checked) => handlePreferenceChange('emailNotificationsEnabled', checked)}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-[#3A3A3C] rounded-lg">
                <div>
                  <p className="text-white font-medium">Reminder Emails</p>
                  <p className="text-sm text-gray-400">Get email reminders for your tasks</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    preferences.reminderEmailsEnabled 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-600 text-gray-300'
                  }`}>
                    {preferences.reminderEmailsEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <Switch
                    checked={preferences.reminderEmailsEnabled}
                    onCheckedChange={(checked) => handlePreferenceChange('reminderEmailsEnabled', checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Web Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold text-white">Web Notifications</h3>
            </div>
            
            <div className="space-y-3 pl-8">
              <div className="flex items-center justify-between p-3 bg-[#3A3A3C] rounded-lg">
                <div>
                  <p className="text-white font-medium">Browser Notifications</p>
                  <p className="text-sm text-gray-400">Show notifications in your browser</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    preferences.webNotificationsEnabled 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-600 text-gray-300'
                  }`}>
                    {preferences.webNotificationsEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <Switch
                    checked={preferences.webNotificationsEnabled}
                    onCheckedChange={(checked) => handlePreferenceChange('webNotificationsEnabled', checked)}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-[#3A3A3C] rounded-lg">
                <div>
                  <p className="text-white font-medium">Reminder Notifications</p>
                  <p className="text-sm text-gray-400">Get real-time reminder alerts</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    preferences.reminderWebEnabled 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-600 text-gray-300'
                  }`}>
                    {preferences.reminderWebEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <Switch
                    checked={preferences.reminderWebEnabled}
                    onCheckedChange={(checked) => handlePreferenceChange('reminderWebEnabled', checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#3A3A3C] hover:bg-[#4A4A4C] text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
