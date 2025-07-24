// start/controllers/labels_controller.ts
import { HttpContext } from '@adonisjs/core/http'
import Label from '#models/label'
import { createLabelValidator } from '#validators/labels/create_label_validator'

export default class LabelsController {
    // Alias method for backward compatibility - redirect to index
    async indexPage(context: HttpContext) {
        return this.index(context);
    }

    // GET /labels - List all labels for the authenticated user
    public async index({ response, auth, request, inertia }: HttpContext) {
        try {
            await auth.authenticate() // Authenticate first
            const user = auth.getUserOrFail()
            const labels = await Label.query()
                .where('userId', user.id) // Filter by authenticated user

            // Check if this is an Inertia request
            const isInertiaRequest = request.header('x-inertia') === 'true'

            if (isInertiaRequest) {
                return inertia.render('labels/index', {
                    labels: labels.map(label => label.serialize()),
                    success: true,
                    message: 'Labels retrieved successfully'
                })
            }

            return response.ok({
                success: true,
                data: labels,
                message: 'Labels retrieved successfully'
            })
        } catch (error) {
            // Check if this is an Inertia request
            const isInertiaRequest = request.header('x-inertia') === 'true'

            if (isInertiaRequest) {
                // Handle authentication errors properly for Inertia requests
                if (error.message.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
                    return response.redirect('/login')
                }
                return inertia.render('labels/index', {
                    labels: [],
                    error: 'Failed to retrieve labels'
                })
            }

            return response.internalServerError({
                success: false,
                message: 'Failed to retrieve labels',
                error: error.message
            })
        }
    }

    // POST /labels - Create a label
    public async store({ request, response, auth }: HttpContext) {
        try {
            await auth.authenticate() // Authenticate first
            const user = auth.getUserOrFail()
            // Validate request data using Vine.js
            const payload = await request.validateUsing(createLabelValidator)

            // Create label
            const label = await Label.create({
                ...payload,
                userId: user.id // Set the authenticated user as owner
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
            return response.internalServerError({
                success: false,
                message: 'Failed to create label',
                error: error.message
            })
        }
    }

    // DELETE /labels/:id - Delete a label
    public async destroy({ params, response, auth }: HttpContext) {
        try {
            await auth.authenticate() // Authenticate first
            const user = auth.getUserOrFail()
            // Validate that id is provided and is a valid number
            const labelId = parseInt(params.id)
            if (isNaN(labelId)) {
                return response.badRequest({
                    success: false,
                    message: 'Invalid label ID provided'
                })
            }

            const label = await Label.query()
                .where('id', labelId)
                .where('userId', user.id) // Ensure user owns the label
                .first()

            if (!label) {
                return response.notFound({
                    success: false,
                    message: 'Label not found or you do not have permission to delete it'
                })
            }

            await label.delete()

            return response.ok({
                success: true,
                message: 'Label deleted successfully'
            })
        } catch (error) {
            return response.internalServerError({
                success: false,
                message: 'Failed to delete label',
                error: error.message
            })
        }
    }
}
