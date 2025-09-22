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
      console.warn('Pusher initialization skipped - not in browser environment')
      return
    }

    // Check if Pusher credentials are available
    const pusherKey = document.querySelector('meta[name="pusher-key"]')?.getAttribute('content')
    const pusherCluster = document.querySelector('meta[name="pusher-cluster"]')?.getAttribute('content')
    
    console.log('[Pusher UI] Credentials present:', { hasKey: !!pusherKey, hasCluster: !!pusherCluster })
    
    if (!pusherKey || !pusherCluster) {
      console.warn('Pusher credentials not found in meta tags. Real-time notifications will not work.')
      console.log('Available meta tags:', Array.from(document.querySelectorAll('meta')).map(m => ({ name: m.getAttribute('name'), content: m.getAttribute('content') })))
      return
    }

    try {
      console.log('[Pusher UI] Initializing Pusher...')
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
        console.log('[Pusher UI] ✅ connected')
        this.isConnected = true
      })

      this.pusher.connection.bind('disconnected', () => {
        console.log('[Pusher UI] ❌ disconnected')
        this.isConnected = false
      })

      this.pusher.connection.bind('error', (error: any) => {
        console.error('[Pusher UI] ❌ connection error:', error)
      })

      this.pusher.connection.bind('state_change', (states: any) => {
        console.log('[Pusher UI] state change:', states.previous, '->', states.current)
      })

    } catch (error) {
      console.error('Failed to initialize Pusher:', error)
    }
  }

  subscribeToUserChannel(userId: number): void {
    console.log('[Pusher UI] subscribeToUserChannel(userId):', userId)
    
    if (!this.pusher) {
      console.warn('[Pusher UI] Not initialized - cannot subscribe to channel')
      return
    }

    if (!this.isConnected) {
      console.warn('[Pusher UI] Not connected - waiting then retrying...')
      // Wait for connection and retry
      setTimeout(() => this.subscribeToUserChannel(userId), 1000)
      return
    }

    try {
      const channelName = `private-user.${userId}`
      console.log('[Pusher UI] Subscribing to channel:', channelName)
      
      this.channel = this.pusher.subscribe(channelName)
      
      this.channel.bind('pusher:subscription_succeeded', () => {
        console.log('[Pusher UI] ✅ subscribed:', channelName)
      })

      this.channel.bind('pusher:subscription_error', (error: any) => {
        console.error('[Pusher UI] ❌ subscription error for', channelName, error)
      })
      
      this.channel.bind('reminder.triggered', (data: any) => {
        console.log('[Pusher UI] 🔔 reminder.triggered data:', data)
        this.handleReminderNotification(data)
      })

      this.channel.bind('reminder.created', (data: any) => {
        console.log('[Pusher UI] ➕ reminder.created:', data)
        // You can add UI updates here if needed
      })

      this.channel.bind('reminder.updated', (data: any) => {
        console.log('[Pusher UI] ✏️ reminder.updated:', data)
        // You can add UI updates here if needed
      })

      this.channel.bind('reminder.deleted', (data: any) => {
        console.log('[Pusher UI] 🗑️ reminder.deleted:', data)
        // You can add UI updates here if needed
      })

      // Note: Client events require enabling in Pusher dashboard
      // For testing, we'll use server events instead

    } catch (error) {
      console.error('Failed to subscribe to user channel:', error)
    }
  }

  private handleReminderNotification(data: any) {
    const { reminder } = data
    console.log('[Pusher UI] handleReminderNotification reminder:', reminder)
    
    // Show browser notification
    if (reminder.channels.includes('web')) {
      import('./notificationService').then(({ notificationService }) => {
        console.log('[Pusher UI] Showing browser notification for reminder id', reminder.id)
        notificationService.showReminderNotification(reminder)
      })
    }

    // Dispatch a DOM event so pages can react (toasts, UI updates)
    try {
      if (typeof window !== 'undefined') {
        console.log('[Pusher UI] Dispatching event: reminder:triggered for id', reminder.id)
        window.dispatchEvent(new CustomEvent('reminder:triggered', { detail: { reminder } }))
      }
    } catch (e) {
      console.warn('[Pusher UI] Failed to dispatch reminder:triggered', e)
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
