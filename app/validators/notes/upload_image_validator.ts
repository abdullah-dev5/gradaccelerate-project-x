// app/validators/note/upload_image_validator.ts
import vine from '@vinejs/vine'

export const uploadImageValidator = vine.compile(
  vine.object({
    image: vine
      .file({
        size: '2mb',
        extnames: ['jpg', 'png', 'jpeg', 'webp'],
      })
      .optional(), // Optional if image is not always required
  })
)
