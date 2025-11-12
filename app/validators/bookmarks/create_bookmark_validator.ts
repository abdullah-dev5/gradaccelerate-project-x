import vine from '@vinejs/vine'

/**
 * ✅ ENHANCED: Comprehensive bookmark creation validator
 * Uses VineJS best practices with proper validation rules
 */
export const createBookmarkValidator = vine.compile(
  vine.object({
    url: vine.string().trim().url().maxLength(2048),
    title: vine
      .any()
      .transform((value) => {
        if (value === null || value === undefined || value === '') {
          return undefined
        }
        const trimmed = String(value).trim()
        if (trimmed.length === 0) {
          return undefined
        }
        if (trimmed.length > 255) {
          return trimmed.substring(0, 255)
        }
        return trimmed
      })
      .optional(),
    description: vine
      .any()
      .transform((value) => {
        if (value === null || value === undefined || value === '') {
          return undefined
        }
        const trimmed = String(value).trim()
        if (trimmed.length > 1000) {
          return trimmed.substring(0, 1000)
        }
        return trimmed || undefined
      })
      .optional(),
    imageUrl: vine.string().url().optional(),
    siteName: vine
      .any()
      .transform((value) => {
        if (value === null || value === undefined || value === '') {
          return undefined
        }
        const trimmed = String(value).trim()
        if (trimmed.length > 100) {
          return trimmed.substring(0, 100)
        }
        return trimmed || undefined
      })
      .optional(),
    isFavorite: vine.boolean().optional(),
    labels: vine
      .array(
        vine.object({
          id: vine.number().positive(),
          name: vine.string().trim().minLength(1),
          color: vine
            .string()
            .regex(/^#[0-9A-F]{6}$/i)
            .optional(),
        })
      )
      .optional(),
  })
)

/**
 * ✅ ENHANCED: Bookmark update validator
 */
export const updateBookmarkValidator = vine.compile(
  vine.object({
    title: vine
      .any()
      .transform((value) => {
        if (value === null || value === undefined || value === '') {
          return undefined
        }
        const trimmed = String(value).trim()
        if (trimmed.length === 0) {
          return undefined
        }
        if (trimmed.length > 255) {
          return trimmed.substring(0, 255)
        }
        return trimmed
      })
      .optional(),
    description: vine
      .any()
      .transform((value) => {
        if (value === null || value === undefined || value === '') {
          return undefined
        }
        const trimmed = String(value).trim()
        if (trimmed.length > 1000) {
          return trimmed.substring(0, 1000)
        }
        return trimmed || undefined
      })
      .optional(),
    imageUrl: vine.string().url().optional(),
    siteName: vine
      .any()
      .transform((value) => {
        if (value === null || value === undefined || value === '') {
          return undefined
        }
        const trimmed = String(value).trim()
        if (trimmed.length > 100) {
          return trimmed.substring(0, 100)
        }
        return trimmed || undefined
      })
      .optional(),
    isFavorite: vine.boolean().optional(),
    status: vine.enum(['active', 'archived', 'deleted']).optional(),
    labels: vine
      .array(
        vine.object({
          id: vine.number().positive(),
          name: vine.string().trim().minLength(1),
          color: vine
            .string()
            .regex(/^#[0-9A-F]{6}$/i)
            .optional(),
        })
      )
      .optional(),
  })
)

/**
 * ✅ ENHANCED: Bookmark ID validator
 */
export const bookmarkIdValidator = vine.compile(
  vine.object({
    id: vine.number().positive(),
  })
)

/**
 * ✅ ENHANCED: Bookmark search/filter validator
 */
export const bookmarkSearchValidator = vine.compile(
  vine.object({
    search: vine
      .any()
      .transform((value) => {
        // Handle null, undefined, or empty strings - convert to undefined
        if (value === null || value === undefined || value === '') {
          return undefined
        }
        // Convert to string and trim
        const trimmed = String(value).trim()
        // Return undefined if empty after trim
        if (trimmed.length === 0) {
          return undefined
        }
        // Enforce max length (truncate if needed, or could throw error)
        if (trimmed.length > 100) {
          return trimmed.substring(0, 100)
        }
        return trimmed
      })
      .optional(),
    sort: vine.enum(['created_at', 'updated_at', 'title', 'url', 'is_favorite']).optional(),
    order: vine.enum(['asc', 'desc']).optional(),
    page: vine.number().positive().optional(),
    limit: vine.number().positive().max(100).optional(),
    status: vine.enum(['active', 'archived', 'deleted']).optional(),
    isFavorite: vine.boolean().optional(),
    labels: vine.array(vine.number().positive()).optional(),
  })
)
