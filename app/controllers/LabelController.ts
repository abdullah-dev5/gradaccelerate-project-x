// start/controllers/labels_controller.ts
import { HttpContext } from '@adonisjs/core/http'
import Label from '#models/label'
import { createLabelValidator } from '#validators/labels/create_label_validator'

export default class LabelsController {
    // GET /labels - List all labels for the authenticated user
    public async index({ auth }: HttpContext) {
        await auth.check()
        const user = auth.user!
        return await Label.query().where('userId', user.id)
    }

    // POST /labels - Create a label
    public async store({ request, auth }: HttpContext) {
        await auth.check()
        const user = auth.user!
        const payload = await request.validateUsing(createLabelValidator)
        return await Label.create({ ...payload, userId: user.id })
    }

    // DELETE /labels/:id - Delete a label
    public async destroy({ params, auth, response }: HttpContext) {
        await auth.check()
        const user = auth.user!

        const label = await Label.findOrFail(params.id)
        if (label.userId !== user.id) {
            return response.unauthorized({ message: 'Not allowed to delete this label' })
        }

        await label.delete()
        return response.noContent()
    }
}
