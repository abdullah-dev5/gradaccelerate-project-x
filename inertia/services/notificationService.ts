// Browser Notification Service
export class NotificationService {
  private static instance: NotificationService
  private permission: NotificationPermission = 'default'

  constructor() {
    this.checkPermission()
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  private checkPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    console.log('Current notification permission:', this.permission)

    if (this.permission === 'granted') {
      console.log('Notification permission already granted')
      return true
    }

    if (this.permission === 'denied') {
      console.warn('Notification permission denied')
      return false
    }

    try {
      console.log('Requesting notification permission...')
      const permission = await Notification.requestPermission()
      this.permission = permission
      console.log('Notification permission result:', permission)
      return permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  async showNotification(title: string, options: NotificationOptions = {}): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    if (this.permission !== 'granted') {
      const granted = await this.requestPermission()
      if (!granted) {
        console.warn('Cannot show notification: permission denied')
        return false
      }
    }

    try {
      const notification = new Notification(title, {
        // Visuals
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        dir: 'auto',
        lang: 'en',
        // Behavior
        // renotify is not in TS lib dom typings; omit for type safety
        silent: false,
        requireInteraction: true,
        // Merge caller options last to allow overrides
        ...options,
      })

      // Auto-close after 10 seconds
      setTimeout(() => {
        notification.close()
      }, 10000)

      // Handle click to focus and navigate to Reminders
      notification.onclick = () => {
        try {
          window.focus()
          if (location.pathname !== '/reminders') {
            window.location.href = '/reminders'
          }
        } finally {
          notification.close()
        }
      }

      return true
    } catch (error) {
      console.error('Error showing notification:', error)
      return false
    }
  }

  async showReminderNotification(reminder: {
    title: string
    message?: string
    remindAt: string
  }): Promise<boolean> {
    console.log('[Notify UI] ===== SHOWING REMINDER NOTIFICATION =====')
    console.log('[Notify UI] showReminderNotification input:', reminder)
    console.log('[Notify UI] Current permission:', this.permission)
    console.log('[Notify UI] Notification supported:', this.isSupported())
    
    const date = new Date(reminder.remindAt)
    console.log('[Notify UI] Parsed remindAt:', {
      iso: date.toISOString(),
      local: date.toString(),
      tzOffsetMinutes: date.getTimezoneOffset(),
    })
    const remindTime = new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }).format(date)
    
    const result = await this.showNotification(`⏰ ${reminder.title}`,
      {
        body: reminder.message ? `${reminder.message}\n📅 ${remindTime}` : `📅 ${remindTime}`,
        tag: `reminder-${(reminder as any).id ?? reminder.title}`,
        data: { reminder, timestamp: Date.now() },
      })
    
    console.log('[Notify UI] showNotification result:', result)
    return result
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window
  }

  getPermission(): NotificationPermission {
    return this.permission
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance()
