import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import type { StatusPageRange, StatusPageRenderer } from '@adonisjs/core/types/http'
import ValidationException from '@vinejs/vine'
import { Exception } from '@adonisjs/core/exceptions'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * Status pages are used to display a custom HTML pages for certain error
   * codes. You might want to enable them in production only, but feel
   * free to enable them in development as well.
   */
  protected renderStatusPages = app.inProduction

  /**
   * Status pages is a collection of error code range and a callback
   * to return the HTML contents to send as a response.
   */
  protected statusPages: Record<StatusPageRange, StatusPageRenderer> = {
    '404': (error, { inertia }) => inertia.render('errors/not_found', { error }),
    '500..599': (error, { inertia }) => inertia.render('errors/server_error', { error }),
  }

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    // Handle validation errors with proper formatting
    if (error && typeof error === 'object' && 'messages' in error && 'code' in error) {
      return ctx.response.status(422).json({
        message: 'Validation failed',
        errors: (error as any).messages,
        code: 'VALIDATION_ERROR'
      })
    }

    // Handle HTTP exceptions with proper error codes
    if (error instanceof Exception) {
      const statusCode = error.status
      const message = error.message || this.getDefaultMessage(statusCode)
      
      if (ctx.request.accepts(['json'])) {
        return ctx.response.status(statusCode).json({
          message,
          code: this.getErrorCode(statusCode),
          status: statusCode
        })
      }
    }

    // Handle database constraint errors
    if (this.isDatabaseError(error)) {
      const dbError = this.formatDatabaseError(error)
      if (ctx.request.accepts(['json'])) {
        return ctx.response.status(400).json({
          message: dbError.message,
          code: 'DATABASE_ERROR'
        })
      }
    }

    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the a third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    try {
      const { errorReporter } = await import('#services/error_reporter')
      
      // Determine error severity based on error type
      const severity = this.getErrorSeverity(error)
      
      await errorReporter.captureException(error, {
        user: { 
          id: ctx?.auth?.user?.id, 
          email: (ctx?.auth?.user as any)?.email 
        },
        request: { 
          url: ctx.request.url(), 
          method: ctx.request.method(), 
          headers: this.sanitizeHeaders(ctx.request.headers()),
          body: this.sanitizeRequestBody(ctx.request.body())
        },
        tags: { 
          scope: 'http',
          severity,
          route: ctx.route?.name || 'unknown'
        },
        extras: {
          userAgent: ctx.request.header('user-agent'),
          ip: ctx.request.ip(),
          timestamp: new Date().toISOString()
        }
      })
    } catch (reportingError) {
      // Log to console as fallback if error reporting fails
      console.error('Error reporting failed:', reportingError)
    }
    
    return super.report(error, ctx)
  }

  /**
   * Get default error message for HTTP status codes
   */
  private getDefaultMessage(statusCode: number): string {
    const messages: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      422: 'Validation Error',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable'
    }
    return messages[statusCode] || 'An error occurred'
  }

  /**
   * Get error code for HTTP status codes
   */
  private getErrorCode(statusCode: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE'
    }
    return codes[statusCode] || 'UNKNOWN_ERROR'
  }

  /**
   * Determine error severity for monitoring
   */
  private getErrorSeverity(error: unknown): string {
    if (error && typeof error === 'object' && 'messages' in error) return 'warning'
    if (error instanceof Exception) {
      if (error.status >= 500) return 'error'
      if (error.status >= 400) return 'warning'
    }
    if (this.isDatabaseError(error)) return 'error'
    return 'error'
  }

  /**
   * Check if error is a database-related error
   */
  private isDatabaseError(error: unknown): boolean {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return errorMessage.includes('UNIQUE constraint') ||
           errorMessage.includes('FOREIGN KEY constraint') ||
           errorMessage.includes('NOT NULL constraint') ||
           errorMessage.includes('SQLITE_ERROR')
  }

  /**
   * Format database errors into user-friendly messages
   */
  private formatDatabaseError(error: unknown): { message: string } {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    if (errorMessage.includes('UNIQUE constraint')) {
      return { message: 'This record already exists' }
    }
    if (errorMessage.includes('FOREIGN KEY constraint')) {
      return { message: 'Referenced record does not exist' }
    }
    if (errorMessage.includes('NOT NULL constraint')) {
      return { message: 'Required field is missing' }
    }
    
    return { message: 'Database operation failed' }
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key']
    const sanitized = { ...headers }
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]'
      }
    })
    
    return sanitized
  }

  /**
   * Sanitize request body to remove sensitive information
   */
  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') return body
    
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey']
    const sanitized = { ...body }
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]'
      }
    })
    
    return sanitized
  }
}
