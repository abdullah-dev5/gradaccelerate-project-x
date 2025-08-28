import vine from '@vinejs/vine'

/**
 * Validator for share token parameters
 * Ensures the token is a valid UUID format
 */
export const shareTokenValidator = vine.compile(
  vine.object({
    token: vine
      .string()
      .minLength(36)
      .maxLength(36)
      .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
  })
)
