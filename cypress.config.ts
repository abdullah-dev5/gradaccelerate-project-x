import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'pua6ey',
  e2e: {
    baseUrl: 'http://localhost:3333',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    // Handle uncaught exceptions from the application
    experimentalRunAllSpecs: true,
  },
  // Disable component testing since we're only doing E2E testing
  component: {
    supportFile: false,
  },
})
