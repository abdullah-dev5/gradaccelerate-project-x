import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { DateTime } from 'luxon'

/**
 * ✅ ENHANCED: Rate limiting middleware
 * Protects against abuse and follows security best practices
 */
export default class RateLimitMiddleware {
  private static requestCounts = new Map<string, { count: number; resetTime: DateTime }>()

  /**
   * Handle rate limiting for different endpoints
   */
  async handle(ctx: HttpContext, next: NextFn) {
    const clientKey = this.getClientKey(ctx)
    const endpoint = ctx.request.url()
    
    // Define rate limits for different endpoints
    const limits = this.getRateLimits(endpoint)
    
    if (!this.checkRateLimit(clientKey, limits)) {
      return this.handleRateLimitExceeded(ctx)
    }
    
    await next()
  }

  /**
   * Get unique client identifier
   */
  private getClientKey(ctx: HttpContext): string {
    const ip = ctx.request.ip()
    const userAgent = ctx.request.header('user-agent') || 'unknown'
    const userId = ctx.auth.user?.id || 'anonymous'
    
    return `${ip}:${userId}:${userAgent}`
  }

  /**
   * Define rate limits for different endpoints
   */
  private getRateLimits(endpoint: string) {
    // Auth endpoints - stricter limits
    if (endpoint.includes('/auth/login') || endpoint.includes('/auth/register')) {
      return { maxRequests: 5, windowMinutes: 15 }
    }
    
    // API endpoints - moderate limits
    if (endpoint.startsWith('/api/')) {
      return { maxRequests: 100, windowMinutes: 15 }
    }
    
    // File upload endpoints - stricter limits
    if (endpoint.includes('/upload') || endpoint.includes('/image')) {
      return { maxRequests: 10, windowMinutes: 15 }
    }
    
    // Default limits for web routes
    return { maxRequests: 200, windowMinutes: 15 }
  }

  /**
   * Check if rate limit is exceeded
   */
  private checkRateLimit(clientKey: string, limits: { maxRequests: number; windowMinutes: number }): boolean {
    const now = DateTime.now()
    const existing = RateLimitMiddleware.requestCounts.get(clientKey)
    
    // If no existing record or window has expired, create new record
    if (!existing || now > existing.resetTime) {
      RateLimitMiddleware.requestCounts.set(clientKey, {
        count: 1,
        resetTime: now.plus({ minutes: limits.windowMinutes })
      })
      return true
    }
    
    // Check if limit exceeded
    if (existing.count >= limits.maxRequests) {
      return false
    }
    
    // Increment count
    existing.count++
    return true
  }

  /**
   * Handle rate limit exceeded
   */
  private handleRateLimitExceeded(ctx: HttpContext) {
    const isInertiaRequest = ctx.request.header('x-inertia') === 'true'
    const isApiRequest = ctx.request.url().startsWith('/api/')
    
    if (isApiRequest) {
      return ctx.response.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        status: 429,
        retryAfter: 900 // 15 minutes in seconds
      })
    }
    
    if (isInertiaRequest) {
      ctx.session.flash('error', 'Too many requests. Please try again later.')
      return ctx.response.redirect().back()
    }
    
    return ctx.response.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      status: 429
    })
  }

  /**
   * Clean up old rate limit records (call this periodically)
   */
  static cleanup() {
    const now = DateTime.now()
    for (const [key, value] of RateLimitMiddleware.requestCounts.entries()) {
      if (now > value.resetTime) {
        RateLimitMiddleware.requestCounts.delete(key)
      }
    }
  }
}
