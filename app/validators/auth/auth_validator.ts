import vine from '@vinejs/vine'

/**
 * ✅ ENHANCED: Login validator with comprehensive validation
 */
export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail().maxLength(255),

    password: vine.string().trim().minLength(6).maxLength(255),
  })
)

/**
 * ✅ ENHANCED: Registration validator with comprehensive validation
 */
export const registerValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(100).escape().optional(),

    email: vine.string().trim().email().normalizeEmail().maxLength(255),

    password: vine
      .string()
      .trim()
      .minLength(8)
      .maxLength(255)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),

    passwordConfirmation: vine.string().trim().sameAs('password'),
  })
)

/**
 * ✅ ENHANCED: Password reset validator
 */
export const passwordResetValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail().maxLength(255),
  })
)

/**
 * ✅ ENHANCED: Password update validator
 */
export const passwordUpdateValidator = vine.compile(
  vine.object({
    currentPassword: vine.string().trim().minLength(6),

    newPassword: vine
      .string()
      .trim()
      .minLength(8)
      .maxLength(255)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),

    newPasswordConfirmation: vine.string().trim().sameAs('newPassword'),
  })
)

/**
 * ✅ ENHANCED: Profile update validator
 */
export const profileUpdateValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(100).escape().optional(),

    email: vine.string().trim().email().normalizeEmail().maxLength(255),

    avatar: vine
      .file({
        size: '5mb',
        extnames: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      })
      .optional(),
  })
)

/**
 * ✅ ENHANCED: OAuth callback validator
 */
export const oauthCallbackValidator = vine.compile(
  vine.object({
    code: vine.string().trim().minLength(1),

    state: vine.string().trim().optional(),
  })
)
