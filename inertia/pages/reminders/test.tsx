import React, { useState } from 'react'
import { Head } from '@inertiajs/react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { useToast } from '../../hooks/useToast'

export default function ReminderTest() {
  const { success, error } = useToast()
  const [loading, setLoading] = useState(false)

  const createTestReminder = async () => {
    setLoading(true)
    try {
      const response = await fetch('/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: 'Test Reminder',
          message: 'This is a test reminder created at ' + new Date().toLocaleString(),
          remindAt: new Date().toISOString(),
          channels: ['web', 'email']
        })
      })

      if (response.ok) {
        success('Reminder created successfully!')
      } else {
        const data = await response.text()
        error(`Failed to create reminder: ${response.status} - ${data}`)
      }
    } catch (err) {
      error('Network error: ' + err)
    } finally {
      setLoading(false)
    }
  }

  const triggerReminders = async () => {
    setLoading(true)
    try {
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
        success(`Processed ${data.processed} reminders`)
      } else {
        const data = await response.text()
        error(`Failed to trigger reminders: ${response.status} - ${data}`)
      }
    } catch (err) {
      error('Network error: ' + err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head title="Reminder Test" />
      
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Reminder System Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Test Steps:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Allow browser notifications when prompted</li>
                <li>Click "Create Test Reminder" to create a reminder due now</li>
                <li>Click "Trigger Reminders" to process due reminders</li>
                <li>You should see a browser notification and receive an email</li>
              </ol>
            </div>
            
            <div className="flex gap-4">
              <Button 
                onClick={createTestReminder} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Creating...' : 'Create Test Reminder'}
              </Button>
              
              <Button 
                onClick={triggerReminders} 
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                {loading ? 'Processing...' : 'Trigger Reminders'}
              </Button>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> If you don't see notifications, check:
              </p>
              <ul className="text-sm text-blue-700 mt-1 list-disc list-inside">
                <li>Browser notification permissions are allowed</li>
                <li>SendGrid API key is configured (SENDGRID_API_KEY)</li> 
                <li>From email is configured (SENDGRID_FROM_EMAIL)</li>
                <li>Console for Pusher connection errors</li>
                <li>Network tab for auth endpoint responses</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
