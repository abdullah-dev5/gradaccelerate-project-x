import { HttpContext } from '@adonisjs/core/http'
import { NextFn } from '@adonisjs/core/types/http'
import { errors as vineErrors } from '@vinejs/vine'

export default class InertiaErrorHandler {
  async handle(ctx: HttpContext, next: NextFn) {
    try {
      await next()
    } catch (error) {
      // Handle validation errors specifically for Inertia requests
      if (error instanceof vineErrors.E_VALIDATION_ERROR && ctx.request.header('X-Inertia')) {
        // Flash the validation errors and redirect back
        ctx.session.flash('errors', error.messages)
        return ctx.response.redirect().back()
      }

      // Re-throw the error for other handlers
      throw error
    }
  }
}
