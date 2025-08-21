import type { HttpContext } from '@adonisjs/core/http'

// ✅ RECOMMENDED: Consistent response helpers
export class ApiResponse {
  static success(data: any, message = 'Success') {
    return {
      success: true,
      message,
      data
    }
  }
  
  static error(message: string, status = 400, errors?: any) {
    return {
      success: false,
      message,
      errors,
      status
    }
  }
}

export default class BaseController {
  /**
   * ✅ IMPROVED: Consistent authentication helper
   * Supports both web (session) and api (JWT) guards
   */
  protected async authenticateUser(ctx: HttpContext) {
    try {
      // Try web guard first (for Inertia requests)
      await ctx.auth.authenticate()
      return ctx.auth.getUserOrFail()
    } catch (error) {
      // If web guard fails, try API guard (for API requests)
      try {
        await ctx.auth.use('api').authenticate()
        return ctx.auth.getUserOrFail()
      } catch (apiError) {
        throw new Error('Authentication required')
      }
    }
  }

  /**
   * ✅ IMPROVED: Handle authentication errors consistently
   * Redirects Inertia requests, returns JSON for API requests
   */
  protected handleAuthError(_error: any, ctx: HttpContext) {
    const isInertiaRequest = ctx.request.header('x-inertia') === 'true'
    const acceptsHtml = ctx.request.header('accept')?.includes('text/html')
    
    if (isInertiaRequest || acceptsHtml) {
      return ctx.response.redirect('/login')
    }
    
    return ctx.response.status(401).json(
      ApiResponse.error('Unauthorized', 401)
    )
  }

  /**
   * ✅ IMPROVED: Check if request is from Inertia
   */
  protected isInertiaRequest(request: HttpContext['request']) {
    return request.header('x-inertia') === 'true' || 
           request.header('accept')?.includes('text/html')
  }

  /**
   * ✅ IMPROVED: Standardized error handling
   */
  protected handleError(error: any, ctx: HttpContext, defaultMessage = 'An error occurred') {
    console.error('Controller error:', error)
    
    const isInertiaRequest = this.isInertiaRequest(ctx.request)
    
    if (isInertiaRequest) {
      return ctx.response.redirect('/login')
    }
    
    return ctx.response.status(500).json(
      ApiResponse.error(defaultMessage, 500)
    )
  }

  /**
   * ✅ IMPROVED: Get current user safely
   */
  protected async getCurrentUser(ctx: HttpContext) {
    try {
      return await this.authenticateUser(ctx)
    } catch (error) {
      this.handleAuthError(error, ctx)
      return null
    }
  }
}
