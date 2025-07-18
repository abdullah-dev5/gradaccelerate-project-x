import vine from '@vinejs/vine'

export const projectStatusValidator = vine.compile(
    vine.object({
        status: vine.enum(['pending', 'in_progress', 'completed'] as const),
    })
)
