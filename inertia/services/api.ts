import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'

// Types for API responses
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
  meta?: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  status: number
}

// API service class
class ApiService {
  private api: AxiosInstance
  private baseURL: string

  constructor() {
    this.baseURL = '' // Use relative URLs to match the routes
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      withCredentials: true, // For session-based auth
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor for authentication
    this.api.interceptors.request.use(
      (config) => {
        // Add CSRF token if available
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        if (csrfToken) {
          config.headers['X-CSRF-TOKEN'] = csrfToken
        }

        // Add JWT token if available (for hybrid auth)
        const jwtToken = localStorage.getItem('auth_token')
        if (jwtToken) {
          config.headers['Authorization'] = `Bearer ${jwtToken}`
        }

        // Ensure API requests are not treated as Inertia requests
        config.headers['Accept'] = 'application/json'
        config.headers['X-Requested-With'] = 'XMLHttpRequest'

        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          window.location.href = '/login'
        }
        return Promise.reject(this.handleError(error))
      }
    )
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      const { data, status } = error.response
      return {
        message: (data as any)?.message || 'An error occurred',
        errors: (data as any)?.errors,
        status,
      }
    }

    if (error.request) {
      return {
        message: 'Network error - please check your connection',
        status: 0,
      }
    }

    return {
      message: error.message || 'An unexpected error occurred',
      status: 500,
    }
  }

  // Generic request methods
  async get<T>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.get<ApiResponse<T>>(url, { params })
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.post<ApiResponse<T>>(url, data)
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.put<ApiResponse<T>>(url, data)
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  }

  async patch<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.patch<ApiResponse<T>>(url, data)
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.delete<ApiResponse<T>>(url)
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  }

  // File upload method
  async uploadFile<T>(
    url: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData()
      formData.append('image', file)

      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value)
        })
      }

      const response = await this.api.post<ApiResponse<T>>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.api.get('/health')
      return true
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const apiService = new ApiService()
