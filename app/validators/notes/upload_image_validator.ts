// app/validators/note/upload_image_validator.ts
import vine from '@vinejs/vine'

export const uploadImageValidator = vine.compile(
  vine.object({
    image: vine
      .file({
        size: '5mb', // ✅ FIXED: Increased size limit to match controller
        extnames: ['jpg', 'png', 'jpeg', 'webp', 'gif'], // ✅ FIXED: Added gif support
      })
      .optional(), // ✅ FIXED: File validation doesn't have .required() method
  })
)
