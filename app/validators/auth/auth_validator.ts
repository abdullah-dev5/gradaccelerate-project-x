import vine from '@vinejs/vine'

/**
 * Validator for user login
 */
export const loginValidator = vine.compile(
    vine.object({
        email: vine.string().email().normalizeEmail(),
        password: vine.string().minLength(6),
    })
)

/**
 * Validator for user registration
 */
export const registerValidator = vine.compile(
    vine.object({
        fullName: vine.string().minLength(2).maxLength(100).optional(),
        email: vine.string().email().normalizeEmail(),
        password: vine.string().minLength(6).maxLength(255),
    })
)
