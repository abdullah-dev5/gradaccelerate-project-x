import env from '#start/env'
import { v2 as cloudinary } from 'cloudinary'
import { Exception } from '@adonisjs/core/exceptions'

// ✅ DEBUG: Add detailed logging for Cloudinary config
console.log('Cloudinary config loading...')
console.log('CLOUDINARY_CLOUD_NAME:', env.get('CLOUDINARY_CLOUD_NAME'))
console.log('CLOUDINARY_API_KEY:', env.get('CLOUDINARY_API_KEY') ? 'SET' : 'NOT SET')
console.log('CLOUDINARY_API_SECRET:', env.get('CLOUDINARY_API_SECRET') ? 'SET' : 'NOT SET')

// Validate config on startup
const cloudinaryConfig = {
  cloud_name: env.get('CLOUDINARY_CLOUD_NAME'),
  api_key: env.get('CLOUDINARY_API_KEY'),
  api_secret: env.get('CLOUDINARY_API_SECRET'),
  secure: true,
}

// Verify required credentials
if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
  console.error('Cloudinary configuration missing:', {
    cloud_name: !!cloudinaryConfig.cloud_name,
    api_key: !!cloudinaryConfig.api_key,
    api_secret: !!cloudinaryConfig.api_secret,
  })
  throw new Exception('Missing Cloudinary configuration. Check your .env file', { status: 500 })
}

console.log('Cloudinary config valid, initializing...')

// Initialize and export configured instance
cloudinary.config(cloudinaryConfig)

console.log('Cloudinary initialized successfully')

export default cloudinary
