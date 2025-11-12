import vine from '@vinejs/vine'

export default vine.compile(
  vine.object({
    title: vine
      .any()
      .transform((value) => {
        if (value === null || value === undefined || value === '') {
          return undefined
        }
        const trimmed = String(value).trim()
        if (trimmed.length === 0) {
          return undefined
        }
        if (trimmed.length > 200) {
          return trimmed.substring(0, 200)
        }
        return trimmed
      })
      .optional(),
    message: vine
      .any()
      .transform((value) => {
        if (value === null || value === undefined || value === '') {
          return null
        }
        return String(value).trim() || null
      })
      .nullable()
      .optional(),
    remindAt: vine
      .any()
      .transform((value) => {
        if (value === null || value === undefined || value === '') {
          return undefined
        }
        return String(value).trim() || undefined
      })
      .optional(),
    channels: vine
      .array(vine.enum(['web', 'email'] as const))
      .minLength(1)
      .optional(),
  })
)
