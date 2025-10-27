# Browser Notification Styling Guide

## Overview

This guide documents the browser notification styling features implemented for reminder notifications in the GradAccelerate project.

## Current Implementation

### Styling Features

The notification service has been enhanced with the following features:

#### 1. **Title Styling**
- Format: `🔔 Reminder: [Title]`
- Uses bell emoji for visual appeal
- Clear "Reminder:" prefix for context

#### 2. **Body Text Formatting**
- Clean, readable layout
- Two-line spacing for better readability
- Includes reminder message (if provided)
- Shows scheduled time with calendar emoji (📅)

#### 3. **Visual Elements**
- **Icon**: `/favicon.svg` (app logo)
- **Badge**: `/favicon.svg` (displayed in notification area)
- **Timestamp**: Original reminder time
- **Tag**: Unique identifier for grouping/deduplication

#### 4. **Behavior**
- **Auto-dismiss**: 15 seconds (increased from 10 seconds)
- **Sound**: Enabled (silent: false)
- **Vibration**: Pattern [200, 100, 200, 100, 200] on mobile
- **Click Action**: Navigates to `/reminders` page
- **Renotify**: Replaces previous notifications with same tag

#### 5. **Event Handlers**
- `onclick`: Navigate to reminders page
- `onclose`: Log closure event
- `onerror`: Error handling

## Browser Support

Browser notifications have **limited CSS styling** - the browser controls most of the appearance. However, we can customize:

✅ **Supported Properties:**
- `title` - Notification title
- `body` - Message text
- `icon` - Icon image (recommended: 192x192px)
- `badge` - Small icon for notification area
- `image` - Large background image (modern browsers)
- `tag` - Grouping/deduplication ID
- `timestamp` - When the notification was created
- `data` - Custom data payload
- `dir` - Text direction (auto, ltr, rtl)
- `lang` - Language code
- `renotify` - Replace previous notifications
- `silent` - Disable sound
- `requireInteraction` - Don't auto-dismiss
- `vibrate` - Vibration pattern (mobile)
- `actions` - Action buttons (requires service worker)

❌ **Not Supported:**
- CSS styles (colors, fonts, borders, etc.)
- HTML tags in body (plain text only)
- Custom positions (browser controls)
- Custom animations

## Example Notification

**Title:** 🔔 Reminder: Finish Project Report

**Body:**
```
Don't forget to submit your final report

📅 Scheduled: Fri, Oct 26, 2:00 PM
```

**Visual:** 
- Shows app icon
- Bell emoji in title
- Clean two-line body
- Auto-dismisses after 15 seconds

## Future Enhancements

Possible improvements (require Service Worker):

1. **Action Buttons**: Add "View" and "Dismiss" buttons
2. **Rich Media**: Background images for notifications
3. **Persistent Badge**: Show count on app icon
4. **Notification Groups**: Group related notifications
5. **Scheduled Notifications**: Show on exact scheduled time
6. **Notification Actions**: Quick actions like "Snooze" or "Complete"

## Platform-Specific Behavior

### Chrome/Edge
- Shows icon + badge
- Grouped by tag
- Supports image property
- Rich text formatting

### Firefox
- Shows icon + badge
- Supports image property
- Good emoji support

### Safari (macOS)
- Shows icon
- Limited image support
- Different UI appearance

### Mobile (PWA)
- Full vibration support
- Appears as system notification
- Click opens app

## Testing

To test notifications:

1. Ensure browser notifications are enabled
2. Create a reminder for 1 minute from now
3. Wait for scheduler to trigger
4. Observe the styled notification popup

## Customization

To customize notification appearance, edit `inertia/services/notificationService.ts`:

### Change Icon
```javascript
icon: '/path/to/your/icon.svg'
```

### Change Title Format
```javascript
const result = await this.showNotification(`🎯 ${reminder.title}`, {...})
```

### Change Body Format
```javascript
bodyLines.push(`⏰ Time: ${remindTime}`)
```

### Change Auto-Dismiss Time
```javascript
setTimeout(() => {
  notification.close()
}, 20000) // 20 seconds
```

### Change Vibration Pattern
```javascript
vibrate: [300, 200, 300, 200, 300],
```

## Notes

- Browser notifications cannot be fully styled with CSS
- Appearance varies by browser and OS
- Emojis provide the best visual customization option
- Icons and images are the main visual elements under your control
- Auto-dismiss timing helps with UX but can't be styled


