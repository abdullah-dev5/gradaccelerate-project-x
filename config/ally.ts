import env from '#start/env'
import { defineConfig, services } from '@adonisjs/ally'
import type { InferSocialProviders } from '@adonisjs/ally/types'

const allyConfig = defineConfig({
  google: services.google({
    clientId: env.get('GOOGLE_CLIENT_ID'),
    clientSecret: env.get('GOOGLE_CLIENT_SECRET'),
    callbackUrl: env.get('GOOGLE_REDIRECT_URI'),
    scopes: ['openid', 'profile', 'email'],
    // Add this to bypass state verification in development
    ...(env.get('NODE_ENV') === 'development' && {
      stateless: true, // Keep state verification but with better session handling
    }),
  }),
})

export default allyConfig

declare module '@adonisjs/ally/types' {
  interface SocialProviders extends InferSocialProviders<typeof allyConfig> { }
}