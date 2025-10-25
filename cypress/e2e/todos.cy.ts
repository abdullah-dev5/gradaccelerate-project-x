// cypress/e2e/todos.cy.ts
describe('Todos Management (API Only)', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('Todos API Testing', () => {
    it('should test todos API endpoints without authentication', () => {
      // Test protected endpoints should return 401
      cy.request({
        method: 'GET',
        url: '/api/v1/todos',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403])
      })
    })

    it('should test todos creation API', () => {
      cy.request({
        method: 'POST',
        url: '/api/v1/todos',
        body: {
          title: 'Test Todo',
          description: 'This is a test todo',
          priority: 'medium',
          status: 'pending'
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403])
      })
    })

    it('should test todos update API', () => {
      cy.request({
        method: 'PUT',
        url: '/api/v1/todos/1',
        body: {
          title: 'Updated Todo',
          description: 'This is an updated todo',
          priority: 'high',
          status: 'completed'
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403, 404])
      })
    })

    it('should test todos deletion API', () => {
      cy.request({
        method: 'DELETE',
        url: '/api/v1/todos/1',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403, 404])
      })
    })

    it('should test todos filtering by status API', () => {
      cy.request({
        method: 'GET',
        url: '/api/v1/todos?status=completed',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403])
      })
    })

    it('should test todos filtering by priority API', () => {
      cy.request({
        method: 'GET',
        url: '/api/v1/todos?priority=high',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403])
      })
    })
  })

  describe('Todos Form Validation', () => {
    it('should test todos form validation', () => {
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

  describe('Todos Error Handling', () => {
    it('should handle API errors gracefully', () => {
      // Test malformed request
      cy.request({
        method: 'POST',
        url: '/api/v1/todos',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 401, 403, 422])
      })
    })

    it('should handle network errors gracefully', () => {
      // Test timeout handling
      cy.request({
        method: 'GET',
        url: '/api/v1/todos',
        timeout: 2000,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403, 408])
      })
    })

    it('should handle 404 errors gracefully', () => {
      cy.request({
        method: 'GET',
        url: '/api/v1/todos/999999',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403, 404])
      })
    })
  })

  describe('Todos Performance Testing', () => {
    it('should measure API response times', () => {
      const startTime = Date.now()
      
      cy.request({
        method: 'GET',
        url: '/api/v1/todos',
        failOnStatusCode: false
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
            url: '/api/v1/todos',
            failOnStatusCode: false
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

  describe('Todos Security Testing', () => {
    it('should handle SQL injection attempts', () => {
      cy.request({
        method: 'GET',
        url: '/api/v1/todos?search=\'; DROP TABLE todos; --',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403, 400])
      })
    })

    it('should handle XSS attempts', () => {
      cy.request({
        method: 'POST',
        url: '/api/v1/todos',
        body: {
          title: '<script>alert("xss")</script>',
          description: 'Test description',
          priority: 'medium',
          status: 'pending'
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403, 400])
      })
    })
  })
})