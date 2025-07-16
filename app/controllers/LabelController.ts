import { HttpContext } from '@adonisjs/core/http'
import Label from '#models/label'

export default class LabelsController {
    // List all labels
    public async index({ }: HttpContext) {
        return await Label.all()
    }

    // Create a label
    public async store({ request }: HttpContext) {
        const data = request.only(['name', 'color'])
        return await Label.create(data)
    }

    // Delete a label
    public async destroy({ params, response }: HttpContext) {
        const label = await Label.findOrFail(params.id)
        await label.delete()
        return response.noContent()
    }
}