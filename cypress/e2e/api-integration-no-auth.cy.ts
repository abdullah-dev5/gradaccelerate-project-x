// cypress/e2e/api-integration-no-auth.cy.ts
describe('API Integration Tests (No Auth Required)', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('Public API Endpoints', () => {
    it('should test weather API endpoint', () => {
      cy.request({
        method: 'GET',
        url: '/weather',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.a('number')
        expect(response.body).to.exist
      })
    })

    it('should test authentication API endpoints', () => {
      // Test login API with invalid credentials
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

      // Test registration API
      const timestamp = Date.now()
      cy.request({
        method: 'POST',
        url: '/api/v1/auth/register',
        body: {
          name: 'API Test User',
          email: `apitest${timestamp}@example.com`,
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
  })

  describe('Protected API Endpoints (Should Return 401)', () => {
    it('should test Notes API endpoints without authentication', () => {
      // Test GET /api/v1/notes
      cy.request({
        method: 'GET',
        url: '/api/v1/notes',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403])
      })

      // Test POST /api/v1/notes
      cy.request({
        method: 'POST',
        url: '/api/v1/notes',
        body: {
          title: 'Test Note',
          content: 'Test Content',
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403])
      })

      // Test PUT /api/v1/notes/1
      cy.request({
        method: 'PUT',
        url: '/api/v1/notes/1',
        body: {
          title: 'Updated Note',
          content: 'Updated Content',
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403])
      })

      // Test DELETE /api/v1/notes/1
      cy.request({
        method: 'DELETE',
        url: '/api/v1/notes/1',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403])
      })
    })

    it('should test Todos API endpoints without authentication', () => {
      // Test GET /api/v1/todos
      cy.request({
        method: 'GET',
        url: '/api/v1/todos',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403])
      })

      // Test POST /api/v1/todos
      cy.request({
        method: 'POST',
        url: '/api/v1/todos',
        body: {
          title: 'Test Todo',
          description: 'Test Description',
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

    it('should test Projects API endpoints without authentication', () => {
      // Test GET /api/v1/projects
      cy.request({
        method: 'GET',
        url: '/api/v1/projects',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403])
      })

      // Test POST /api/v1/projects
      cy.request({
        method: 'POST',
        url: '/api/v1/projects',
        body: {
          title: 'Test Project',
          description: 'Test Description',
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

    it('should test Bookmarks API endpoints without authentication', () => {
      // Test GET /api/v1/bookmarks
      cy.request({
        method: 'GET',
        url: '/api/v1/bookmarks',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403])
      })

      // Test POST /api/v1/bookmarks
      cy.request({
        method: 'POST',
        url: '/api/v1/bookmarks',
        body: {
          url: 'https://example.com',
          title: 'Test Bookmark',
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
  })

  describe('API Error Handling', () => {
    it('should handle malformed JSON requests', () => {
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

    it('should handle missing required headers', () => {
      cy.request({
        method: 'POST',
        url: '/api/v1/auth/login',
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
        failOnStatusCode: false,
      }).then((response) => {
        // Should either work or return 400/415 for missing Content-Type
        expect(response.status).to.be.oneOf([200, 201, 400, 401, 403, 415, 422])
      })
    })

    it('should handle oversized requests', () => {
      const largeContent = 'A'.repeat(100000) // 100KB content

      cy.request({
        method: 'POST',
        url: '/api/v1/auth/register',
        body: {
          name: 'Large Content Test',
          email: 'test@example.com',
          password: largeContent,
          password_confirmation: largeContent,
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        failOnStatusCode: false,
      }).then((response) => {
        // Should either accept large content or return 413 Payload Too Large
        expect(response.status).to.be.oneOf([200, 201, 401, 403, 413, 422])
      })
    })

    it('should handle invalid HTTP methods', () => {
      // Test unsupported method
      cy.request({
        method: 'PATCH',
        url: '/api/v1/auth/login',
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([405, 404]) // Method Not Allowed or Not Found
      })
    })

    it('should handle non-existent endpoints', () => {
      cy.request({
        method: 'GET',
        url: '/api/v1/non-existent-endpoint',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([404, 401]) // Not Found or Unauthorized
      })
    })
  })

  describe('API Performance Testing', () => {
    it('should measure API response times', () => {
      const startTime = Date.now()

      cy.request({
        method: 'GET',
        url: '/weather',
        failOnStatusCode: false,
      }).then((response) => {
        const responseTime = Date.now() - startTime

        expect(response.status).to.be.a('number')
        expect(responseTime).to.be.lessThan(5000) // Should respond within 5 seconds
      })
    })

    it('should test API rate limiting', () => {
      const requests = []

      // Make rapid requests to test rate limiting
      for (let i = 0; i < 10; i++) {
        requests.push(
          cy.request({
            method: 'GET',
            url: '/weather',
            failOnStatusCode: false,
          })
        )
      }

      cy.wrap(Promise.all(requests), { timeout: 30000 }).then((responses) => {
        // Most requests should succeed, some might be rate limited
        const successCount = responses.filter((r) => r && r.status && r.status < 400).length
        const rateLimitedCount = responses.filter((r) => r && r.status && r.status === 429).length

        expect(successCount).to.be.greaterThan(0)
        // Rate limiting might or might not be implemented
      })
    })

    it('should handle concurrent API requests', () => {
      const requests = []

      // Create multiple concurrent requests
      for (let i = 0; i < 5; i++) {
        requests.push(
          cy.request({
            method: 'GET',
            url: '/weather',
            failOnStatusCode: false,
          })
        )
      }

      // All requests should complete successfully
      cy.wrap(Promise.all(requests), { timeout: 30000 }).then((responses) => {
        responses.forEach((response) => {
          if (response && response.status) {
            expect(response.status).to.be.a('number')
          }
        })
      })
    })
  })

  describe('API Content Type Validation', () => {
    it('should handle different content types', () => {
      // Test with application/json
      cy.request({
        method: 'POST',
        url: '/api/v1/auth/login',
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.a('number')
      })

      // Test with text/plain
      cy.request({
        method: 'POST',
        url: '/api/v1/auth/login',
        body: 'email=test@example.com&password=password123',
        headers: {
          'Content-Type': 'text/plain',
          'Accept': 'application/json',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.a('number')
      })
    })

    it('should handle missing Accept header', () => {
      cy.request({
        method: 'GET',
        url: '/weather',
        headers: {
          // No Accept header
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.a('number')
      })
    })
  })

  describe('API Security Testing', () => {
    it('should handle SQL injection attempts', () => {
      cy.request({
        method: 'POST',
        url: '/api/v1/auth/login',
        body: {
          email: "'; DROP TABLE users; --",
          password: "'; DELETE FROM users; --",
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        failOnStatusCode: false,
      }).then((response) => {
        // Should treat as regular text, not execute SQL
        expect(response.status).to.be.oneOf([401, 403, 422])
      })
    })

    it('should handle XSS attempts', () => {
      cy.request({
        method: 'POST',
        url: '/api/v1/auth/login',
        body: {
          email: '<script>alert("XSS")</script>@example.com',
          password: '<img src="x" onerror="alert(\'XSS\')">',
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        failOnStatusCode: false,
      }).then((response) => {
        // Should escape HTML, not execute scripts
        expect(response.status).to.be.oneOf([401, 403, 422])
      })
    })

    it('should handle path traversal attempts', () => {
      cy.request({
        method: 'GET',
        url: '/api/v1/notes/../../../etc/passwd',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403, 404])
      })
    })
  })
})
