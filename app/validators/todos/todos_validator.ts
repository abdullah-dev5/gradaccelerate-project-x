import vine from '@vinejs/vine'

/**
 * Validator for creating a new todo
 */
export const createTodoValidator = vine.compile(
    vine.object({
        title: vine
            .string()
            .trim()
            .minLength(1)
            .maxLength(255),
        description: vine
            .string()
            .nullable()
            .optional(),
        isCompleted: vine
            .boolean()
            .optional(),
        labelIds: vine
            .array(vine.number().positive().withoutDecimals())
            .optional(),
    })
)

/**
 * Validator for updating an existing todo
 */
export const updateTodoValidator = vine.compile(
    vine.object({
        title: vine
            .string()
            .trim()
            .minLength(1)
            .maxLength(255)
            .optional(),
        description: vine
            .string()
            .nullable()
            .optional(),
        isCompleted: vine
            .boolean()
            .optional(),
        labelIds: vine
            .array(vine.number().positive().withoutDecimals())
            .optional(),
    })
)

/**
 * Validator for todo ID parameter
 */
export const todoIdValidator = vine.compile(
    vine.object({
        id: vine.number().positive().withoutDecimals()
    })
)
