import { useEffect } from 'react'
import { pusherService } from '../services/pusherService'
import { notificationService } from '../services/notificationService'

export function useReminderNotifications(userId?: number) {
  useEffect(() => {
    console.log('useReminderNotifications called with userId:', userId)
    
    if (!userId) {
      console.log('No userId provided, skipping reminder notifications setup')
      return
    }

    console.log('Setting up reminder notifications for user:', userId)

    // Initialize notification service
    notificationService.requestPermission()

    // Subscribe to Pusher channel
    pusherService.subscribeToUserChannel(userId)

    return () => {
      console.log('Cleaning up reminder notifications for user:', userId)
      pusherService.unsubscribeFromUserChannel()
    }
  }, [userId])
}


