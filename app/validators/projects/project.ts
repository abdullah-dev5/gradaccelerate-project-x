import vine from '@vinejs/vine'

export const projectValidator = vine.compile(
    vine.object({
        title: vine.string().trim().minLength(3).maxLength(255),
        description: vine.string().trim().maxLength(1000).optional(),
        status: vine.enum(['pending', 'in_progress', 'completed'] as const),
    })
)
