import { defineConfig } from '@adonisjs/inertia'
import env from '#start/env'
import app from '@adonisjs/core/services/app'
import type { InferSharedProps } from '@adonisjs/inertia/types'

const inertiaConfig = defineConfig({
  /**
   * Path to the Edge view that will be used as the root view for Inertia responses
   */
  rootView: 'inertia_layout',

  /**
   * Data that should be shared with all rendered pages
   */
  sharedData: {
    user: (ctx) => {
      if (!ctx.auth?.user) return null
      const user = ctx.auth.user
      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        provider: user.provider,
        avatarUrl: user.avatarUrl,
        emailNotificationsEnabled: user.emailNotificationsEnabled,
        webNotificationsEnabled: user.webNotificationsEnabled,
        reminderEmailsEnabled: user.reminderEmailsEnabled,
        reminderWebEnabled: user.reminderWebEnabled,
        createdAt: user.createdAt?.toISO ? user.createdAt.toISO() : user.createdAt?.toString(),
        updatedAt: user.updatedAt?.toISO ? user.updatedAt.toISO() : user.updatedAt?.toString(),
      }
    },
    errors: (ctx) => ctx.session.flashMessages.get('errors'),
    success: (ctx) => ctx.session.flashMessages.get('success'),
    error: (ctx) => ctx.session.flashMessages.get('error'),
    csrf: (ctx) => ctx.request.csrfToken,
    pusherKey: () => env.get('PUSHER_APP_KEY') || '',
    pusherCluster: () => env.get('PUSHER_CLUSTER') || '',
    isProduction: () => app.inProduction,
  },

  /**
   * Options for the server-side rendering
   */
  ssr: {
    enabled: true,
    entrypoint: 'inertia/app/ssr.tsx',
  },
})

export default inertiaConfig

declare module '@adonisjs/inertia/types' {
  export interface SharedProps extends InferSharedProps<typeof inertiaConfig> {}
}
