// Browser Notification Service
type ExtendedNotificationOptions = NotificationOptions & { image?: string }

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
      return false
    }

    if (this.permission === 'granted') {
      return true
    }

    if (this.permission === 'denied') {
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      this.permission = permission
      return permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  async showNotification(title: string, options: ExtendedNotificationOptions = {}): Promise<boolean> {
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
      const notification = new Notification(title, ({
        // Visuals - Custom styling
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        image: options.image || undefined,
        
        // Language and direction
        dir: 'auto',
        lang: 'en',
        
        // Behavior - Customized for better UX
        renotify: true,  // Replace previous notifications with same tag
        silent: false,  // Play sound
        requireInteraction: false,  // Don't force user to dismiss (auto-dismiss after timeout)
        
        // Vibration pattern for mobile devices
        vibrate: [200, 100, 200, 100, 200],
        
        // Merge caller options last to allow overrides
        ...options,
      } as unknown) as NotificationOptions)

      // Auto-close after 15 seconds (increased for better visibility)
      setTimeout(() => {
        notification.close()
      }, 15000)

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

      // Handle notification close
      notification.onclose = () => {
        console.log('[Notification] Closed:', title)
      }

      // Handle notification error
      notification.onerror = (error) => {
        console.error('[Notification] Error:', error)
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
    const date = new Date(reminder.remindAt)
    
    // Format date in a nicer way
    const remindTime = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date)
    
    // Create a nicely formatted body with emojis
    const bodyLines = []
    if (reminder.message) {
      bodyLines.push(reminder.message)
    }
    bodyLines.push(`📅 Scheduled: ${remindTime}`)
    
    const body = bodyLines.join('\n\n')
    
    // Enhanced notification with better styling
    return await this.showNotification(`🔔 Reminder: ${reminder.title}`, {
      body: body,
      tag: `reminder-${(reminder as any).id ?? reminder.title}`,
      data: { 
        reminder, 
        timestamp: Date.now(),
        type: 'reminder'
      },
      icon: '/favicon.svg',
      badge: '/favicon.svg'
    })
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
