// app/validators/note/update_note_validator.ts
import vine from '@vinejs/vine'

export const updateNoteValidator = vine.compile(
    vine.object({
        title: vine.string().minLength(3).maxLength(255).optional(),
        content: vine.string().optional(),
        pinned: vine.boolean().optional(),
        image: vine
            .file({
                size: '2mb',
                extnames: ['jpg', 'jpeg', 'png', 'webp'],
            })
            .optional(),
        removeImage: vine.boolean().optional(),
        gif_url: vine.string().url().optional().nullable(),  // For GIF URL
        gif_slug: vine.string().optional().nullable(),       // For GIF tracking
        labelIds: vine.array(vine.number()).optional(),
        removeLabelIds: vine.array(vine.number()).optional()
    })
)