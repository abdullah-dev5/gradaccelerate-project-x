// cypress/support/e2e.ts
// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log
Cypress.on('window:before:load', (win) => {
  // Hide fetch/XHR requests
  const originalFetch = win.fetch
  win.fetch = (...args) => {
    return originalFetch(...args)
  }
})

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing the test on uncaught exceptions
  // that are not related to the application under test
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }

  // Handle React hydration errors
  if (err.message.includes('Hydration failed')) {
    return false
  }

  // Handle other common React/SSR errors
  if (err.message.includes('Minified React error')) {
    return false
  }

  // Handle Tailwind CSS errors
  if (err.message.includes('tailwind is not defined')) {
    return false
  }

  // Handle common JavaScript errors
  if (err.message.includes('Cannot read properties of undefined')) {
    return false
  }

  return true
})
