import React, { useState } from 'react'
import { Head } from '@inertiajs/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Switch } from '../../components/ui/switch'
import { Label } from '../../components/ui/label'
import { Bell, Mail, Globe, Clock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface User {
  id: number
  email: string
  fullName: string | null
  emailNotificationsEnabled: boolean
  webNotificationsEnabled: boolean
  reminderEmailsEnabled: boolean
  reminderWebEnabled: boolean
}

interface Props {
  user: User
}

export default function UserPreferences({ user }: Props) {
  const auth = useAuth()
  const updateUser = 'updateUser' in auth ? auth.updateUser : (() => {})
  const [preferences, setPreferences] = useState({
    emailNotificationsEnabled: user.emailNotificationsEnabled,
    webNotificationsEnabled: user.webNotificationsEnabled,
    reminderEmailsEnabled: user.reminderEmailsEnabled,
    reminderWebEnabled: user.reminderWebEnabled,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const getCsrfToken = (): string => {
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null
        if (meta?.content) return meta.content.trim()
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

      const contentType = response.headers.get('content-type') || ''

      if (!response.ok) {
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
        const text = await response.text()
        throw new Error(`Unexpected response (content-type=${contentType}). Body: ${text.slice(0, 200)}`)
      }

      // Show success message (you can add a toast here)
      alert('Preferences updated successfully!')
      updateUser({
        emailNotificationsEnabled: preferences.emailNotificationsEnabled,
        webNotificationsEnabled: preferences.webNotificationsEnabled,
        reminderEmailsEnabled: preferences.reminderEmailsEnabled,
        reminderWebEnabled: preferences.reminderWebEnabled,
      })
    } catch (error) {
      console.error('Failed to update preferences:', error)
      alert('Failed to update preferences. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Head title="Notification Preferences" />
      
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Notification Preferences</h1>
          <p className="text-gray-600 mt-2">
            Manage how you receive notifications and reminders
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* General Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  General Notifications
                </CardTitle>
                <CardDescription>
                  Control your overall notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Notifications
                    </Label>
                    <p className="text-sm text-gray-600">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={preferences.emailNotificationsEnabled}
                    onCheckedChange={() => handleToggle('emailNotificationsEnabled')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="web-notifications" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Web Notifications
                    </Label>
                    <p className="text-sm text-gray-600">
                      Receive browser notifications
                    </p>
                  </div>
                  <Switch
                    id="web-notifications"
                    checked={preferences.webNotificationsEnabled}
                    onCheckedChange={() => handleToggle('webNotificationsEnabled')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Reminder Specific */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Reminder Settings
                </CardTitle>
                <CardDescription>
                  Specific settings for reminder notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reminder-emails" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Reminder Emails
                    </Label>
                    <p className="text-sm text-gray-600">
                      Receive reminder notifications via email
                    </p>
                  </div>
                  <Switch
                    id="reminder-emails"
                    checked={preferences.reminderEmailsEnabled}
                    onCheckedChange={() => handleToggle('reminderEmailsEnabled')}
                    disabled={!preferences.emailNotificationsEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reminder-web" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Reminder Web Notifications
                    </Label>
                    <p className="text-sm text-gray-600">
                      Receive reminder notifications in browser
                    </p>
                  </div>
                  <Switch
                    id="reminder-web"
                    checked={preferences.reminderWebEnabled}
                    onCheckedChange={() => handleToggle('reminderWebEnabled')}
                    disabled={!preferences.webNotificationsEnabled}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-32"
              >
                {isSubmitting ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}
