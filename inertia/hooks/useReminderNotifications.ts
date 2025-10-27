import { useEffect } from 'react'
import { pusherService } from '../services/pusherService'
import { notificationService } from '../services/notificationService'

export function useReminderNotifications(userId?: number) {
  useEffect(() => {
    if (!userId) {
      return
    }

    // Initialize notification service
    notificationService.requestPermission()

    // Subscribe to Pusher channel
    pusherService.subscribeToUserChannel(userId)

    return () => {
      pusherService.unsubscribeFromUserChannel()
    }
  }, [userId])
}
