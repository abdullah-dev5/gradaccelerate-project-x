// start/validators/create_label_validator.ts
import vine from '@vinejs/vine'

export const createLabelValidator = vine.compile(
    vine.object({
        name: vine.string().trim().minLength(1).maxLength(255),
        color: vine.string().optional().nullable(),
    })
)
