import React, { useState, useEffect } from 'react'
const DEBUG_REMINDERS = false
const SKIP_RELOAD_AFTER_TRIGGER = true
import { DateTime } from 'luxon'
import { Head, Link, router } from '@inertiajs/react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { useToast } from '../../hooks/useToast'
import { useReminderNotifications } from '../../hooks/useReminderNotifications'
import { notificationService } from '../../services/notificationService'
import { Trash2, Edit, Bell, Mail, Globe, ArrowLeft } from 'lucide-react'

interface Reminder {
  id: number
  title: string
  message?: string
  remindAt: string
  remind_at?: string
  channels: string[]
  sentWeb: boolean
  sentEmail: boolean
  createdAt: string
}

interface ReminderFormData {
  title: string
  message: string
  remindAt: string
  channels: string[]
}

interface RemindersPageProps {
  reminders: Reminder[]
  user: {
    id: number
    fullName: string
    email: string
  }
}

export default function RemindersIndex({ reminders = [], user }: RemindersPageProps) {
  if (DEBUG_REMINDERS) {
  console.log('Reminders received:', reminders)
  console.log('User received:', user)
  }
  
  // Debug: Check the format of remindAt values
  if (DEBUG_REMINDERS) {
    if (reminders && reminders.length > 0) {
      console.log('=== FRONTEND DEBUG ===')
      console.log('First reminder remindAt format:', reminders[0].remindAt)
      console.log('First reminder full object:', reminders[0])
      console.log('All remindAt formats:', reminders.map(r => ({ id: r.id, title: r.title, remindAt: r.remindAt, remind_at: r.remind_at })))
      const testDate = reminders[0].remindAt || reminders[0].remind_at
      if (testDate) {
        console.log('Testing conversion for:', testDate)
        let dt
        if (testDate.includes(' ') && !testDate.includes('T')) {
          const iso = testDate.replace(' ', 'T') + 'Z'
          dt = DateTime.fromISO(iso, { zone: 'utc' })
          console.log('Converted SQL format to:', iso)
        } else {
          dt = DateTime.fromISO(testDate, { zone: 'utc' })
        }
        const local = dt.setZone('Asia/Karachi')
        console.log('Should display as:', local.toFormat('MMM dd, yyyy, hh:mm a'))
      }
    }
  }
  const { success, error } = useToast()
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [isClient, setIsClient] = useState(false)
  // Local copy for live UI updates
  const [items, setItems] = useState<Reminder[]>(reminders)
  // SweetAlert replaces banner
  useEffect(() => {
    setItems(reminders)
  }, [reminders])
  const [formData, setFormData] = useState<ReminderFormData>({
    title: '',
    message: '',
    remindAt: '',
    channels: ['web', 'email']
  })
  // Preferred timezone helper (immediate, no SSR dependency)
  const getPreferredTimeZone = () => {
    // Force Asia/Karachi to guarantee local display
    return 'Asia/Karachi'
  }

  const [tz, setTz] = useState<string>(getPreferredTimeZone())

  // Quick time preset function - always in user's timezone
  const setQuickTime = (minutes: number) => {
    const tzPref = tz || getPreferredTimeZone()
    const now = DateTime.now().setZone(tzPref)
    const reminderTime = now.plus({ minutes })
    
    // Format for datetime-local input (always in user's timezone)
    const formatted = reminderTime.toFormat('yyyy-MM-dd\'T\'HH:mm')
    
    setFormData({
      ...formData,
      remindAt: formatted
    })
  }

  // Set client-side flag to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Setup reminder notifications
  useReminderNotifications(user?.id)
  
  // Debug user and channel subscription
  useEffect(() => {
    if (DEBUG_REMINDERS) {
    console.log('User object:', user)
    console.log('User ID:', user?.id)
    if (user?.id) {
      console.log('Setting up reminder notifications for user:', user.id)
      }
    }
  }, [user])

  // Initialize form with default time (15 minutes from now) - always in user's timezone
  const initializeForm = () => {
    const tzPref = tz || getPreferredTimeZone()
    const now = DateTime.now().setZone(tzPref)
    const defaultTime = now.plus({ minutes: 15 })
    
    const formatted = defaultTime.toFormat('yyyy-MM-dd\'T\'HH:mm')
    
    setFormData({
      title: '',
      message: '',
      remindAt: formatted,
      channels: ['web', 'email']
    })
    setEditingReminder(null)
    setShowForm(true)
  }

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // SweetAlert2 helper for top-positioned toast
  const showTopAlert = async (title: string, text?: string, icon: 'info' | 'success' | 'error' | 'warning' | 'question' = 'info') => {
    try {
      // @ts-ignore - resolved at runtime
      const mod = await import('sweetalert2/dist/sweetalert2.all.js')
      const Swal = mod.default
      await Swal.fire({
        title,
        text,
        icon,
        toast: true,
        position: 'top',
        showConfirmButton: false,
        timer: 6000,
        timerProgressBar: true,
        showCloseButton: true,
      })
    } catch {}
  }

  // Listen for realtime reminder triggers to show toast and update UI immediately
  useEffect(() => {
    const onTriggered = async (e: any) => {
      const reminder: Reminder = e.detail.reminder
      console.log('[Reminder UI] on reminder:triggered event', reminder)
      // Top toast
      await showTopAlert(`⏰ ${reminder.title}`, reminder.message || 'Reminder is due now', 'info')
      // Update local list flags
      setItems((prev) => prev.map((r) => r.id === reminder.id ? { ...r, sentWeb: true } : r))
    }
    if (typeof window !== 'undefined') {
      console.log('[Reminder UI] Adding listener for reminder:triggered')
      window.addEventListener('reminder:triggered', onTriggered as EventListener)
    }
    return () => {
      if (typeof window !== 'undefined') {
        console.log('[Reminder UI] Removing listener for reminder:triggered')
        window.removeEventListener('reminder:triggered', onTriggered as EventListener)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (DEBUG_REMINDERS) console.log('[Reminder UI] handleSubmit() raw formData:', formData)
      if (formData.remindAt) {
        const local = new Date(formData.remindAt)
        if (DEBUG_REMINDERS) console.log('[Reminder UI] Parsed local date from input:', {
          input: formData.remindAt,
          localISO: local.toISOString(),
          localString: local.toString(),
          tzOffsetMinutes: local.getTimezoneOffset(),
        })
      }
      const url = editingReminder ? `/reminders/${editingReminder.id}` : '/reminders'
      const method = editingReminder ? 'PUT' : 'POST'
      
      // Validate form data
      if (!formData.title.trim()) {
        error('Title is required')
        setLoading(false)
        return
      }
      
      if (!formData.remindAt) {
        error('Date and time is required')
        setLoading(false)
        return
      }

      // Check if reminder time is in the past
      const reminderTime = new Date(formData.remindAt)
      if (reminderTime <= new Date()) {
        error('Reminder time must be in the future')
        setLoading(false)
        return
      }
      
      // Send local time directly to server (simpler approach)
      const tzPref = tz || getPreferredTimeZone()
      if (DEBUG_REMINDERS) console.log('[Reminder UI] Sending local time to server:', { tz: tzPref, input: formData.remindAt })
      
      // Create ISO string with timezone info
      const localDateTime = DateTime.fromISO(formData.remindAt, { zone: tzPref })
      if (!localDateTime.isValid) {
        error('Invalid date/time format')
        setLoading(false)
        return
      }
      
      const remindAtWithTz = localDateTime.toISO()
      
      // Debug: Show what we're sending
      if (DEBUG_REMINDERS) console.log('[Reminder UI] Form submission (local time):', {
        input: formData.remindAt,
        timezone: tzPref,
        localDateTime: localDateTime.toISO(),
        output: remindAtWithTz
      })
      
      const payload = {
        ...formData,
        remindAt: remindAtWithTz,
      }
      if (DEBUG_REMINDERS) console.log('[Reminder UI] Local time conversion:', {
        input: formData.remindAt,
        parsedLocal: localDateTime.toISO(),
        output: remindAtWithTz,
        timezone: tzPref
      })
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        console.log('[Reminder UI] Save OK for', method, 'Response status:', response.status)
        success(editingReminder ? 'Reminder updated!' : 'Reminder created!')
        setShowForm(false)
        setEditingReminder(null)
        setFormData({ title: '', message: '', remindAt: '', channels: ['web', 'email'] })
        // Refresh the list so the new/updated reminder appears immediately
        try {
          router.reload({ only: ['reminders'] })
        } catch {
          if (typeof window !== 'undefined') window.location.reload()
        }
      } else {
        const data = await response.text()
        console.error('[Reminder UI] Save FAILED for', method, 'status:', response.status, 'body:', data)
        error(`Failed to ${editingReminder ? 'update' : 'create'} reminder: ${response.status} - ${data}`)
      }
    } catch (err) {
      console.error('[Reminder UI] Save ERROR:', err)
      error('Network error: ' + err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      // @ts-ignore - resolved at runtime
      const mod = await import('sweetalert2/dist/sweetalert2.all.js')
      const Swal = mod.default
      const res = await Swal.fire({
        title: 'Delete reminder?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc2626',
        reverseButtons: true,
        position: 'top'
      })
      if (!res.isConfirmed) return
    } catch {
    if (!confirm('Are you sure you want to delete this reminder?')) return
    }

    setLoading(true)
    try {
      const response = await fetch(`/reminders/${id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include'
      })

      if (response.ok) {
        await showTopAlert('Deleted', 'Reminder deleted successfully', 'success')
        // Update list immediately
        setItems((prev) => prev.filter((r) => r.id !== id))
        // The server will redirect, so we don't need to reload
      } else {
        await showTopAlert('Failed', 'Could not delete the reminder', 'error')
      }
    } catch (err) {
      await showTopAlert('Network error', String(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder)
    
    // Convert UTC reminder time to user's timezone for form input
    const tzPref = tz || getPreferredTimeZone()
    const utcTime = DateTime.fromISO(reminder.remindAt, { zone: 'utc' })
    const localTime = utcTime.setZone(tzPref)
    const formatted = localTime.toFormat('yyyy-MM-dd\'T\'HH:mm')
    
    setFormData({
      title: reminder.title,
      message: reminder.message || '',
      remindAt: formatted,
      channels: reminder.channels
    })
    setShowForm(true)
  }

  // Removed testEmail button and function (no longer needed)

  // Removed testNotification (no longer needed)

  // Removed testRealTimeNotification (no longer needed)

  // Removed testChannelSubscription (no longer needed)

  const processReminders = async () => {
    console.log('[Reminder UI] ===== BUTTON CLICKED =====')
    console.log('[Reminder UI] processReminders function called')
    setLoading(true)
    try {
      console.log('[Reminder UI] Triggering /reminders/trigger now')
      const response = await fetch('/reminders/trigger', {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
      console.log('[Reminder UI] /reminders/trigger response:', data)
        success(`Processed ${data.processed} reminders!`)
        
        // Show browser notifications for processed reminders as fallback
        // Since Pusher might be failing, let's show notifications directly
        if (data.processed > 0) {
          console.log('[Reminder UI] Processing fallback notifications for', data.processed, 'reminders')
          
          const processedReminders = items.filter(reminder => {
            const remindTime = DateTime.fromISO(reminder.remindAt)
            const now = DateTime.now().setZone('Asia/Karachi')
            const isOverdue = remindTime <= now
            const notSent = !reminder.sentWeb
            if (DEBUG_REMINDERS) console.log('[Reminder UI] Reminder check:', {
              title: reminder.title,
              remindTime: remindTime.toISO(),
              now: now.toISO(),
              isOverdue,
              notSent,
              shouldNotify: isOverdue && notSent
            })
            return isOverdue && notSent
          })
          
          console.log('[Reminder UI] Found', processedReminders.length, 'reminders for fallback notifications')
          
          for (const reminder of processedReminders) {
            try {
              console.log('[Reminder UI] Attempting to show notification for:', reminder.title)
              const result = await notificationService.showReminderNotification({
                title: reminder.title,
                message: reminder.message || '',
                remindAt: reminder.remindAt
              })
              if (DEBUG_REMINDERS) console.log('[Reminder UI] Notification result for', reminder.title, ':', result)
              // Mark as sent in UI
              setItems((prev) => prev.map((r) => r.id === reminder.id ? { ...r, sentWeb: true } : r))
            } catch (error) {
              console.error('[Reminder UI] Failed to show fallback notification for', reminder.title, ':', error)
            }
          }
        }
        
        // Optional auto-refresh (disabled while debugging)
        if (!SKIP_RELOAD_AFTER_TRIGGER) {
          setTimeout(() => {
            try {
              if (typeof window !== 'undefined') {
                window.location.reload()
              }
            } catch {}
          }, 3000)
        }
      } else {
        const text = await response.text()
        console.error('[Reminder UI] /reminders/trigger failed. Status:', response.status, 'Body:', text)
        error('Failed to process reminders')
      }
    } catch (err) {
      console.error('[Reminder UI] /reminders/trigger error:', err)
      error('Network error: ' + err)
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    try {
      if (DEBUG_REMINDERS) console.log('[Reminder UI] formatDateTime input:', { input: dateString })
      
      // Parse the date string (should already have timezone info)
      const dt = DateTime.fromISO(dateString)
      
      if (!dt.isValid) {
        console.warn('[Reminder UI] Invalid date:', { input: dateString, error: dt.invalidReason })
        return 'Invalid date'
      }
      
      // Format in the same timezone it was stored
      const out = dt.toFormat('MMM dd, yyyy, hh:mm a')
      
      if (DEBUG_REMINDERS) {
        console.log('[Reminder UI] formatDateTime result:', { 
          input: dateString, 
          parsed: dt.toISO(),
          output: out
        })
      }
      return out
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid date'
    }
  }

  const isOverdue = (dateString: string) => {
    try {
      // Parse the date string (should already have timezone info)
      const dueTime = DateTime.fromISO(dateString)
      const now = DateTime.now()
      const overdue = dueTime < now
      
      if (DEBUG_REMINDERS) {
        console.debug('[Reminder UI] isOverdue check:', {
          input: dateString,
          dueTime: dueTime.toISO(),
          now: now.toISO(),
          overdue,
        })
      }
      return overdue
    } catch (e) {
      console.error('[Reminder UI] isOverdue error for', dateString, e)
      return false
    }
  }

  return (
    <>
      <Head title="Reminders" />
      
      <div className="container mx-auto px-4 py-8">
        {/* SweetAlert replaces the banner UI */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          <h1 className="text-3xl font-bold">Reminders</h1>
          </div>
          <div className="flex gap-2">
            <select
              value={tz}
              onChange={(e) => {
                const v = e.target.value
                setTz(v)
                try { localStorage.setItem('reminder.tz', v) } catch {}
              }}
              className="border rounded px-2 py-1 text-sm"
              title="Display & submit timezone"
            >
              {/* Minimal, extend as needed */}
              <option value="Asia/Karachi">Asia/Karachi (UTC+05:00)</option>
              <option value="UTC">UTC</option>
              <option value="Asia/Kolkata">Asia/Kolkata (UTC+05:30)</option>
              <option value="Asia/Dubai">Asia/Dubai (UTC+04:00)</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Europe/London">Europe/London</option>
            </select>
            <Button onClick={() => {
              try {
                const maybePromise = processReminders()
                if (maybePromise && typeof (maybePromise as any).catch === 'function') {
                  ;(maybePromise as Promise<void>).catch((e) => {
                    console.error('[Reminder UI] processReminders threw:', e)
                  })
                }
              } catch (e) {
                console.error('[Reminder UI] processReminders sync error:', e)
              }
            }} disabled={loading} variant="outline">
              Process Reminders
            </Button>
            <Button onClick={initializeForm}>
              Create Reminder
            </Button>
          </div>
        </div>

        {/* Reminder Form */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {editingReminder ? 'Edit Reminder' : 'Create New Reminder'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Reminder title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <Input
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Optional message"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Date & Time *</label>
                  
                  {/* Quick Presets */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">Quick presets:</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickTime(1)}
                        className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                      >
                        Now (1 min)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickTime(5)}
                      >
                        In 5 min
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickTime(15)}
                      >
                        In 15 min
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickTime(30)}
                      >
                        In 30 min
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickTime(60)}
                      >
                        In 1 hour
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickTime(24 * 60)}
                      >
                        Tomorrow
                      </Button>
                    </div>
                  </div>

                  {/* Date and Time Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Date</label>
                      <Input
                        type="date"
                        value={formData.remindAt ? formData.remindAt.split('T')[0] : ''}
                        onChange={(e) => {
                          const time = formData.remindAt ? formData.remindAt.split('T')[1] : '12:00'
                          setFormData({ ...formData, remindAt: `${e.target.value}T${time}` })
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Time</label>
                      <Input
                        type="time"
                        value={formData.remindAt ? formData.remindAt.split('T')[1] : ''}
                        onChange={(e) => {
                          const date = formData.remindAt ? formData.remindAt.split('T')[0] : new Date().toISOString().split('T')[0]
                          setFormData({ ...formData, remindAt: `${date}T${e.target.value}` })
                        }}
                        required
                      />
                    </div>
                  </div>

                  {/* Current Selection Display */}
                  {formData.remindAt && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                      <div className="flex justify-between items-center">
                        <span><strong>Selected:</strong> {formatDateTime(formData.remindAt)} ({tz})</span>
                        <span className="text-xs text-gray-600">
                          Current time: {DateTime.now().setZone(tz).toFormat('hh:mm a')} ({tz})
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notification Channels</label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.channels.includes('web')}
                        onChange={(e) => {
                          const channels = e.target.checked
                            ? [...formData.channels, 'web']
                            : formData.channels.filter(c => c !== 'web')
                          setFormData({ ...formData, channels })
                        }}
                      />
                      <Globe className="w-4 h-4" />
                      <span>Browser Notification</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.channels.includes('email')}
                        onChange={(e) => {
                          const channels = e.target.checked
                            ? [...formData.channels, 'email']
                            : formData.channels.filter(c => c !== 'email')
                          setFormData({ ...formData, channels })
                        }}
                      />
                      <Mail className="w-4 h-4" />
                      <span>Email Notification</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : (editingReminder ? 'Update' : 'Create')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      setEditingReminder(null)
                      setFormData({ title: '', message: '', remindAt: '', channels: ['web', 'email'] })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && isClient && (
          <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
            <div className="flex justify-between items-start">
              <div>
                <strong>Debug:</strong> {items.length} reminders loaded
                <div className="mt-2">
                  <div>Notification Support: {typeof window !== 'undefined' && 'Notification' in window ? '✅' : '❌'}</div>
                  <div>Notification Permission: {typeof window !== 'undefined' && window.Notification ? window.Notification.permission : 'unknown'}</div>
                  <div>Pusher Key: {typeof window !== 'undefined' && document.querySelector('meta[name="pusher-key"]')?.getAttribute('content') ? '✅' : '❌'}</div>
                  <div>Pusher Cluster: {typeof window !== 'undefined' && document.querySelector('meta[name="pusher-cluster"]')?.getAttribute('content') ? '✅' : '❌'}</div>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    console.log('Available meta tags:', Array.from(document.querySelectorAll('meta')).map(m => ({ name: m.getAttribute('name'), content: m.getAttribute('content') })))
                  }
                }}
              >
                Log Meta Tags
              </Button>
            </div>
          </div>
        )}

        {/* Reminders List */}
        <div className="space-y-4">
          {items.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No reminders yet. Create your first reminder!</p>
              </CardContent>
            </Card>
          ) : (
            items.map((reminder) => (
              <Card
                key={reminder.id}
                className={
                  isOverdue(reminder.remindAt)
                    ? 'border-red-200 bg-red-50 text-red-900'
                    : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                }
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{reminder.title}</h3>
                      {reminder.message && (
                        <p className="text-gray-600 mt-1">{reminder.message}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>⏰ {formatDateTime(reminder.remindAt)}</span>
                        <div className="flex items-center gap-2">
                          {reminder.channels.includes('web') && (
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              Web
                            </span>
                          )}
                          {reminder.channels.includes('email') && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              Email
                            </span>
                          )}
                        </div>
                        {reminder.sentWeb && <span className="text-green-600">✓ Web sent</span>}
                        {reminder.sentEmail && <span className="text-green-600">✓ Email sent</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(reminder)}
                        disabled={loading}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(reminder.id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  )
}
