import vine from '@vinejs/vine'

export default vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1).maxLength(200),
    message: vine
      .any()
      .transform((value) => {
        if (value === null || value === undefined || value === '') {
          return null
        }
        return String(value).trim() || null
      })
      .nullable(),
    remindAt: vine.string().trim(), // ISO datetime string
    channels: vine.array(vine.enum(['web', 'email'] as const)).minLength(1),
  })
)
