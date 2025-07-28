// app/validators/note/create_note_validator.ts
import vine from '@vinejs/vine'

export const createNoteValidator = vine.compile(
    vine.object({
        title: vine.string().minLength(3),
        content: vine.string().optional(),
        pinned: vine.boolean().optional(),
        image: vine.file({
            size: '2mb',
            extnames: ['jpg', 'jpeg', 'png', 'webp'],
        }).optional(),
        imageUrl: vine.string().optional(), // For existing images
        gif_url: vine
            .string()
            .url()  // Validate as proper URL
            .optional(),
        gif_slug: vine.string().optional(),
        labels: vine.any()
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

