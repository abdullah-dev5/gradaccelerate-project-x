import { test } from '@japa/runner'
import { HttpContext } from '@adonisjs/core/http'
import BaseController, { ApiResponse } from '#controllers/BaseController'

test.group('BaseController', () => {
  test('should create success response', ({ assert }) => {
      const data = { id: 1, name: 'Test' }
      const message = 'Operation successful'
      
      const response = ApiResponse.success(data, message)
      
      assert.equal(response.success, true)
      assert.equal(response.message, message)
      assert.deepEqual(response.data, data)
  })

  test('should create success response with default message', ({ assert }) => {
      const data = { id: 1, name: 'Test' }
      
      const response = ApiResponse.success(data)
      
      assert.equal(response.success, true)
      assert.equal(response.message, 'Success')
      assert.deepEqual(response.data, data)
  })

  test('should create error response', ({ assert }) => {
      const message = 'Something went wrong'
      const status = 500
      const errors = { field: 'Invalid value' }
      
      const response = ApiResponse.error(message, status, errors)
      
      assert.equal(response.success, false)
      assert.equal(response.message, message)
      assert.equal(response.status, status)
      assert.deepEqual(response.errors, errors)
  })

  test('should create error response with default status', ({ assert }) => {
      const message = 'Something went wrong'
      
      const response = ApiResponse.error(message)
      
      assert.equal(response.success, false)
      assert.equal(response.message, message)
      assert.equal(response.status, 400)
      assert.isUndefined(response.errors)
  })

  test('should detect Inertia request correctly', ({ assert }) => {
      const controller = new BaseController()
      
      // Mock Inertia request
      const mockRequest = {
        header: (name: string) => {
          if (name === 'x-inertia') return 'true'
          if (name === 'accept') return 'text/html'
          return undefined
        }
      } as any
      
      assert.isTrue(controller.isInertiaRequest(mockRequest))
  })

  test('should detect non-Inertia request correctly', ({ assert }) => {
      const controller = new BaseController()
      
      // Mock API request
      const mockRequest = {
        header: (name: string) => {
          if (name === 'x-inertia') return undefined
          if (name === 'accept') return 'application/json'
          return undefined
        }
      } as any
      
      assert.isFalse(controller.isInertiaRequest(mockRequest))
  })

  test('should handle HTML accept header as Inertia request', ({ assert }) => {
      const controller = new BaseController()
      
      // Mock HTML request
      const mockRequest = {
        header: (name: string) => {
          if (name === 'x-inertia') return undefined
          if (name === 'accept') return 'text/html,application/xhtml+xml'
          return undefined
        }
      } as any
      
      assert.isTrue(controller.isInertiaRequest(mockRequest))
  })
})
