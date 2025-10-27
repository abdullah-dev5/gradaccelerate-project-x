import nodemailer, { Transporter } from 'nodemailer'
import env from '#start/env'

export default class EmailService {
  private isConfigured: boolean
  private transporter: Transporter | null = null

  constructor() {
    const host = env.get('SMTP_HOST')
    const port = Number(env.get('SMTP_PORT') || 587)
    const secure = String(env.get('SMTP_SECURE') || 'false') === 'true'
    const user = env.get('SMTP_USER')
    const pass = env.get('SMTP_PASS')
    const fromEmail = env.get('SMTP_FROM_EMAIL')

    this.isConfigured = !!(host && user && pass && fromEmail)

    if (!this.isConfigured) {
      console.warn(
        '[EmailService] SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL'
      )
      return
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure, // true for 465, false for other ports
      auth: { user: user!, pass: pass! },
    })
  }

  async sendReminderEmail(
    to: string,
    reminder: {
      title: string
      message?: string | null
      remindAt: string
    }
  ): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn('[EmailService] Cannot send email - SMTP not configured')
      return false
    }

    try {
      const fromName = env.get('SMTP_FROM_NAME') || 'GradAccelerate'
      await this.transporter!.sendMail({
        to,
        from: `${fromName} <${env.get('SMTP_FROM_EMAIL')!}>`,
        subject: `Reminder: ${reminder.title}`,
        text: this.generateTextContent(reminder),
        html: this.generateHtmlContent(reminder),
      })
      console.log(`[EmailService] Reminder email sent to ${to}`)
      return true
    } catch (error) {
      console.error('[EmailService] Failed to send reminder email:', error)
      return false
    }
  }

  private generateTextContent(reminder: {
    title: string
    message?: string | null
    remindAt: string
  }): string {
    const remindAt = new Date(reminder.remindAt).toLocaleString()

    return `
Reminder: ${reminder.title}

${reminder.message || 'This is your scheduled reminder.'}

Scheduled for: ${remindAt}

---
This reminder was sent from your GradAccelerate dashboard.
    `.trim()
  }

  private generateHtmlContent(reminder: {
    title: string
    message?: string | null
    remindAt: string
  }): string {
    const remindAt = new Date(reminder.remindAt).toLocaleString()

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reminder: ${reminder.title}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .reminder-title { font-size: 24px; margin: 0 0 10px 0; }
    .reminder-message { font-size: 16px; margin: 15px 0; }
    .reminder-time { color: #6b7280; font-size: 14px; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="reminder-title">⏰ ${reminder.title}</h1>
  </div>
  <div class="content">
    <div class="reminder-message">
      ${reminder.message || 'This is your scheduled reminder.'}
    </div>
    <div class="reminder-time">
      <strong>Scheduled for:</strong> ${remindAt}
    </div>
    <div class="footer">
      This reminder was sent from your GradAccelerate dashboard.
    </div>
  </div>
</body>
</html>
    `.trim()
  }
}
