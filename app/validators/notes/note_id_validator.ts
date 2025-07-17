// app/validators/note/note_id_validator.ts
import vine from '@vinejs/vine'

export const noteIdValidator = vine.compile(
    vine.object({
        note_id: vine.number().positive(),
    })
)
