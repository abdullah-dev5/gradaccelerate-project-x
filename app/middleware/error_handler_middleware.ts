import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { errors } from '@vinejs/vine'
import logger from '@adonisjs/core/services/logger'

/**
 * ✅ ENHANCED: Comprehensive error handling middleware
 * Follows AdonisJS v6+ best practices
 */
export default class ErrorHandlerMiddleware {
  /**
   * Handle different types of errors and return appropriate responses
   */
  async handle(ctx: HttpContext, next: NextFn) {
    try {
      await next()
    } catch (error) {
      return this.handleError(error, ctx)
    }
  }

  /**
   * Centralized error handling logic
   */
  private handleError(error: any, ctx: HttpContext) {
    const isInertiaRequest = ctx.request.header('x-inertia') === 'true'
    const acceptsHtml = ctx.request.header('accept')?.includes('text/html')
    const isApiRequest = ctx.request.url().startsWith('/api/')

    // Log error for debugging
    logger.error('Request error:', {
      url: ctx.request.url(),
      method: ctx.request.method(),
      error: error.message,
      stack: error.stack,
      userAgent: ctx.request.header('user-agent'),
      ip: ctx.request.ip(),
    })

    // Handle VineJS validation errors
    if (error instanceof errors.E_VALIDATION_ERROR) {
      return this.handleValidationError(error, ctx, isInertiaRequest, isApiRequest)
    }

    // Handle authentication errors
    if (error.message?.includes('Authentication required') || 
        error.message?.includes('Unauthorized') ||
        error.code === 'E_UNAUTHORIZED_ACCESS') {
      return this.handleAuthError(ctx, isInertiaRequest, isApiRequest)
    }

    // Handle not found errors
    if (error.code === 'E_ROW_NOT_FOUND' || error.status === 404) {
      return this.handleNotFoundError(ctx, isInertiaRequest, isApiRequest)
    }

    // Handle database errors
    if (error.code?.startsWith('SQLITE_') || error.code?.startsWith('E_DATABASE_')) {
      return this.handleDatabaseError(error, ctx, isInertiaRequest, isApiRequest)
    }

    // Handle file upload errors
    if (error.code === 'E_FILE_TOO_LARGE' || error.code === 'E_INVALID_FILE_TYPE') {
      return this.handleFileError(error, ctx, isInertiaRequest, isApiRequest)
    }

    // Handle rate limiting errors
    if (error.code === 'E_TOO_MANY_REQUESTS') {
      return this.handleRateLimitError(ctx, isInertiaRequest, isApiRequest)
    }

    // Handle general server errors
    return this.handleServerError(error, ctx, isInertiaRequest, isApiRequest)
  }

  /**
   * Handle validation errors
   */
  private handleValidationError(error: errors.E_VALIDATION_ERROR, ctx: HttpContext, isInertia: boolean, isApi: boolean) {
    if (isApi) {
      return ctx.response.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: error.messages,
        status: 422
      })
    }

    if (isInertia) {
      // For Inertia requests, flash errors and redirect back
      ctx.session.flash('errors', error.messages)
      return ctx.response.redirect().back()
    }

    // For HTML requests, render error page
    return ctx.response.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: error.messages,
      status: 422
    })
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(ctx: HttpContext, isInertia: boolean, isApi: boolean) {
    if (isApi) {
      return ctx.response.status(401).json({
        success: false,
        message: 'Unauthorized',
        status: 401
      })
    }

    if (isInertia) {
      return ctx.response.redirect('/login')
    }

    return ctx.response.status(401).json({
      success: false,
      message: 'Unauthorized',
      status: 401
    })
  }

  /**
   * Handle not found errors
   */
  private handleNotFoundError(ctx: HttpContext, isInertia: boolean, isApi: boolean) {
    if (isApi) {
      return ctx.response.status(404).json({
        success: false,
        message: 'Resource not found',
        status: 404
      })
    }

    if (isInertia) {
      return ctx.response.redirect('/404')
    }

    return ctx.response.status(404).json({
      success: false,
      message: 'Resource not found',
      status: 404
    })
  }

  /**
   * Handle database errors
   */
  private handleDatabaseError(error: any, ctx: HttpContext, isInertia: boolean, isApi: boolean) {
    const message = process.env.NODE_ENV === 'production' 
      ? 'Database error occurred' 
      : error.message

    if (isApi) {
      return ctx.response.status(500).json({
        success: false,
        message,
        status: 500
      })
    }

    if (isInertia) {
      ctx.session.flash('error', message)
      return ctx.response.redirect().back()
    }

    return ctx.response.status(500).json({
      success: false,
      message,
      status: 500
    })
  }

  /**
   * Handle file upload errors
   */
  private handleFileError(error: any, ctx: HttpContext, isInertia: boolean, isApi: boolean) {
    const message = error.code === 'E_FILE_TOO_LARGE' 
      ? 'File size too large' 
      : 'Invalid file type'

    if (isApi) {
      return ctx.response.status(400).json({
        success: false,
        message,
        status: 400
      })
    }

    if (isInertia) {
      ctx.session.flash('error', message)
      return ctx.response.redirect().back()
    }

    return ctx.response.status(400).json({
      success: false,
      message,
      status: 400
    })
  }

  /**
   * Handle rate limiting errors
   */
  private handleRateLimitError(ctx: HttpContext, isInertia: boolean, isApi: boolean) {
    const message = 'Too many requests. Please try again later.'

    if (isApi) {
      return ctx.response.status(429).json({
        success: false,
        message,
        status: 429
      })
    }

    if (isInertia) {
      ctx.session.flash('error', message)
      return ctx.response.redirect().back()
    }

    return ctx.response.status(429).json({
      success: false,
      message,
      status: 429
    })
  }

  /**
   * Handle general server errors
   */
  private handleServerError(error: any, ctx: HttpContext, isInertia: boolean, isApi: boolean) {
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message

    if (isApi) {
      return ctx.response.status(500).json({
        success: false,
        message,
        status: 500
      })
    }

    if (isInertia) {
      ctx.session.flash('error', message)
      return ctx.response.redirect().back()
    }

    return ctx.response.status(500).json({
      success: false,
      message,
      status: 500
    })
  }
}
