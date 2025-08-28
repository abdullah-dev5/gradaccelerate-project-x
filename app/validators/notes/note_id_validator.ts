// app/validators/note/note_id_validator.ts
import vine from '@vinejs/vine'

export const noteIdValidator = vine.compile(
  vine.object({
    id: vine.number().positive(),
  })
)
