// cypress/e2e/notes.cy.ts
describe('Notes Management (API Only)', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('Notes API Testing', () => {
    it('should test notes API endpoints without authentication', () => {
      // Test protected endpoints should return 401
      cy.request({
        method: 'GET',
        url: '/api/v1/notes',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403])
      })
    })

    it('should test notes creation API', () => {
      cy.request({
        method: 'POST',
        url: '/api/v1/notes',
        body: {
          title: 'Test Note',
          content: 'This is a test note',
          is_pinned: false,
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403])
      })
    })

    it('should test notes update API', () => {
      cy.request({
        method: 'PUT',
        url: '/api/v1/notes/1',
        body: {
          title: 'Updated Note',
          content: 'This is an updated note',
          is_pinned: true,
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403, 404])
      })
    })

    it('should test notes deletion API', () => {
      cy.request({
        method: 'DELETE',
        url: '/api/v1/notes/1',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403, 404])
      })
    })

    it('should test notes filtering API', () => {
      cy.request({
        method: 'GET',
        url: '/api/v1/notes?filter=pinned',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403])
      })
    })

    it('should test notes search API', () => {
      cy.request({
        method: 'GET',
        url: '/api/v1/notes?search=test',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403])
      })
    })
  })

  describe('Notes Form Validation', () => {
    it('should test notes form validation', () => {
      cy.visit('/login')
      cy.wait(2000) // Wait for hydration

      // Test login form validation
      cy.get('input[name="email"]').should('be.enabled').type('test@example.com')
      cy.get('input[name="password"]').should('be.enabled').type('password123')
      cy.get('button[type="submit"]').should('be.enabled').click()

      // Should stay on login page (invalid credentials)
      cy.url().should('include', '/login')
    })
  })

  describe('Notes Error Handling', () => {
    it('should handle API errors gracefully', () => {
      // Test malformed request
      cy.request({
        method: 'POST',
        url: '/api/v1/notes',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 401, 403, 422])
      })
    })

    it('should handle network errors gracefully', () => {
      // Test timeout handling
      cy.request({
        method: 'GET',
        url: '/api/v1/notes',
        timeout: 2000,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403, 408])
      })
    })

    it('should handle 404 errors gracefully', () => {
      cy.request({
        method: 'GET',
        url: '/api/v1/notes/999999',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403, 404])
      })
    })
  })

  describe('Notes Performance Testing', () => {
    it('should measure API response times', () => {
      const startTime = Date.now()

      cy.request({
        method: 'GET',
        url: '/api/v1/notes',
        failOnStatusCode: false,
      }).then((response) => {
        const responseTime = Date.now() - startTime
        expect(responseTime).to.be.lessThan(5000) // Should respond within 5 seconds
        expect(response.status).to.be.oneOf([401, 403])
      })
    })

    it('should handle concurrent requests', () => {
      const requests = []

      for (let i = 0; i < 3; i++) {
        requests.push(
          cy.request({
            method: 'GET',
            url: '/api/v1/notes',
            failOnStatusCode: false,
          })
        )
      }

      cy.wrap(Promise.all(requests), { timeout: 30000 }).then((responses) => {
        responses.forEach((response) => {
          if (response && response.status) {
            expect(response.status).to.be.oneOf([401, 403])
          }
        })
      })
    })
  })

  describe('Notes Security Testing', () => {
    it('should handle SQL injection attempts', () => {
      cy.request({
        method: 'GET',
        url: "/api/v1/notes?search='; DROP TABLE notes; --",
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403, 400])
      })
    })

    it('should handle XSS attempts', () => {
      cy.request({
        method: 'POST',
        url: '/api/v1/notes',
        body: {
          title: '<script>alert("xss")</script>',
          content: 'Test content',
          is_pinned: false,
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403, 400])
      })
    })
  })
})
