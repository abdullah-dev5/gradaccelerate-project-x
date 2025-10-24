/*
 Enhanced error reporting wrapper with performance monitoring and better categorization.
 Uses dynamic import to avoid runtime failures when @sentry/node is not installed or DSN is not configured.
*/

type ReportContext = {
  user?: { id?: number | string; email?: string | null } | null
  request?: { 
    url?: string
    method?: string
    headers?: Record<string, any>
    body?: any
  }
  tags?: Record<string, string>
  extras?: Record<string, any>
}

type PerformanceContext = {
  operation: string
  duration: number
  metadata?: Record<string, any>
}

class ErrorReporter {
  private initialized = false
  private sentry: any | null = null
  private performanceMetrics: Map<string, number> = new Map()

  async init(): Promise<void> {
    if (this.initialized) return
    const dsn = process.env.SENTRY_DSN || "https://9111231d5f7846b9b013fa8a5ed9476f@o4510069713403905.ingest.de.sentry.io/4510069725659216"
    if (!dsn) {
      this.initialized = true
      return
    }
    try {
      const mod = await import('@sentry/node')
      this.sentry = mod
      mod.init({
        dsn,
        environment: process.env.SENTRY_ENV || process.env.NODE_ENV || 'development',
        tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 1.0),
        sendDefaultPii: true,
        integrations: [
          new mod.Integrations.Http({ tracing: true }),
          new mod.Integrations.Express({ app: undefined }),
          new mod.Integrations.OnUncaughtException(),
          new mod.Integrations.OnUnhandledRejection(),
        ],
        beforeSend(event) {
          // Filter out development errors in production
          if (process.env.NODE_ENV === 'production' && event.exception) {
            const error = event.exception.values?.[0]
            if (error?.value?.includes('ECONNREFUSED') || 
                error?.value?.includes('ENOTFOUND')) {
              return null // Don't send network errors in production
            }
          }
          return event
        }
      })
    } catch (e) {
      // If sentry not installed, just no-op
      this.sentry = null
    } finally {
      this.initialized = true
    }
  }

  async captureException(error: unknown, ctx?: ReportContext): Promise<void> {
    if (!this.initialized) await this.init()
    if (!this.sentry) return
    
    try {
      this.sentry.withScope((scope: any) => {
        // Set user context
        if (ctx?.user) {
          scope.setUser(ctx.user)
        }
        
        // Set tags for categorization
        if (ctx?.tags) {
          Object.entries(ctx.tags).forEach(([k, v]) => scope.setTag(k, v))
        }
        
        // Set extra context
        if (ctx?.extras) {
          Object.entries(ctx.extras).forEach(([k, v]) => scope.setExtra(k, v))
        }
        
        // Set request context
        if (ctx?.request) {
          scope.setContext('request', ctx.request)
        }
        
        // Add performance metrics if available
        if (this.performanceMetrics.size > 0) {
          scope.setContext('performance', Object.fromEntries(this.performanceMetrics))
        }
        
        // Set fingerprint for better grouping
        if (error instanceof Error) {
          const fingerprint = this.generateFingerprint(error, ctx)
          scope.setFingerprint(fingerprint)
        }
        
        this.sentry.captureException(error)
      })
    } catch (reportingError) {
      // Log to console as fallback
      console.error('Sentry reporting failed:', reportingError)
    }
  }

  async captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', ctx?: ReportContext): Promise<void> {
    if (!this.initialized) await this.init()
    if (!this.sentry) return
    
    try {
      this.sentry.withScope((scope: any) => {
        scope.setLevel(level)
        
        if (ctx?.user) scope.setUser(ctx.user)
        if (ctx?.tags) Object.entries(ctx.tags).forEach(([k, v]) => scope.setTag(k, v))
        if (ctx?.extras) Object.entries(ctx.extras).forEach(([k, v]) => scope.setExtra(k, v))
        if (ctx?.request) scope.setContext('request', ctx.request)
        
        this.sentry.captureMessage(message)
      })
    } catch (reportingError) {
      console.error('Sentry message reporting failed:', reportingError)
    }
  }

  async startTransaction(name: string, operation: string): Promise<any> {
    if (!this.initialized) await this.init()
    if (!this.sentry) return null
    
    try {
      return this.sentry.startTransaction({
        name,
        op: operation,
        tags: {
          environment: process.env.NODE_ENV || 'development'
        }
      })
    } catch (error) {
      console.error('Failed to start Sentry transaction:', error)
      return null
    }
  }

  async finishTransaction(transaction: any, status: 'ok' | 'cancelled' | 'unknown_error' | 'internal_error' = 'ok'): Promise<void> {
    if (!transaction || !this.sentry) return
    
    try {
      transaction.setStatus(status)
      transaction.finish()
    } catch (error) {
      console.error('Failed to finish Sentry transaction:', error)
    }
  }

  async recordPerformance(operation: string, duration: number, metadata?: Record<string, any>): Promise<void> {
    this.performanceMetrics.set(operation, duration)
    
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        this.performanceMetrics.set(`${operation}.${key}`, value)
      })
    }
    
    // Send performance data to Sentry
    await this.captureMessage(`Performance: ${operation}`, 'info', {
      extras: {
        duration,
        ...metadata
      },
      tags: {
        type: 'performance'
      }
    })
  }

  private generateFingerprint(error: Error, ctx?: ReportContext): string[] {
    const fingerprint = [error.name, error.message]
    
    // Add route-specific fingerprinting
    if (ctx?.tags?.route) {
      fingerprint.push(ctx.tags.route)
    }
    
    // Add error type specific fingerprinting
    if (error.message.includes('UNIQUE constraint')) {
      fingerprint.push('unique-constraint')
    } else if (error.message.includes('FOREIGN KEY')) {
      fingerprint.push('foreign-key')
    } else if (error.message.includes('NOT NULL')) {
      fingerprint.push('not-null')
    }
    
    return fingerprint
  }

  // Utility method to wrap async functions with error handling
  async wrapAsync<T>(fn: () => Promise<T>, context?: string): Promise<T | null> {
    try {
      return await fn()
    } catch (error) {
      await this.captureException(error, {
        tags: { context: context || 'async-wrapper' },
        extras: { function: fn.name || 'anonymous' }
      })
      return null
    }
  }

  // Utility method to wrap sync functions with error handling
  wrapSync<T>(fn: () => T, context?: string): T | null {
    try {
      return fn()
    } catch (error) {
      this.captureException(error, {
        tags: { context: context || 'sync-wrapper' },
        extras: { function: fn.name || 'anonymous' }
      })
      return null
    }
  }
}

export const errorReporter = new ErrorReporter()


