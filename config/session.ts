import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, stores } from '@adonisjs/session'

const sessionConfig = defineConfig({
  enabled: true,
  cookieName: 'adonis-session',

  /**
   * When set to false, the session will persist even after browser closes
   * for better user experience and session persistence.
   */
  clearWithBrowser: false, // ✅ FIXED: Keep session alive after browser closes

  /**
   * Define how long to keep the session data alive without
   * any activity.
   */
  age: '7d', // ✅ ENHANCED: Extended session duration to 7 days

  /**
   * Configuration for session cookie and the
   * cookie store
   */
  cookie: {
    path: '/',
    httpOnly: true,
    secure: app.inProduction,
    sameSite: 'lax',
  },

  /**
   * The store to use. Make sure to validate the environment
   * variable in order to infer the store name without any
   * errors.
   */
  store: env.get('SESSION_DRIVER'),

  /**
   * List of configured stores. Refer documentation to see
   * list of available stores and their config.
   */
  stores: {
    cookie: stores.cookie(),
  },
})

export default sessionConfig
