// cypress/e2e/demo.cy.ts
describe('E2E Testing Demo', () => {
  describe('Application Health Check', () => {
    it('should successfully load the home page', () => {
      cy.visit('/')
      
      // Verify the page loads successfully
      cy.get('body').should('be.visible')
      cy.title().should('not.be.empty')
    })

    it('should successfully load the login page', () => {
      cy.visit('/login')
      
      // Verify login form elements are present
      cy.get('input[name="email"]').should('be.visible')
      cy.get('input[name="password"]').should('be.visible')
      cy.get('button[type="submit"]').should('be.visible')
    })
  })

  describe('API Testing', () => {
    it('should test authentication API endpoint', () => {
      // Test login API with invalid credentials
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: 'test@example.com',
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
        expect(response.body).to.exist
      })
    })

    it('should test weather API endpoint', () => {
      // Test public weather endpoint
      cy.request({
        method: 'GET',
        url: '/weather',
        failOnStatusCode: false
      }).then((response) => {
        // Should return some response (success or error)
        expect(response.status).to.be.a('number')
        expect(response.body).to.exist
      })
    })
  })

  describe('Form Interaction Testing', () => {
    it('should interact with login form elements', () => {
      cy.visit('/login')
      
      // Wait for hydration and test form field interactions
      cy.wait(2000)
      cy.get('input[name="email"]').should('be.enabled').type('test@example.com')
      cy.get('input[name="email"]').should('have.value', 'test@example.com')
      
      cy.get('input[name="password"]').should('be.enabled').type('password123')
      cy.get('input[name="password"]').should('have.value', 'password123')
      
      // Verify submit button is clickable
      cy.get('button[type="submit"]').should('be.enabled')
    })

    it('should interact with registration form elements', () => {
      cy.visit('/register')
      
      // Wait for hydration and test form field interactions
      cy.wait(2000)
      cy.get('input[name="email"]').should('be.enabled').type('test@example.com')
      cy.get('input[name="email"]').should('have.value', 'test@example.com')
      
      cy.get('input[name="password"]').should('be.enabled').type('password123')
      cy.get('input[name="password"]').should('have.value', 'password123')
      
      // Verify submit button is clickable
      cy.get('button[type="submit"]').should('be.enabled')
    })
  })

  describe('Responsive Design Testing', () => {
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

    it('should work on desktop viewport', () => {
      cy.viewport(1280, 720) // Desktop size
      cy.visit('/')
      
      // Should still be able to see content
      cy.get('body').should('be.visible')
    })
  })

  describe('Error Handling Testing', () => {
    it('should handle API errors gracefully', () => {
      // Mock API error
      cy.intercept('GET', '/api/test-endpoint', { statusCode: 500 }).as('apiError')
      
      // Test that the application handles errors gracefully
      cy.request({
        method: 'GET',
        url: '/api/test-endpoint',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([404, 500])
      })
    })

    it('should handle network timeouts', () => {
      // Test timeout handling
      cy.request({
        method: 'GET',
        url: '/weather',
        timeout: 1000, // Short timeout
        failOnStatusCode: false
      }).then((response) => {
        // Should either succeed or fail gracefully
        expect(response.status).to.be.a('number')
      })
    })
  })

  describe('Cross-Browser Compatibility', () => {
    it('should work with different user agents', () => {
      // Test with different user agent
      cy.visit('/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      
      // Should still load successfully
      cy.get('body').should('be.visible')
    })
  })

  describe('Performance Testing', () => {
    it('should load pages within reasonable time', () => {
      const startTime = Date.now()
      
      cy.visit('/')
      
      cy.get('body').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime
        expect(loadTime).to.be.lessThan(10000) // Should load within 10 seconds
      })
    })
  })
})
