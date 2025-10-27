import * as Sentry from '@sentry/node'

// Initialize Sentry as early as possible
const dsn =
  process.env.SENTRY_DSN ||
  'https://9111231d5f7846b9b013fa8a5ed9476f@o4510069713403905.ingest.de.sentry.io/4510069725659216'

Sentry.init({
  dsn,
  environment: process.env.SENTRY_ENV || process.env.NODE_ENV || 'development',
  // Tracing
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  integrations: [
    // send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],
  // Enable logs to be sent to Sentry
  enableLogs: true,
  beforeSend(event) {
    // Filter out development errors in production
    if (process.env.NODE_ENV === 'production' && event.exception) {
      const error = event.exception.values?.[0]
      if (error?.value?.includes('ECONNREFUSED') || error?.value?.includes('ENOTFOUND')) {
        return null // Don't send network errors in production
      }
    }
    return event
  },
  beforeSendLog(log) {
    // Filter logs based on level or content
    if (log.level === 'trace') {
      // Filter out trace logs in production
      return process.env.NODE_ENV === 'development' ? log : null
    }

    // Add additional context to logs
    if (log.level === 'error' || log.level === 'fatal') {
      log.attributes = {
        ...log.attributes,
        severity: 'high',
        requiresAttention: true,
      }
    }

    return log
  },
})

// Test log to verify Sentry is working
Sentry.logger.info('User triggered test log', { action: 'test_log' })

// Test with a simple error to verify Sentry is working
Sentry.captureException(new Error('Test error for Day 15 verification'))

// Test with a message
Sentry.captureMessage('Test message for Day 15 verification', 'info')

// Test structured logging with fmt function
const testUser = 'Test User'
const testAction = 'Day 15 Demo'
Sentry.logger.info(
  Sentry.logger.fmt`'${testUser}' performed '${testAction}' for Sentry verification`
)

// Test different log levels
Sentry.logger.trace('Starting database connection', { database: 'users' })
Sentry.logger.debug('Cache miss for user', { userId: 123 })
Sentry.logger.info('Updated profile', { profileId: 345 })
Sentry.logger.warn('Rate limit reached for endpoint', {
  endpoint: '/api/v1/notes',
  isEnterprise: false,
})
Sentry.logger.error('Failed to process payment', {
  orderId: 'order_123',
  amount: 99.99,
})
Sentry.logger.fatal('Database connection pool exhausted', {
  database: 'users',
  activeConnections: 100,
})

// Test console logging integration
console.log('Test console.log message for Sentry')
console.warn('Test console.warn message for Sentry')
console.error('Test console.error message for Sentry')
