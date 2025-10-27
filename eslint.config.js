import { configApp } from '@adonisjs/eslint-config'

export default configApp({
  ignores: [
    'node_modules/**',
    'build/**',
    'dist/**',
    'coverage/**',
    '*.sqlite',
    '*.sqlite3',
    'database/*.sqlite',
    'database/*.sqlite3',
    'database/app.sqlite*',
    'cypress/screenshots/**',
    'cypress/videos/**',
    'cypress/downloads/**',
    '.tmp/**',
    '.inertia/**',
  ],
})
