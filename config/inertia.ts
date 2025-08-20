import { defineConfig } from '@adonisjs/inertia'
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
<<<<<<< HEAD
    // user: (ctx) => ctx.inertia.always(() => ctx.auth.user),
=======
    user: (ctx) => ctx.auth?.user || null,
    errors: (ctx) => ctx.session.flashMessages.get('errors'),
    success: (ctx) => ctx.session.flashMessages.get('success'),
    error: (ctx) => ctx.session.flashMessages.get('error'),
    csrf: (ctx) => ctx.request.csrfToken,
>>>>>>> 97fc310 (refactor: implement hybrid authentication and fix note creation flow)
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
