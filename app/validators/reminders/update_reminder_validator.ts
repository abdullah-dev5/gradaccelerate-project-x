import vine from '@vinejs/vine'

export default vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1).maxLength(200).optional(),
    message: vine.string().trim().nullable().optional(),
    remindAt: vine.string().trim().optional(), // ISO datetime string
    channels: vine.array(vine.enum(['web', 'email'] as const)).minLength(1).optional(),
  })
)


