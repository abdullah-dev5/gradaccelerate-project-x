import vine from '@vinejs/vine'

/**
 * ✅ ENHANCED: Comprehensive bookmark creation validator
 * Uses VineJS best practices with proper validation rules
 */
export const createBookmarkValidator = vine.compile(
  vine.object({
    url: vine.string().trim().url().maxLength(2048),
    title: vine.string().trim().minLength(1).maxLength(255).escape().optional(),
    description: vine.string().trim().maxLength(1000).escape().optional(),
    imageUrl: vine.string().url().optional(),
    siteName: vine.string().trim().maxLength(100).escape().optional(),
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
    title: vine.string().trim().minLength(1).maxLength(255).escape().optional(),
    description: vine.string().trim().maxLength(1000).escape().optional(),
    imageUrl: vine.string().url().optional(),
    siteName: vine.string().trim().maxLength(100).escape().optional(),
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
    search: vine.string().trim().maxLength(100).optional(),
    sort: vine.enum(['created_at', 'updated_at', 'title', 'url', 'is_favorite']).optional(),
    order: vine.enum(['asc', 'desc']).optional(),
    page: vine.number().positive().optional(),
    limit: vine.number().positive().max(100).optional(),
    status: vine.enum(['active', 'archived', 'deleted']).optional(),
    isFavorite: vine.boolean().optional(),
    labels: vine.array(vine.number().positive()).optional(),
  })
)
