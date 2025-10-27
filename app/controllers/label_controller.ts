import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Label from '#models/label'

@inject()
export default class LabelController {
  /**
   * Display a list of labels for the authenticated user
   */
  async index({ auth, response }: HttpContext) {
    try {
      const user = auth.user!

      const labels = await Label.query()
        .where('user_id', user.id)
        .orderBy('name')
        .select('id', 'name', 'color')

      return response.json(labels)
    } catch (error) {
      console.error('Error fetching labels:', error)
      return response.status(500).json({
        error: 'Failed to fetch labels',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}
