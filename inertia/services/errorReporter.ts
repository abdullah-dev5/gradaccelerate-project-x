// Enhanced frontend error reporter with performance monitoring and better categorization.
// No-op if DSN not provided or module missing.

export type FrontendReportContext = {
  tags?: Record<string, string>
  extras?: Record<string, any>
  user?: { id?: number | string; email?: string | null }
}

class FrontendErrorReporter {
  private initialized = false
  private sentry: any | null = null
  private performanceMetrics: Map<string, number> = new Map()
  private errorCounts: Map<string, number> = new Map()

  async init(): Promise<void> {
    if (this.initialized) return
    // Do not initialize on the server (SSR) to avoid window/DOM references
    if (typeof window === 'undefined') {
      this.initialized = true
      return
    }
    const dsn =
      (import.meta as any).env?.VITE_SENTRY_DSN ||
      'https://9111231d5f7846b9b013fa8a5ed9476f@o4510069713403905.ingest.de.sentry.io/4510069725659216'
    if (!dsn) {
      this.initialized = true
      return
    }
    try {
      const mod = await import('@sentry/react')
      this.sentry = mod
      mod.init({
        dsn,
        environment: (import.meta as any).env?.MODE || 'development',
        tracesSampleRate: Number((import.meta as any).env?.VITE_SENTRY_TRACES_SAMPLE_RATE || 1.0),
        sendDefaultPii: true,
        integrations: [
          new mod.BrowserTracing({
            routingInstrumentation: mod.reactRouterV6Instrumentation(
              React.useEffect,
              () => window.location.pathname,
              () => window.location.search,
              () => window.location.hash
            ),
          }),
          new mod.Replay({
            maskAllText: false,
            blockAllMedia: false,
          }),
          mod.feedbackIntegration({
            colorScheme: 'system',
            showBranding: true,
            autoInject: true,
            triggerLabel: 'Report a Bug',
            formTitle: 'Report a Bug',
            submitButtonLabel: 'Send Bug Report',
            messagePlaceholder: "What's the bug? What did you expect?",
            onFormOpen: () => {
              console.log('Feedback form opened')
            },
            onSubmitSuccess: (data, eventId) => {
              console.log('Feedback submitted successfully:', eventId)
            },
            onSubmitError: (error) => {
              console.error('Feedback submission failed:', error)
            },
          }),
        ],
        beforeSend(event) {
          // Filter out development errors in production
          if ((import.meta as any).env?.MODE === 'production' && event.exception) {
            const error = event.exception.values?.[0]
            if (
              error?.value?.includes('ResizeObserver loop limit exceeded') ||
              error?.value?.includes('Non-Error promise rejection')
            ) {
              return null // Don't send these common browser errors
            }
          }
          return event
        },
        beforeBreadcrumb(breadcrumb) {
          // Filter out noisy breadcrumbs
          if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
            return null
          }
          return breadcrumb
        },
      })
    } catch (e) {
      this.sentry = null
    } finally {
      this.initialized = true
    }
  }

  async captureException(error: unknown, ctx?: FrontendReportContext): Promise<void> {
    if (!this.initialized) await this.init()
    if (!this.sentry) return

    try {
      // Track error frequency
      const errorKey = this.getErrorKey(error)
      const count = this.errorCounts.get(errorKey) || 0
      this.errorCounts.set(errorKey, count + 1)

      // Don't send duplicate errors too frequently
      if (count > 5 && count % 10 !== 0) {
        return
      }

      this.sentry.captureException(error, (scope: any) => {
        if (ctx?.user) scope.setUser(ctx.user)
        if (ctx?.tags) Object.entries(ctx.tags).forEach(([k, v]) => scope.setTag(k, v))
        if (ctx?.extras) Object.entries(ctx.extras).forEach(([k, v]) => scope.setExtra(k, v))

        // Add performance context
        if (this.performanceMetrics.size > 0) {
          scope.setContext('performance', Object.fromEntries(this.performanceMetrics))
        }

        // Add error frequency
        scope.setExtra('errorCount', count + 1)
        scope.setExtra('errorKey', errorKey)

        // Set fingerprint for better grouping
        if (error instanceof Error) {
          scope.setFingerprint(this.generateFingerprint(error, ctx))
        }

        return scope
      })
    } catch (reportingError) {
      console.error('Frontend error reporting failed:', reportingError)
    }
  }

  async captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    ctx?: FrontendReportContext
  ): Promise<void> {
    if (!this.initialized) await this.init()
    if (!this.sentry) return

    try {
      this.sentry.captureMessage(message, level, (scope: any) => {
        if (ctx?.user) scope.setUser(ctx.user)
        if (ctx?.tags) Object.entries(ctx.tags).forEach(([k, v]) => scope.setTag(k, v))
        if (ctx?.extras) Object.entries(ctx.extras).forEach(([k, v]) => scope.setExtra(k, v))
        return scope
      })
    } catch (reportingError) {
      console.error('Frontend message reporting failed:', reportingError)
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
          environment: (import.meta as any).env?.MODE || 'development',
        },
      })
    } catch (error) {
      console.error('Failed to start frontend Sentry transaction:', error)
      return null
    }
  }

  async finishTransaction(
    transaction: any,
    status: 'ok' | 'cancelled' | 'unknown_error' | 'internal_error' = 'ok'
  ): Promise<void> {
    if (!transaction || !this.sentry) return

    try {
      transaction.setStatus(status)
      transaction.finish()
    } catch (error) {
      console.error('Failed to finish frontend Sentry transaction:', error)
    }
  }

  async recordPerformance(
    operation: string,
    duration: number,
    metadata?: Record<string, any>
  ): Promise<void> {
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
        ...metadata,
      },
      tags: {
        type: 'performance',
      },
    })
  }

  async recordUserAction(action: string, metadata?: Record<string, any>): Promise<void> {
    await this.captureMessage(`User Action: ${action}`, 'info', {
      extras: metadata,
      tags: {
        type: 'user-action',
      },
    })
  }

  async recordApiCall(
    endpoint: string,
    method: string,
    status: number,
    duration: number
  ): Promise<void> {
    await this.captureMessage(`API Call: ${method} ${endpoint}`, 'info', {
      extras: {
        endpoint,
        method,
        status,
        duration,
      },
      tags: {
        type: 'api-call',
        status: status.toString(),
      },
    })
  }

  private getErrorKey(error: unknown): string {
    if (error instanceof Error) {
      return `${error.name}:${error.message}`
    }
    return String(error)
  }

  private generateFingerprint(error: Error, ctx?: FrontendReportContext): string[] {
    const fingerprint = [error.name, error.message]

    // Add component-specific fingerprinting
    if (ctx?.tags?.component) {
      fingerprint.push(ctx.tags.component)
    }

    // Add error type specific fingerprinting
    if (error.message.includes('Network Error')) {
      fingerprint.push('network-error')
    } else if (error.message.includes('ChunkLoadError')) {
      fingerprint.push('chunk-load-error')
    } else if (error.message.includes('ResizeObserver')) {
      fingerprint.push('resize-observer')
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
        extras: { function: fn.name || 'anonymous' },
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
        extras: { function: fn.name || 'anonymous' },
      })
      return null
    }
  }

  // Method to clear performance metrics
  clearPerformanceMetrics(): void {
    this.performanceMetrics.clear()
  }

  // Method to get error statistics
  getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts)
  }
}

export const frontendErrorReporter = new FrontendErrorReporter()
