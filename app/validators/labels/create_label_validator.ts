// start/validators/create_label_validator.ts
import vine from '@vinejs/vine'

export const createLabelValidator = vine.compile(
    vine.object({
        name: vine
            .string()
            .trim()
            .minLength(1)
            .maxLength(255)
            .unique(async (db, value) => {
                // Check if label name is unique (commented out for now since auth is disabled)
                const existingLabel = await db.from('labels').where('name', value).first()
                return !existingLabel
            }),
        color: vine
            .string()
            .optional()
    })
)
