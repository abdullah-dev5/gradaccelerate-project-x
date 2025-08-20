import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  /**
   * Configure CSP policies for your app. Refer documentation
   * to learn more
   */
  csp: {
    enabled: false,
    directives: {},
    reportOnly: false,
  },

  /**
   * Configure CSRF protection options. Refer documentation
   * to learn more
   */
  csrf: {
<<<<<<< HEAD
    enabled: true,
    exceptRoutes: [],
=======
    enabled: true, // ✅ ENABLED: CSRF protection for security
    exceptRoutes: [
      '/notes', // ✅ TEMPORARY: Add notes route to test CSRF issue
      '/notes/:id/upload',
      '/auth/google/redirect', // OAuth redirect doesn't need CSRF
      '/google/callback', // OAuth callback doesn't need CSRF
      '/api/auth/login', // API endpoints handled separately
      '/api/auth/register',
      '/api/auth/logout'
    ],
>>>>>>> 97fc310 (refactor: implement hybrid authentication and fix note creation flow)
    enableXsrfCookie: true,
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  },

  /**
   * Control how your website should be embedded inside
   * iFrames
   */
  xFrame: {
    enabled: true,
    action: 'DENY',
  },

  /**
   * Force browser to always use HTTPS
   */
  hsts: {
    enabled: true,
    maxAge: '180 days',
  },

  /**
   * Disable browsers from sniffing the content type of a
   * response and always rely on the "content-type" header.
   */
  contentTypeSniffing: {
    enabled: true,
  },
})

export default shieldConfig
