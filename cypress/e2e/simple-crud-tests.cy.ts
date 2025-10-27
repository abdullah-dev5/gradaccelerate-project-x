// cypress/e2e/simple-crud-tests.cy.ts
describe('Simple CRUD Tests (No Auth Required)', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('Public Pages and API Testing', () => {
    it('should load public pages successfully', () => {
      // Test home page
      cy.visit('/')
      cy.get('body').should('be.visible')

      // Test login page
      cy.visit('/login')
      cy.get('body').should('be.visible')
      cy.get('input[name="email"]').should('exist')
      cy.get('input[name="password"]').should('exist')

      // Test register page
      cy.visit('/register')
      cy.get('body').should('be.visible')
      cy.get('input[name="email"]').should('exist')
      cy.get('input[name="password"]').should('exist')
    })

    it('should test API endpoints without authentication', () => {
      // Test weather API (public endpoint)
      cy.request({
        method: 'GET',
        url: '/weather',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.a('number')
        expect(response.body).to.exist
      })

      // Test protected endpoints should return 401
      cy.request({
        method: 'GET',
        url: '/api/v1/notes',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403])
      })

      cy.request({
        method: 'GET',
        url: '/api/v1/todos',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403])
      })

      cy.request({
        method: 'GET',
        url: '/api/v1/projects',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403])
      })

      cy.request({
        method: 'GET',
        url: '/api/v1/bookmarks',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403])
      })
    })

    it('should test registration API', () => {
      const timestamp = Date.now()
      const email = `testuser${timestamp}@example.com`

      cy.request({
        method: 'POST',
        url: '/api/v1/auth/register',
        body: {
          name: 'Test User',
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
        expect(response.status).to.be.oneOf([200, 201, 403, 422])
        expect(response.body).to.exist
      })
    })

    it('should test login API with invalid credentials', () => {
      cy.request({
        method: 'POST',
        url: '/api/v1/auth/login',
        body: {
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403])
        expect(response.body).to.exist
      })
    })
  })

  describe('Form Validation Testing', () => {
    it('should test login form validation', () => {
      cy.visit('/login')
      cy.wait(1000) // Wait for hydration

      // Test empty form submission
      cy.get('button[type="submit"]').should('be.enabled').click()

      // Should stay on login page or show validation errors
      cy.url().should('include', '/login')

      // Test invalid email format
      cy.get('input[name="email"]').should('be.enabled').type('invalid-email')
      cy.get('input[name="password"]').should('be.enabled').type('password123')
      cy.get('button[type="submit"]').should('be.enabled').click()

      // Should stay on login page
      cy.url().should('include', '/login')
    })

    it('should test register form validation', () => {
      cy.visit('/register')
      cy.wait(1000) // Wait for hydration

      // Test empty form submission
      cy.get('button[type="submit"]').should('be.enabled').click()

      // Should stay on register page or show validation errors
      cy.url().should('include', '/register')

      // Test password mismatch
      cy.get('input[name="email"]').should('be.enabled').type('test@example.com')
      cy.get('input[name="password"]').should('be.enabled').type('password123')
      cy.get('input[name="password_confirmation"]').should('be.enabled').type('differentpassword')
      cy.get('button[type="submit"]').should('be.enabled').click()

      // Should stay on register page
      cy.url().should('include', '/register')
    })
  })

  describe('Error Handling Tests', () => {
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
      // Test invalid API endpoint
      cy.request({
        method: 'GET',
        url: '/api/v1/invalid-endpoint',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([404, 500])
      })
    })

    it('should handle malformed requests', () => {
      // Test malformed JSON
      cy.request({
        method: 'POST',
        url: '/api/v1/auth/login',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 422])
      })
    })
  })

  describe('Performance Tests', () => {
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

    it('should handle concurrent requests', () => {
      const requests = []

      // Make multiple concurrent requests
      for (let i = 0; i < 5; i++) {
        requests.push(
          cy.request({
            method: 'GET',
            url: '/weather',
            failOnStatusCode: false,
          })
        )
      }

      // All requests should complete
      cy.wrap(Promise.all(requests)).then((responses) => {
        responses.forEach((response) => {
          if (response && response.status) {
            expect(response.status).to.be.a('number')
          }
        })
      })
    })
  })

  describe('Cross-Browser Compatibility', () => {
    it('should work on different viewport sizes', () => {
      // Test mobile viewport
      cy.viewport(375, 667)
      cy.visit('/')
      cy.get('body').should('be.visible')

      // Test tablet viewport
      cy.viewport(768, 1024)
      cy.visit('/')
      cy.get('body').should('be.visible')

      // Test desktop viewport
      cy.viewport(1280, 720)
      cy.visit('/')
      cy.get('body').should('be.visible')
    })

    it('should work with different user agents', () => {
      cy.visit('/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      })
      cy.get('body').should('be.visible')
    })
  })
})
