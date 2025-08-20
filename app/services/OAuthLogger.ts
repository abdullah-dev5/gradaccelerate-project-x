import { DateTime } from 'luxon'

interface OAuthLogData {
  requestId: string
  userId?: number
  email?: string
  provider?: string
  providerId?: string
  action: string
  success: boolean
  duration?: number
  error?: string
  ip?: string
  userAgent?: string
  additionalData?: Record<string, any>
}

export default class OAuthLogger {
  private static generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  static startRequest(): string {
    const requestId = this.generateRequestId()
    console.log(`[OAUTH-${requestId}] Starting OAuth request`)
    return requestId
  }

  static logStep(requestId: string, step: string, data?: Record<string, any>) {
    console.log(`[OAUTH-${requestId}] ${step}`, data || '')
  }

  static logSuccess(data: Omit<OAuthLogData, 'success'>) {
    const logEntry = {
      timestamp: DateTime.now().toISO(),
      level: 'INFO',
      ...data,
      success: true
    }
    
    console.log(`[OAUTH-${data.requestId}] ✅ SUCCESS:`, {
      action: data.action,
      userId: data.userId,
      email: data.email,
      provider: data.provider,
      duration: data.duration ? `${data.duration}ms` : undefined,
      ip: data.ip,
      userAgent: data.userAgent,
      ...data.additionalData
    })

    // TODO: In production, you might want to store this in a database
    // await this.storeLog(logEntry)
  }

  static logError(data: Omit<OAuthLogData, 'success'> & { error: string; stack?: string }) {
    const logEntry = {
      timestamp: DateTime.now().toISO(),
      level: 'ERROR',
      ...data,
      success: false
    }
    
    console.error(`[OAUTH-${data.requestId}] ❌ ERROR:`, {
      action: data.action,
      error: data.error,
      stack: data.stack,
      duration: data.duration ? `${data.duration}ms` : undefined,
      ip: data.ip,
      userAgent: data.userAgent,
      ...data.additionalData
    })

    // TODO: In production, you might want to store this in a database
    // await this.storeLog(logEntry)
  }

  static logWarning(requestId: string, message: string, data?: Record<string, any>) {
    console.warn(`[OAUTH-${requestId}] ⚠️ WARNING: ${message}`, data || '')
  }

  static logSecurityEvent(requestId: string, event: string, data: Record<string, any>) {
    console.warn(`[OAUTH-${requestId}] 🔒 SECURITY: ${event}`, {
      timestamp: DateTime.now().toISO(),
      event,
      ...data
    })
  }

  // Helper methods for specific OAuth events
  static logGoogleUserReceived(requestId: string, googleUser: any) {
    this.logStep(requestId, 'Google user data received', {
      id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      avatarUrl: googleUser.avatarUrl ? 'present' : 'missing'
    })
  }

  static logUserCreation(requestId: string, user: any) {
    this.logStep(requestId, 'New Google user created', {
      userId: user.id,
      email: user.email,
      providerId: user.providerId
    })
  }

  static logAccountLinking(requestId: string, existingUser: any, googleProviderId: string) {
    this.logStep(requestId, 'Linking Google to existing email account', {
      existingUserId: existingUser.id,
      existingEmail: existingUser.email,
      googleProviderId
    })
  }

  static logAuthenticationSuccess(requestId: string, user: any, duration: number) {
    this.logSuccess({
      requestId,
      userId: user.id,
      email: user.email,
      provider: user.provider,
      providerId: user.providerId,
      action: 'oauth_authentication',
      duration,
      additionalData: {
        message: 'OAuth flow completed successfully'
      }
    })
  }

  static logAuthenticationError(requestId: string, error: Error, duration: number) {
    this.logError({
      requestId,
      action: 'oauth_authentication',
      duration,
      error: error.message,
      stack: error.stack
    })
  }
}
