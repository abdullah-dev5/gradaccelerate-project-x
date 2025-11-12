// app/validators/note/create_note_validator.ts
import vine from '@vinejs/vine'

/**
 * ✅ ENHANCED: Comprehensive note creation validator
 * Uses VineJS best practices with proper validation rules
 */
export const createNoteValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1).maxLength(255).escape(),

    content: vine
      .any()
      .transform((value) => {
        if (value === null || value === undefined || value === '') {
          return undefined
        }
        const trimmed = String(value).trim()
        if (trimmed.length > 10000) {
          return trimmed.substring(0, 10000)
        }
        return trimmed || undefined
      })
      .optional(),

    pinned: vine.boolean().optional(),

    image: vine
      .file({
        size: '10mb',
        extnames: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      })
      .optional(),

    imageUrl: vine.string().url().optional(),

    gif_url: vine.string().url().optional(),

    gif_slug: vine.string().trim().optional(),

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

    removeImage: vine.string().optional(),
  })
)

/**
 * ✅ ENHANCED: Note ID validator with proper error messages
 */
export const noteIdValidator = vine.compile(
  vine.object({
    id: vine.number().positive(),
  })
)

/**
 * ✅ ENHANCED: Note search/filter validator
 */
export const noteSearchValidator = vine.compile(
  vine.object({
    search: vine
      .any()
      .transform((value) => {
        if (value === null || value === undefined || value === '') {
          return undefined
        }
        const trimmed = String(value).trim()
        if (trimmed.length === 0) {
          return undefined
        }
        if (trimmed.length > 100) {
          return trimmed.substring(0, 100)
        }
        return trimmed
      })
      .optional(),

    sort: vine.enum(['created_at', 'updated_at', 'title', 'pinned']).optional(),

    order: vine.enum(['asc', 'desc']).optional(),

    page: vine.number().positive().optional(),

    limit: vine.number().positive().max(100).optional(),

    pinned: vine.boolean().optional(),

    labels: vine.array(vine.number().positive()).optional(),
  })
)
