/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring Cloudinary
  |----------------------------------------------------------
  */
  CLOUDINARY_CLOUD_NAME: Env.schema.string.optional(),
  CLOUDINARY_API_KEY: Env.schema.string.optional(),
  CLOUDINARY_API_SECRET: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring ally package (Google OAuth only)
  |----------------------------------------------------------
  */
  GOOGLE_CLIENT_ID: Env.schema.string(),
  GOOGLE_CLIENT_SECRET: Env.schema.string(),
  GOOGLE_REDIRECT_URI: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring GIPHY API TESTING 
  |----------------------------------------------------------
  */

  /*
  |----------------------------------------------------------
  | Variables for configuring Google Gemini AI API
  |----------------------------------------------------------
  */
  GOOGLE_GEMINI_API_KEY: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Pusher (real-time notifications)
  |----------------------------------------------------------
  */
  PUSHER_APP_ID: Env.schema.string.optional(),
  PUSHER_APP_KEY: Env.schema.string.optional(),
  PUSHER_APP_SECRET: Env.schema.string.optional(),
  PUSHER_CLUSTER: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | SMTP (email notifications)
  |----------------------------------------------------------
  */
  SMTP_HOST: Env.schema.string.optional(),
  SMTP_PORT: Env.schema.string.optional(),
  SMTP_SECURE: Env.schema.string.optional(),
  SMTP_USER: Env.schema.string.optional(),
  SMTP_PASS: Env.schema.string.optional(),
  SMTP_FROM_EMAIL: Env.schema.string.optional(),
  SMTP_FROM_NAME: Env.schema.string.optional(),
})
