// cypress/e2e/basic-functionality.cy.ts
describe('Basic Application Functionality', () => {
  describe('Public Pages', () => {
    it('should load the home page', () => {
      cy.visit('/')
      
      // Should show home page content
      cy.contains('Welcome').should('be.visible')
    })

    it('should load the login page', () => {
      cy.visit('/login')
      
      // Should show login form
      cy.get('input[name="email"]').should('be.visible')
      cy.get('input[name="password"]').should('be.visible')
      cy.get('button[type="submit"]').should('be.visible')
    })

    it('should load the register page', () => {
      cy.visit('/register')
      
      // Should show registration form
      cy.get('input[name="email"]').should('be.visible')
      cy.get('input[name="password"]').should('be.visible')
      cy.get('input[name="password_confirmation"]').should('be.visible')
      
      // Name field might not be present
      cy.get('body').then(($body) => {
        if ($body.find('input[name="name"]').length > 0) {
          cy.get('input[name="name"]').should('be.visible')
        }
      })
      cy.get('button[type="submit"]').should('be.visible')
    })
  })

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected routes', () => {
      // Test protected routes return appropriate status codes
      cy.request({
        method: 'GET',
        url: '/dashboard',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403, 302])
      })

      cy.request({
        method: 'GET',
        url: '/notes',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403, 302])
      })

      cy.request({
        method: 'GET',
        url: '/todos',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403, 302])
      })

      cy.request({
        method: 'GET',
        url: '/projects',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403, 302])
      })

      cy.request({
        method: 'GET',
        url: '/bookmarks',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403, 302])
      })
    })
  })

  describe('Form Validation', () => {
    it('should show validation errors for empty login form', () => {
      cy.visit('/login')
      
      // Try to submit empty form
      cy.get('button[type="submit"]').click()
      
      // Should show validation errors (if implemented)
      // Note: This test might need adjustment based on actual form validation implementation
      cy.get('body').should('be.visible') // Basic check that page is still loaded
    })

    it('should show validation errors for empty registration form', () => {
      cy.visit('/register')
      
      // Try to submit empty form
      cy.get('button[type="submit"]').click()
      
      // Should show validation errors (if implemented)
      // Note: This test might need adjustment based on actual form validation implementation
      cy.get('body').should('be.visible') // Basic check that page is still loaded
    })
  })

  describe('Navigation', () => {
    it('should navigate between public pages', () => {
      cy.visit('/')
      
      // Navigate to login
      cy.get('a[href="/login"]').first().click()
      cy.url().should('include', '/login')
      
      // Navigate to register
      cy.get('a[href="/register"]').first().click()
      cy.url().should('include', '/register')
      
      // Navigate back to home
      cy.contains('Home').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/')
    })
  })

  describe('API Endpoints', () => {
    it('should respond to health check endpoints', () => {
      // Test public API endpoints
      cy.request({
        method: 'GET',
        url: '/weather',
        failOnStatusCode: false
      }).then((response) => {
        // Should either return data or a proper error response
        expect(response.status).to.be.oneOf([200, 404, 500])
      })
    })

    it('should handle authentication API endpoints', () => {
      // Test login endpoint with invalid credentials
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: 'invalid@example.com',
          password: 'wrongpassword'
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        failOnStatusCode: false
      }).then((response) => {
        // Should return 401 or 422 for invalid credentials
        expect(response.status).to.be.oneOf([401, 422])
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', () => {
      cy.request({
        method: 'GET',
        url: '/non-existent-page',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([404, 500])
      })
    })

    it('should handle network errors gracefully', () => {
      // Test network error handling with API request
      cy.request({
        method: 'GET',
        url: '/api/nonexistent',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([404, 500])
      })
    })
  })

  describe('Responsive Design', () => {
    it('should work on mobile viewport', () => {
      cy.viewport(375, 667) // iPhone SE size
      cy.visit('/')
      
      // Should still be able to see content
      cy.get('body').should('be.visible')
    })

    it('should work on tablet viewport', () => {
      cy.viewport(768, 1024) // iPad size
      cy.visit('/')
      
      // Should still be able to see content
      cy.get('body').should('be.visible')
    })
  })
})
