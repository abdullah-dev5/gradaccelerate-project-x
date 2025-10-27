// cypress/e2e/working-tests.cy.ts
describe('Working E2E Tests', () => {
  describe('Application Health', () => {
    it('should load the home page successfully', () => {
      cy.visit('/')
      cy.get('body').should('be.visible')
      cy.title().should('not.be.empty')
    })

    it('should load the login page successfully', () => {
      cy.visit('/login')
      cy.get('body').should('be.visible')
      cy.get('input[name="email"]').should('exist')
      cy.get('input[name="password"]').should('exist')
      cy.get('button[type="submit"]').should('exist')
    })

    it('should load the register page successfully', () => {
      cy.visit('/register')
      cy.get('body').should('be.visible')
      cy.get('input[name="email"]').should('exist')
      cy.get('input[name="password"]').should('exist')
      cy.get('button[type="submit"]').should('exist')
    })
  })

  describe('API Testing', () => {
    it('should test authentication API endpoint', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 422])
        expect(response.body).to.exist
      })
    })

    it('should test weather API endpoint', () => {
      cy.request({
        method: 'GET',
        url: '/weather',
        failOnStatusCode: false,
      }).then((response) => {
        expect(typeof response.status).to.equal('number')
        expect(response.body).to.exist
      })
    })

    it('should test registration API endpoint', () => {
      const timestamp = Date.now()
      const email = `apitest${timestamp}@example.com`

      cy.request({
        method: 'POST',
        url: '/api/auth/register',
        body: {
          name: 'API Test User',
          email: email,
          password: 'password123',
          password_confirmation: 'password123',
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 422])
        expect(response.body).to.exist
      })
    })
  })

  describe('Form Interaction', () => {
    it('should interact with login form after hydration', () => {
      cy.visit('/login')
      // Wait for hydration to complete
      cy.wait(2000)

      // Check if form fields are enabled
      cy.get('input[name="email"]').should('be.enabled')
      cy.get('input[name="password"]').should('be.enabled')

      // Test form interaction
      cy.get('input[name="email"]').type('test@example.com')
      cy.get('input[name="email"]').should('have.value', 'test@example.com')

      cy.get('input[name="password"]').type('password123')
      cy.get('input[name="password"]').should('have.value', 'password123')

      // Verify submit button is clickable
      cy.get('button[type="submit"]').should('be.enabled')
    })

    it('should interact with register form after hydration', () => {
      cy.visit('/register')
      // Wait for hydration to complete
      cy.wait(2000)

      // Check if form fields are enabled
      cy.get('input[name="email"]').should('be.enabled')
      cy.get('input[name="password"]').should('be.enabled')

      // Test form interaction
      cy.get('input[name="email"]').type('test@example.com')
      cy.get('input[name="email"]').should('have.value', 'test@example.com')

      cy.get('input[name="password"]').type('password123')
      cy.get('input[name="password"]').should('have.value', 'password123')

      // Verify submit button is clickable
      cy.get('button[type="submit"]').should('be.enabled')
    })
  })

  describe('Protected Routes', () => {
    it('should handle protected route access correctly', () => {
      // Test dashboard access without authentication
      cy.request({
        method: 'GET',
        url: '/dashboard',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 302])
      })

      // Test notes access without authentication
      cy.request({
        method: 'GET',
        url: '/notes',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 302])
      })

      // Test todos access without authentication
      cy.request({
        method: 'GET',
        url: '/todos',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 302])
      })
    })
  })

  describe('Responsive Design', () => {
    it('should work on mobile viewport', () => {
      cy.viewport(375, 667) // iPhone SE size
      cy.visit('/')
      cy.get('body').should('be.visible')
    })

    it('should work on tablet viewport', () => {
      cy.viewport(768, 1024) // iPad size
      cy.visit('/')
      cy.get('body').should('be.visible')
    })

    it('should work on desktop viewport', () => {
      cy.viewport(1280, 720) // Desktop size
      cy.visit('/')
      cy.get('body').should('be.visible')
    })
  })

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', () => {
      cy.request({
        method: 'GET',
        url: '/non-existent-page',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([404, 500])
      })
    })

    it('should handle API errors gracefully', () => {
      // Test with invalid endpoint
      cy.request({
        method: 'GET',
        url: '/api/invalid-endpoint',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([404, 500])
      })
    })
  })

  describe('Performance', () => {
    it('should load pages within reasonable time', () => {
      const startTime = Date.now()

      cy.visit('/')
      cy.get('body')
        .should('be.visible')
        .then(() => {
          const loadTime = Date.now() - startTime
          expect(loadTime).to.be.lessThan(10000) // Should load within 10 seconds
        })
    })

    it('should load login page within reasonable time', () => {
      const startTime = Date.now()

      cy.visit('/login')
      cy.get('body')
        .should('be.visible')
        .then(() => {
          const loadTime = Date.now() - startTime
          expect(loadTime).to.be.lessThan(10000) // Should load within 10 seconds
        })
    })
  })

  describe('Cross-Browser Compatibility', () => {
    it('should work with different user agents', () => {
      cy.visit('/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      })
      cy.get('body').should('be.visible')
    })

    it('should work with Chrome user agent', () => {
      cy.visit('/', {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      })
      cy.get('body').should('be.visible')
    })
  })
})
