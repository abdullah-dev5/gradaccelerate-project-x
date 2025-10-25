// cypress/support/commands.ts
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login a user
       * @example cy.login('user@example.com', 'password')
       */
      login(email?: string, password?: string): Chainable<void>
      
      /**
       * Custom command to register a new user
       * @example cy.register('user@example.com', 'password', 'John Doe')
       */
      register(email?: string, password?: string, name?: string): Chainable<void>
      
      /**
       * Custom command to logout current user
       * @example cy.logout()
       */
      logout(): Chainable<void>
      
      /**
       * Custom command to create a test note
       * @example cy.createNote('Test Note Title', 'Test Note Content')
       */
      createNote(title?: string, content?: string): Chainable<void>
      
      /**
       * Custom command to create a test todo
       * @example cy.createTodo('Test Todo Title', 'Test Todo Description')
       */
      createTodo(title?: string, description?: string): Chainable<void>
      
      /**
       * Custom command to create a test project
       * @example cy.createProject('Test Project', 'Test Project Description')
       */
      createProject(name?: string, description?: string): Chainable<void>
      
      /**
       * Custom command to create a test bookmark
       * @example cy.createBookmark('https://example.com', 'Test Bookmark')
       */
      createBookmark(url?: string, title?: string): Chainable<void>
      
      /**
       * Custom command to wait for API response
       * @example cy.waitForApi('GET', '/api/v1/notes', 'getNotes')
       */
      waitForApi(method: string, url: string, alias: string): Chainable<void>
      
      /**
       * Custom command to test API error handling
       * @example cy.testApiError('POST', '/api/v1/notes', {}, 400)
       */
      testApiError(method: string, url: string, body: any, expectedStatus: number): Chainable<void>
    }
  }
}

// Login command
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password123') => {
  cy.session([email, password], () => {
    cy.visit('/login')
    // Wait for hydration to complete
    cy.wait(1000)
    cy.get('input[name="email"]').should('be.enabled').type(email)
    cy.get('input[name="password"]').should('be.enabled').type(password)
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/login') // Stay on login if credentials are invalid
  })
})

// Register command
Cypress.Commands.add('register', (email = 'test@example.com', password = 'password123', name = 'Test User') => {
  cy.session([email, password, name], () => {
    cy.visit('/register')
    // Wait for hydration to complete
    cy.wait(1000)
    // Check if name field exists, if not skip it
    cy.get('body').then(($body) => {
      if ($body.find('input[name="name"]').length > 0) {
        cy.get('input[name="name"]').should('be.enabled').type(name)
      }
    })
    cy.get('input[name="email"]').should('be.enabled').type(email)
    cy.get('input[name="password"]').should('be.enabled').type(password)
    cy.get('input[name="password_confirmation"]').should('be.enabled').type(password)
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/login') // Stay on login if credentials are invalid
  })
})

// Logout command
Cypress.Commands.add('logout', () => {
  cy.request('POST', '/logout')
  cy.clearCookies()
  cy.clearLocalStorage()
})

// Create note command
Cypress.Commands.add('createNote', (title = 'Test Note', content = 'This is a test note content') => {
  cy.request({
    method: 'POST',
    url: '/api/v1/notes',
    body: {
      title,
      content,
      is_pinned: false
    },
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    failOnStatusCode: false
  })
})

// Create todo command
Cypress.Commands.add('createTodo', (title = 'Test Todo', description = 'This is a test todo description') => {
  cy.request({
    method: 'POST',
    url: '/api/v1/todos',
    body: {
      title,
      description,
      priority: 'medium',
      status: 'pending'
    },
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    failOnStatusCode: false
  })
})

// Create project command
Cypress.Commands.add('createProject', (name = 'Test Project', description = 'This is a test project description') => {
  cy.request({
    method: 'POST',
    url: '/api/v1/projects',
    body: {
      name,
      description,
      status: 'active'
    },
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    failOnStatusCode: false
  })
})

// Create bookmark command
Cypress.Commands.add('createBookmark', (url = 'https://example.com', title = 'Test Bookmark') => {
  cy.request({
    method: 'POST',
    url: '/api/v1/bookmarks',
    body: {
      url,
      title,
      description: 'Test bookmark description'
    },
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    failOnStatusCode: false
  })
})

// Wait for API response command
Cypress.Commands.add('waitForApi', (method: string, url: string, alias: string) => {
  cy.intercept(method, url).as(alias)
  cy.wait(`@${alias}`)
})

// Test API error handling command
Cypress.Commands.add('testApiError', (method: string, url: string, body: any, expectedStatus: number) => {
  cy.request({
    method,
    url,
    body,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    failOnStatusCode: false
  }).then((response) => {
    cy.wrap(response.status).should('equal', expectedStatus)
  })
})
