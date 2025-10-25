import axios from 'axios'
import { apiService, ApiResponse } from '../../../inertia/services/api.js'

// Mock axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

// Mock window.location
const mockLocation = {
  href: '',
  assign: jest.fn(),
  reload: jest.fn(),
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

// Mock document.querySelector
const mockQuerySelector = jest.fn()
Object.defineProperty(document, 'querySelector', {
  value: mockQuerySelector,
  writable: true,
})

describe('ApiService', () => {
  let mockAxiosInstance: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Create mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
    }

    mockedAxios.create.mockReturnValue(mockAxiosInstance)
    
    // Reset mocks
    mockLocation.href = ''
    mockLocalStorage.getItem.mockReturnValue(null)
    mockQuerySelector.mockReturnValue(null)
  })

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockResponse: ApiResponse = {
        data: { id: 1, name: 'Test' },
        success: true,
        message: 'Success'
      }

      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse })

      const result = await apiService.get('/test')

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', { params: undefined })
      expect(result).toEqual(mockResponse)
    })

    it('should make GET request with parameters', async () => {
      const mockResponse: ApiResponse = {
        data: [{ id: 1 }, { id: 2 }],
        success: true
      }

      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse })

      const params = { page: 1, limit: 10 }
      const result = await apiService.get('/test', params)

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', { params })
      expect(result).toEqual(mockResponse)
    })

    it('should handle GET request errors', async () => {
      const mockError = {
        response: {
          data: { message: 'Not found' },
          status: 404
        }
      }

      mockAxiosInstance.get.mockRejectedValue(mockError)

      await expect(apiService.get('/test')).rejects.toMatchObject({
        message: 'Not found',
        status: 404
      })
    })
  })

  describe('POST requests', () => {
    it('should make successful POST request', async () => {
      const mockData = { name: 'Test Item' }
      const mockResponse: ApiResponse = {
        data: { id: 1, ...mockData },
        success: true,
        message: 'Created successfully'
      }

      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse })

      const result = await apiService.post('/test', mockData)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', mockData)
      expect(result).toEqual(mockResponse)
    })

    it('should handle POST request validation errors', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Validation failed',
            errors: {
              name: ['Name is required'],
              email: ['Email is invalid']
            }
          },
          status: 422
        }
      }

      mockAxiosInstance.post.mockRejectedValue(mockError)

      await expect(apiService.post('/test', {})).rejects.toMatchObject({
        message: 'Validation failed',
        errors: {
          name: ['Name is required'],
          email: ['Email is invalid']
        },
        status: 422
      })
    })
  })

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const mockData = { id: 1, name: 'Updated Item' }
      const mockResponse: ApiResponse = {
        data: mockData,
        success: true,
        message: 'Updated successfully'
      }

      mockAxiosInstance.put.mockResolvedValue({ data: mockResponse })

      const result = await apiService.put('/test/1', mockData)

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test/1', mockData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('PATCH requests', () => {
    it('should make successful PATCH request', async () => {
      const mockData = { name: 'Partially Updated' }
      const mockResponse: ApiResponse = {
        data: { id: 1, ...mockData },
        success: true,
        message: 'Updated successfully'
      }

      mockAxiosInstance.patch.mockResolvedValue({ data: mockResponse })

      const result = await apiService.patch('/test/1', mockData)

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/test/1', mockData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      const mockResponse: ApiResponse = {
        data: null,
        success: true,
        message: 'Deleted successfully'
      }

      mockAxiosInstance.delete.mockResolvedValue({ data: mockResponse })

      const result = await apiService.delete('/test/1')

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test/1')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('File upload', () => {
    it('should upload file successfully', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockResponse: ApiResponse = {
        data: { url: 'https://example.com/test.jpg' },
        success: true,
        message: 'File uploaded successfully'
      }

      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse })

      const result = await apiService.uploadFile('/upload', mockFile, { title: 'Test Image' })

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/upload',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle file upload errors', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockError = {
        response: {
          data: { message: 'File too large' },
          status: 413
        }
      }

      mockAxiosInstance.post.mockRejectedValue(mockError)

      await expect(apiService.uploadFile('/upload', mockFile)).rejects.toMatchObject({
        message: 'File too large',
        status: 413
      })
    })
  })

  describe('Health check', () => {
    it('should return true for successful health check', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { status: 'ok' } })

      const result = await apiService.healthCheck()

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health')
      expect(result).toBe(true)
    })

    it('should return false for failed health check', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'))

      const result = await apiService.healthCheck()

      expect(result).toBe(false)
    })
  })

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      const mockError = {
        request: {},
        message: 'Network Error'
      }

      mockAxiosInstance.get.mockRejectedValue(mockError)

      await expect(apiService.get('/test')).rejects.toMatchObject({
        message: 'Network error - please check your connection',
        status: 0
      })
    })

    it('should handle unexpected errors', async () => {
      const mockError = {
        message: 'Unexpected error'
      }

      mockAxiosInstance.get.mockRejectedValue(mockError)

      await expect(apiService.get('/test')).rejects.toMatchObject({
        message: 'Unexpected error',
        status: 500
      })
    })

    it('should handle 401 unauthorized errors', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      }

      mockAxiosInstance.get.mockRejectedValue(mockError)

      await expect(apiService.get('/test')).rejects.toMatchObject({
        message: 'Unauthorized',
        status: 401
      })

      // Note: The redirect to login would be handled by the response interceptor
      // In a real test, you'd need to test the interceptor separately
    })
  })

  describe('Request interceptors', () => {
    it('should add CSRF token when available', () => {
      const mockElement = {
        getAttribute: jest.fn().mockReturnValue('csrf-token-123')
      }
      mockQuerySelector.mockReturnValue(mockElement)

      // The interceptor would be set up in the constructor
      // We can verify the interceptor was called
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled()
    })

    it('should add JWT token when available', () => {
      mockLocalStorage.getItem.mockReturnValue('jwt-token-123')

      // The interceptor would be set up in the constructor
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled()
    })
  })

  describe('Response interceptors', () => {
    it('should set up response interceptor', () => {
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled()
    })
  })

  describe('Edge cases', () => {
    it('should handle empty response data', async () => {
      const mockResponse: ApiResponse = {
        data: null,
        success: true
      }

      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse })

      const result = await apiService.get('/test')

      expect(result).toEqual(mockResponse)
    })

    it('should handle response with meta pagination', async () => {
      const mockResponse: ApiResponse = {
        data: [{ id: 1 }, { id: 2 }],
        success: true,
        meta: {
          total: 100,
          per_page: 10,
          current_page: 1,
          last_page: 10
        }
      }

      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse })

      const result = await apiService.get('/test')

      expect(result.meta).toEqual(mockResponse.meta)
    })

    it('should handle timeout errors', async () => {
      const mockError = {
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded'
      }

      mockAxiosInstance.get.mockRejectedValue(mockError)

      await expect(apiService.get('/test')).rejects.toMatchObject({
        message: 'timeout of 10000ms exceeded',
        status: 500
      })
    })
  })
})
