import { test } from '@japa/runner'
import { HttpContext } from '@adonisjs/core/http'
import AuthController from '#controllers/AuthController'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'

test.group('AuthController - Login', () => {
    test('should validate login payload', async ({ assert }) => {
      const controller = new AuthController()
      
      // Mock HttpContext
      const mockContext = {
        request: {
          validateUsing: async () => ({
            email: 'test@example.com',
            password: 'password123'
          })
        },
        response: { status: (code: number) => ({ json: (data: any) => ({ status: code, data }) }) },
        auth: { use: () => ({ login: async () => {} }) },
        session: { flash: () => {}, put: () => {} }
      } as any

      // Mock User.query
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: await hash.make('password123'),
        fullName: 'Test User'
      }

      // Mock the User.query method
      const originalQuery = User.query
      User.query = () => ({
        where: () => ({
          first: async () => mockUser
        })
      }) as any

      try {
        const result = await controller.login(mockContext)
        assert.exists(result)
      } finally {
        // Restore original method
        User.query = originalQuery
      }
    })

    test('should handle invalid credentials', async ({ assert }) => {
      const controller = new AuthController()
      
      const mockContext = {
        request: {
          validateUsing: async () => ({
            email: 'nonexistent@example.com',
            password: 'wrongpassword'
          })
        },
        response: { status: (code: number) => ({ json: (data: any) => ({ status: code, data }) }) },
        auth: { use: () => ({}) },
        session: {}
      } as any

      // Mock User.query to return null (user not found)
      const originalQuery = User.query
      User.query = () => ({
        where: () => ({
          first: async () => null
        })
      }) as any

      try {
        const result = await controller.login(mockContext)
        assert.equal(result.status, 401)
        assert.include(result.data.message, 'Invalid credentials')
      } finally {
        User.query = originalQuery
      }
    })

    test('should handle OAuth user login attempt', async ({ assert }) => {
      const controller = new AuthController()
      
      const mockContext = {
        request: {
          validateUsing: async () => ({
            email: 'oauth@example.com',
            password: 'password123'
          })
        },
        response: { status: (code: number) => ({ json: (data: any) => ({ status: code, data }) }) },
        auth: { use: () => ({}) },
        session: {}
      } as any

      // Mock OAuth user (no password)
      const mockOAuthUser = {
        id: 1,
        email: 'oauth@example.com',
        password: null,
        fullName: 'OAuth User'
      }

      const originalQuery = User.query
      User.query = () => ({
        where: () => ({
          first: async () => mockOAuthUser
        })
      }) as any

      try {
        const result = await controller.login(mockContext)
        assert.equal(result.status, 401)
        assert.include(result.data.message, 'social login')
      } finally {
        User.query = originalQuery
      }
    })
})

test.group('AuthController - Register', () => {
    test('should validate registration payload', async ({ assert }) => {
      const controller = new AuthController()
      
      const mockContext = {
        request: {
          validateUsing: async () => ({
            fullName: 'New User',
            email: 'newuser@example.com',
            password: 'password123',
            passwordConfirmation: 'password123'
          })
        },
        response: {
          status: (code: number) => ({
            json: (data: any) => ({ status: code, data })
          })
        },
        session: {
          flash: () => {},
          put: () => {}
        }
      } as any

      // Mock User.create and hash.make
      const mockUser = {
        id: 1,
        fullName: 'New User',
        email: 'newuser@example.com'
      }

      const originalCreate = User.create
      User.create = async () => mockUser as any

      try {
        const result = await controller.register(mockContext)
        assert.exists(result)
      } finally {
        User.create = originalCreate
      }
    })
})

test.group('AuthController - OAuth Methods', () => {
    test('should handle Google OAuth redirect', async ({ assert }) => {
      const controller = new AuthController()
      
      const mockContext = {
        response: {
          redirect: (url: string) => ({ redirectUrl: url }),
          status: (code: number) => ({ json: (data: any) => ({ status: code, data }) })
        }
      } as any

      const result = await controller.googleRedirect(mockContext)
      assert.exists(result)
    })

    test('should handle Google OAuth callback', async ({ assert }) => {
      const controller = new AuthController()
      
      const mockContext = {
        request: {
          input: (key: string) => {
            if (key === 'code') return 'oauth_code'
            if (key === 'state') return 'oauth_state'
            return undefined
          }
        },
        response: {
          redirect: (url: string) => ({ redirectUrl: url }),
          status: (code: number) => ({ json: (data: any) => ({ status: code, data }) })
        },
        session: {
          flash: () => {}
        }
      } as any

      const result = await controller.googleCallback(mockContext)
      assert.exists(result)
    })
})

test.group('AuthController - Logout', () => {
    test('should handle logout', async ({ assert }) => {
      const controller = new AuthController()
      
      const mockContext = {
        auth: {
          use: () => ({
            logout: async () => {}
          })
        },
        request: { header: () => undefined, url: () => '/api/v1/logout' },
        response: { redirect: (url: string) => ({ redirectUrl: url }), status: (code: number) => ({ json: (d: any) => ({ status: code, data: d }) }) },
        session: {
          clear: () => {},
          flash: () => {}
        }
      } as any

      const result = await controller.logout(mockContext)
      assert.exists(result)
    })
})
