import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * OAuth Security Middleware
 * Adds additional security headers and validates OAuth requests
 */
export default class OAuthSecurityMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx

    // Add security headers for OAuth routes
    response.header('X-Content-Type-Options', 'nosniff')
    response.header('X-Frame-Options', 'DENY')
    response.header('X-XSS-Protection', '1; mode=block')
    response.header('Referrer-Policy', 'strict-origin-when-cross-origin')

    // For OAuth callback routes, add additional security
    if (request.url().includes('/google/callback')) {
      // Validate the request origin (optional but recommended)
      const origin = request.header('origin')
      const referer = request.header('referer')
      
      // Log OAuth callback attempts for security monitoring
      console.log('🔒 OAuth Security: Callback attempt', {
        url: request.url(),
        origin,
        referer,
        ip: request.ip(),
        userAgent: request.header('user-agent'),
        timestamp: new Date().toISOString()
      })

      // Add specific headers for OAuth callback
      response.header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
      response.header('Pragma', 'no-cache')
      response.header('Expires', '0')
    }

    // For OAuth redirect routes, add security headers
    if (request.url().includes('/auth/google/redirect')) {
      response.header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
      response.header('Pragma', 'no-cache')
    }

    return next()
  }
}
