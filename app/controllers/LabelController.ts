// start/controllers/labels_controller.ts
import { HttpContext } from '@adonisjs/core/http'
import Label from '#models/label'
import { createLabelValidator } from '#validators/labels/create_label_validator'

export default class LabelsController {
    // GET /labels - List all labels for the authenticated user
    public async index({ response }: HttpContext) {
        try {
            // await auth.check()
            // const user = auth.user!
            // return await Label.query().where('userId', user.id)
            const labels = await Label.query()
            return response.ok({
                success: true,
                data: labels,
                message: 'Labels retrieved successfully'
            })
        } catch (error) {
            console.error('Error fetching labels:', error)
            return response.internalServerError({
                success: false,
                message: 'Failed to retrieve labels',
                error: error.message
            })
        }
    }

    // POST /labels - Create a label
    public async store({ request, response }: HttpContext) {
        try {
            // await auth.check()
            // const user = auth.user!

            // Validate request data using Vine.js
            const payload = await request.validateUsing(createLabelValidator)

            // Create label with temporary hardcoded userId
            const label = await Label.create({
                ...payload,
                userId: 1 // Temporary hardcoded userId
            })

            return response.created({
                success: true,
                data: label,
                message: 'Label created successfully'
            })
        } catch (error) {
            // Handle Vine.js validation errors
            if (error.code === 'E_VALIDATION_ERROR') {
                return response.badRequest({
                    success: false,
                    message: 'Validation failed',
                    errors: error.messages
                })
            }

            // Handle other errors
            console.error('Error creating label:', error)
            return response.internalServerError({
                success: false,
                message: 'Failed to create label',
                error: error.message
            })
        }
    }

    // DELETE /labels/:id - Delete a label
    public async destroy({ params, response }: HttpContext) {
        try {
            // await auth.check()
            // const user = auth.user!

            // Validate that id is provided and is a valid number
            const labelId = parseInt(params.id)
            if (isNaN(labelId)) {
                return response.badRequest({
                    success: false,
                    message: 'Invalid label ID provided'
                })
            }

            const label = await Label.find(labelId)

            if (!label) {
                return response.notFound({
                    success: false,
                    message: 'Label not found'
                })
            }

            // if (label.userId !== user.id) {
            //     return response.unauthorized({ 
            //         success: false,
            //         message: 'Not allowed to delete this label' 
            //     })
            // }

            await label.delete()

            return response.ok({
                success: true,
                message: 'Label deleted successfully'
            })
        } catch (error) {
            console.error('Error deleting label:', error)
            return response.internalServerError({
                success: false,
                message: 'Failed to delete label',
                error: error.message
            })
        }
    }
}
