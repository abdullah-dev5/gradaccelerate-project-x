import { defineConfig } from 'vite'
import { getDirname } from '@adonisjs/core/helpers'
import inertia from '@adonisjs/inertia/client'
import react from '@vitejs/plugin-react'
import adonisjs from '@adonisjs/vite/client'

export default defineConfig({
  plugins: [
    inertia({ ssr: { enabled: true, entrypoint: 'inertia/app/ssr.tsx' } }),
    react(),
    adonisjs({ entrypoints: ['inertia/app/app.tsx'], reload: ['resources/views/**/*.edge'] }),
  ],

  /**
   * Define aliases for importing modules from
   * your frontend code
   */
  resolve: {
    alias: {
      '~/': `${getDirname(import.meta.url)}/inertia/`,
    },
  },

  /**
   * Server configuration for production
   */
  server: {
    host: '0.0.0.0',
    allowedHosts: [
      'gradaccelerate-project-x-production.up.railway.app',
      '.railway.app',
      'localhost',
      '127.0.0.1',
    ],
    // Disable HMR in production
    hmr: process.env.NODE_ENV === 'development' ? {} : false,
  },

  /**
   * Build configuration for production
   */
  build: {
    // Disable source maps in production for better performance
    sourcemap: process.env.NODE_ENV === 'development',
  },
})
