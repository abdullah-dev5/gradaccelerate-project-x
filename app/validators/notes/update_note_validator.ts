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
        labelIds: vine.array(vine.number()).optional(),
        removeLabelIds: vine.array(vine.number()).optional() // New field

    })
)