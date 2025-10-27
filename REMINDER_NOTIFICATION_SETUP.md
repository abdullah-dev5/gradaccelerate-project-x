# Reminder Notification Setup Guide

## Overview

This guide explains how to configure and use the reminder notification system in the GradAccelerate project.

## Features

- **Browser Notifications**: Real-time browser notifications when reminders trigger
- **Email Notifications**: Email notifications when reminders trigger
- **Automatic Processing**: Scheduled task runs every minute to check for due reminders
- **Real-time Updates**: Uses Pusher for real-time push notifications

## Configuration

### 1. Enable the Scheduler

Add the following environment variable to your `.env` file:

```bash
# Enable reminder scheduler (runs every minute)
SCHEDULER_ENABLED=true
```

### 2. Configure Pusher (for Browser Notifications)

Add your Pusher credentials to `.env`:

```bash
# Pusher Configuration (Required for real-time notifications)
PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_app_key
PUSHER_APP_SECRET=your_app_secret
PUSHER_CLUSTER=your_cluster
```

To get Pusher credentials:
1. Sign up at [pusher.com](https://pusher.com)
2. Create a new Channels app
3. Copy your credentials from the "Keys" tab

### 3. Add Pusher Meta Tags to Frontend

The Pusher frontend code reads credentials from HTML meta tags. Make sure your `resources/views/app.edge` includes:

```html
<meta name="pusher-key" content="{{ app.pusher.key }}" />
<meta name="pusher-cluster" content="{{ app.pusher.cluster }}" />
```

Update your Inertia config to include this:

```typescript
// config/inertia.ts
createServer({
  // ...
  sharedData: {
    pusher: {
      key: process.env.PUSHER_APP_KEY,
      cluster: process.env.PUSHER_CLUSTER,
    }
  }
})
```

### 4. Configure SMTP (for Email Notifications)

Add SMTP credentials to `.env`:

```bash
# SMTP Configuration (Optional - for email notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@example.com
SMTP_PASS=your_password
SMTP_FROM_EMAIL=noreply@example.com
SMTP_FROM_NAME=GradAccelerate
```

## How It Works

### Architecture

1. **Scheduler** (`start/scheduler.ts`): Runs every minute when enabled
2. **Reminder Service** (`app/services/reminder_service.ts`): Processes due reminders
3. **Pusher**: Sends real-time notifications to connected clients
4. **Notification Service** (`inertia/services/notificationService.ts`): Shows browser notifications
5. **Frontend Hook** (`inertia/hooks/useReminderNotifications.ts`): Subscribes to user's private channel

### Flow

1. User creates a reminder with a future date/time
2. Reminder is saved to database with timezone info
3. Scheduler runs every minute (if enabled)
4. Service checks for due reminders
5. For each due reminder:
   - Sends Pusher event to user's private channel
   - Sends email if configured
   - Marks reminder as sent
6. Frontend receives Pusher event
7. Notification service shows browser notification
8. User sees and hears the notification

## Testing

### Test Scheduler Manually

You can manually trigger reminder processing for the current user:

```bash
# Via API
curl -X POST http://localhost:3333/reminders/trigger

# Via Inertia (browser)
# Visit http://localhost:3333/reminders
# Click "Test Trigger" button (if available)
```

### Check Scheduler Logs

When scheduler runs, you'll see logs like:

```
[Scheduler] Initialized. Schedule: every minute (SCHEDULER_ENABLED=true)
[Scheduler] Run complete. Users: 1, Processed reminders: 0
[Reminder Service] ===== PROCESSING REMINDERS =====
[Reminder Service] Processing due reminders for user: 1
```

### Test Browser Notifications

1. Ensure `SCHEDULER_ENABLED=true` in `.env`
2. Start the server: `npm run dev`
3. Create a reminder with time 1 minute in the future
4. Wait 1 minute
5. You should see a browser notification

### Test Email Notifications

1. Configure SMTP credentials in `.env`
2. Create a reminder with email channel selected
3. Wait for reminder to trigger
4. Check your email inbox

## Troubleshooting

### Scheduler Not Running

**Problem**: Reminders aren't being processed

**Solution**: 
1. Check `.env` has `SCHEDULER_ENABLED=true`
2. Restart the server
3. Check logs for scheduler initialization message

### No Browser Notifications

**Problem**: Browser notification permissions denied

**Solution**:
1. Click on the browser's lock icon in the address bar
2. Set notification permission to "Allow"
3. Or update browser settings to allow notifications

### Pusher Not Connecting

**Problem**: Console shows Pusher connection errors

**Solution**:
1. Verify Pusher credentials in `.env`
2. Check `config/inertia.ts` includes Pusher in sharedData
3. Verify HTML meta tags are present (view page source)
4. Check browser console for Pusher errors

### Timezone Issues

**Problem**: Reminders trigger at wrong time

**Solution**:
1. The system uses UTC for storage and comparison
2. Frontend displays times in user's timezone
3. Ensure clocks are synchronized
4. Check database stores timezone-aware timestamps

## User Notification Preferences

Users can control notifications in their preferences:
- `webNotificationsEnabled`: Enable/disable web notifications
- `emailNotificationsEnabled`: Enable/disable email notifications
- `reminderWebEnabled`: Enable/disable reminder web notifications specifically
- `reminderEmailsEnabled`: Enable/disable reminder email notifications specifically

## Security

- Private channels require authentication (`/pusher/auth`)
- Users can only subscribe to their own private channel
- Server validates channel names match authenticated user

## Performance

- Scheduler runs every minute
- Only processes reminders that haven't been sent yet
- Debounced to prevent duplicate processing
- Efficient database queries with proper indexes

## Future Improvements

- Add support for recurring reminders
- Add sound/customization options for notifications
- Add notification history log
- Add support for multiple notification channels
- Add SMS notifications support


