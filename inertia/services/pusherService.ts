// Pusher Service for Real-time Notifications
import Pusher from 'pusher-js'

export class PusherService {
  private static instance: PusherService
  private pusher: Pusher | null = null
  private channel: any = null
  private isConnected = false

  constructor() {
    this.initializePusher()
  }

  static getInstance(): PusherService {
    if (!PusherService.instance) {
      PusherService.instance = new PusherService()
    }
    return PusherService.instance
  }

  private initializePusher() {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    // Check if Pusher credentials are available
    const pusherKey = document.querySelector('meta[name="pusher-key"]')?.getAttribute('content')
    const pusherCluster = document.querySelector('meta[name="pusher-cluster"]')?.getAttribute('content')
    
    if (!pusherKey || !pusherCluster) {
      console.warn('Pusher credentials not found. Real-time notifications disabled.')
      return
    }

    try {
      this.pusher = new Pusher(pusherKey, {
        cluster: pusherCluster,
        forceTLS: true,
        authEndpoint: '/pusher/auth',
        auth: {
          headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          }
        }
      })

      this.pusher.connection.bind('connected', () => {
        this.isConnected = true
      })

      this.pusher.connection.bind('disconnected', () => {
        this.isConnected = false
      })

      this.pusher.connection.bind('error', (error: any) => {
        console.error('[Pusher] Connection error:', error)
      })

    } catch (error) {
      console.error('Failed to initialize Pusher:', error)
    }
  }

  subscribeToUserChannel(userId: number): void {
    if (!this.pusher) {
      console.warn('[Pusher] Not initialized - cannot subscribe to channel')
      return
    }

    if (!this.isConnected) {
      // Wait for connection and retry
      setTimeout(() => this.subscribeToUserChannel(userId), 1000)
      return
    }

    try {
      const channelName = `private-user.${userId}`
      this.channel = this.pusher.subscribe(channelName)
      
      this.channel.bind('pusher:subscription_succeeded', () => {
        console.log('[Pusher] Subscribed to', channelName)
      })

      this.channel.bind('pusher:subscription_error', (error: any) => {
        console.error('[Pusher] Subscription error for', channelName, error)
      })
      
      this.channel.bind('reminder.triggered', (data: any) => {
        this.handleReminderNotification(data)
      })

      // Silent handlers for other events
      this.channel.bind('reminder.created', () => {})
      this.channel.bind('reminder.updated', () => {})
      this.channel.bind('reminder.deleted', () => {})

    } catch (error) {
      console.error('[Pusher] Failed to subscribe to user channel:', error)
    }
  }

  private handleReminderNotification(data: any) {
    const { reminder } = data
    
    // Show browser notification
    if (reminder.channels && reminder.channels.includes('web')) {
      import('./notificationService').then(({ notificationService }) => {
        notificationService.showReminderNotification(reminder)
      }).catch(err => {
        console.error('[Pusher] Failed to show notification:', err)
      })
    }

    // Dispatch a DOM event so pages can react (toasts, UI updates)
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('reminder:triggered', { detail: { reminder } }))
      }
    } catch (e) {
      console.warn('[Pusher] Failed to dispatch event:', e)
    }
  }

  unsubscribeFromUserChannel(): void {
    if (this.channel) {
      this.pusher?.unsubscribe(this.channel.name)
      this.channel = null
    }
  }

  disconnect(): void {
    if (this.pusher) {
      this.pusher.disconnect()
      this.pusher = null
      this.isConnected = false
    }
  }

  isConnectedToPusher(): boolean {
    return this.isConnected
  }

  getChannel(): any {
    return this.channel
  }
}

// Export singleton instance
export const pusherService = PusherService.getInstance()
