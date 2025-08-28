import env from '#start/env'
import { v2 as cloudinary } from 'cloudinary'
import { Exception } from '@adonisjs/core/exceptions'

// Validate config on startup
const cloudinaryConfig = {
  cloud_name: env.get('CLOUDINARY_CLOUD_NAME'),
  api_key: env.get('CLOUDINARY_API_KEY'),
  api_secret: env.get('CLOUDINARY_API_SECRET'),
  secure: true,
}

// Verify required credentials
if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
  throw new Exception('Missing Cloudinary configuration. Check your .env file', { status: 500 })
}

// Initialize and export configured instance
cloudinary.config(cloudinaryConfig)

export default cloudinary
