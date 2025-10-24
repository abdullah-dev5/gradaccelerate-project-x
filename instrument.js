// instrument.js - Initialize Sentry before everything else
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://9111231d5f7846b9b013fa8a5ed9476f@o4510069713403905.ingest.de.sentry.io/4510069725659216",
  // Tracing
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  environment: process.env.NODE_ENV || 'development',
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app: undefined }),
    new Sentry.Integrations.OnUncaughtException(),
    new Sentry.Integrations.OnUnhandledRejection(),
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
});

module.exports = Sentry;
