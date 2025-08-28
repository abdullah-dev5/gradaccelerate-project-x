// app/validators/note/update_note_validator.ts
import vine from '@vinejs/vine'

export const updateNoteValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1).maxLength(255).optional(),
    content: vine.string().optional(),
    pinned: vine.boolean().optional(),
    imageUrl: vine.string().url().optional().nullable(), // For existing image URL
    image: vine
      .file({
        size: '2mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })
      .optional(),
    removeImage: vine.boolean().optional(),
    gif_url: vine.string().url().optional().nullable(), // For GIF URL
    gif_slug: vine.string().optional().nullable(), // For GIF tracking
    labels: vine
      .any()
      .transform((value) => {
        if (typeof value === 'string') {
          try {
            const arr = JSON.parse(value)
            return Array.isArray(arr) ? arr : []
          } catch {
            return []
          }
        }
        return value ?? []
      })
      .optional()
      .nullable(),
  })
)
