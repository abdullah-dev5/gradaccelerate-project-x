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
            .nullable(),
        labels: vine
            .array(
                vine.object({
                    id: vine.number().positive().withoutDecimals(),
                    name: vine.string().trim().minLength(1).maxLength(255),
                    color: vine.string().optional(),
                })
            )
            .optional(),
        isCompleted: vine
            .boolean(),
        priority: vine
            .enum(['low', 'medium', 'high'])
            .optional(),
        status: vine
            .enum(['pending', 'in_progress', 'completed'])
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
        labels: vine
            .array(
                vine.object({
                    id: vine.number().positive().withoutDecimals(),
                    name: vine.string().trim().minLength(1).maxLength(255),
                    color: vine.string().optional(),
                })
            )
            .optional(),
        priority: vine
            .enum(['low', 'medium', 'high'])
            .optional(),
        status: vine
            .enum(['pending', 'in_progress', 'completed'])
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
