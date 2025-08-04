import vine from '@vinejs/vine'

export const createTodoValidator = vine.compile(
    vine.object({
        title: vine.string().trim().minLength(3).maxLength(255),
        description: vine.string().nullable().optional(),
        isCompleted: vine.boolean().optional(),
        labelIds: vine.array(vine.number().positive()).optional(),
    })
)

export const updateTodoValidator = vine.compile(
    vine.object({
        title: vine.string().trim().minLength(3).maxLength(255).optional(),
        description: vine.string().nullable().optional(),
        isCompleted: vine.boolean().optional(),
        labelIds: vine.array(vine.number().positive()).optional(),
    })
)
