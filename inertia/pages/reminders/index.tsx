import React, { useState, useEffect } from 'react'
import { DateTime } from 'luxon'
import { Head, router } from '@inertiajs/react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { useToast } from '../../hooks/useToast'
import { useReminderNotifications } from '../../hooks/useReminderNotifications'
import { Trash2, Edit, Bell, Mail, Globe, Plus } from 'lucide-react'
import Header from '../../components/Header'

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
  const { success, error } = useToast()
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
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

  const tz = 'Asia/Karachi' // Fixed timezone

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

  // Setup reminder notifications
  useReminderNotifications(user?.id)

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
      // Top toast
      await showTopAlert(`⏰ ${reminder.title}`, reminder.message || 'Reminder is due now', 'info')
      // Update local list flags
      setItems((prev) => prev.map((r) => r.id === reminder.id ? { ...r, sentWeb: true } : r))
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('reminder:triggered', onTriggered as EventListener)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('reminder:triggered', onTriggered as EventListener)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
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
      
      // Create ISO string with timezone info
      const localDateTime = DateTime.fromISO(formData.remindAt, { zone: tzPref })
      if (!localDateTime.isValid) {
        error('Invalid date/time format')
        setLoading(false)
        return
      }
      
      const remindAtWithTz = localDateTime.toISO()
      
      const payload = {
        ...formData,
        remindAt: remindAtWithTz,
      }
      
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

  const formatDateTime = (dateString: string) => {
    try {
      const dt = DateTime.fromISO(dateString)
      
      if (!dt.isValid) {
        console.warn('[Reminder UI] Invalid date:', { input: dateString, error: dt.invalidReason })
        return 'Invalid date'
      }
      
      return dt.toFormat('MMM dd, yyyy, hh:mm a')
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid date'
    }
  }

  const isOverdue = (dateString: string) => {
    try {
      const dueTime = DateTime.fromISO(dateString)
      const now = DateTime.now()
      return dueTime < now
    } catch (e) {
      console.error('[Reminder UI] isOverdue error:', e)
      return false
    }
  }

  return (
    <>
      <Head title="Reminders" />
      
      <Header 
        title="Reminders" 
        subtitle={`${items.length} ${items.length === 1 ? 'reminder' : 'reminders'} ${items.length > 0 ? `- ${items.filter(r => !isOverdue(r.remind_at || r.remindAt)).length} pending` : ''}`}
        showBackButton={true}
        backHref="/dashboard"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E] pb-8">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          {/* Header Actions */}
          <div className="flex justify-end mb-6">
            <Button 
              onClick={initializeForm}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Reminder</span>
              <span className="sm:hidden">Create</span>
            </Button>
          </div>

        {/* Reminder Form */}
        {showForm && (
          <Card className="mb-6 bg-[#2C2C2E]/50 backdrop-blur-sm border-[#3A3A3C]/50">
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
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
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
                      <div className="flex flex-col gap-1">
                        <span><strong>Selected:</strong> {formatDateTime(formData.remindAt)}</span>
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
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg break-words">{reminder.title}</h3>
                      {reminder.message && (
                        <p className="text-gray-600 mt-1 break-words">{reminder.message}</p>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3 text-xs sm:text-sm text-gray-500">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span>⏰ {formatDateTime(reminder.remindAt)}</span>
                          <div className="flex items-center gap-2">
                            {reminder.channels.includes('web') && (
                              <span className={`flex items-center gap-1 ${reminder.sentWeb ? 'text-green-600' : ''}`}>
                                <Globe className="w-3 h-3" />
                                <span className="hidden sm:inline">Web</span>
                                {reminder.sentWeb && <span className="text-xs ml-1">✓</span>}
                              </span>
                            )}
                            {reminder.channels.includes('email') && (
                              <span className={`flex items-center gap-1 ${reminder.sentEmail ? 'text-green-600' : ''}`}>
                                <Mail className="w-3 h-3" />
                                <span className="hidden sm:inline">Email</span>
                                {reminder.sentEmail && <span className="text-xs ml-1">✓</span>}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(reminder)}
                        disabled={loading}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(reminder.id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
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
      </div>
    </>
  )
}
