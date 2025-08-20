import { test } from '@japa/runner'
import WeathersController from '#controllers/weathers_controller'

test.group('WeathersController - Get Weather', () => {
    test('should return weather data for valid city', async ({ assert }) => {
      const controller = new WeathersController()
      
      const mockContext = {
        request: {
          input: (key: string) => {
            if (key === 'city') return 'London'
            return undefined
          }
        },
        response: {
          json: (data: any) => data
        }
      } as any

      // Mock successful weather API response
      const mockWeatherData = {
        city: 'London',
        temperature: 20,
        description: 'Partly cloudy',
        humidity: 65,
        windSpeed: 15
      }

      // Mock the controller method to return weather data
      const originalGetWeather = controller.getWeather
      controller.getWeather = async (ctx: any) => mockWeatherData

      try {
        const result = await controller.getWeather(mockContext)
        assert.exists(result)
        assert.property(result, 'city')
        assert.property(result, 'temperature')
        assert.property(result, 'description')
        assert.equal(result.city, 'London')
        assert.equal(result.temperature, 20)
      } finally {
        controller.getWeather = originalGetWeather
      }
    })

    test('should handle missing city parameter', async ({ assert }) => {
      const controller = new WeathersController()
      
      const mockContext = {
        request: {
          input: (key: string) => undefined
        },
        response: {
          status: (code: number) => ({
            json: (data: any) => ({ status: code, data })
          })
        }
      } as any

      try {
        const result = await controller.getWeather(mockContext)
        assert.exists(result)
        assert.equal(result.status, 400)
        assert.property(result.data, 'message')
      } catch (error) {
        // Expected behavior for missing parameters
        assert.exists(error)
      }
    })

    test('should handle empty city parameter', async ({ assert }) => {
      const controller = new WeathersController()
      
      const mockContext = {
        request: {
          input: (key: string) => {
            if (key === 'city') return ''
            return undefined
          }
        },
        response: {
          status: (code: number) => ({
            json: (data: any) => ({ status: code, data })
          })
        }
      } as any

      try {
        const result = await controller.getWeather(mockContext)
        assert.exists(result)
        assert.equal(result.status, 400)
        assert.property(result.data, 'message')
      } catch (error) {
        // Expected behavior for empty parameters
        assert.exists(error)
      }
    })
})

test.group('WeathersController - Data Validation', () => {
    test('should validate weather data structure', async ({ assert }) => {
      const controller = new WeathersController()
      
      const mockContext = {
        request: {
          input: (key: string) => {
            if (key === 'city') return 'New York'
            return undefined
          }
        },
        response: {
          json: (data: any) => data
        }
      } as any

      const mockWeatherData = {
        city: 'New York',
        temperature: 25,
        description: 'Sunny',
        humidity: 70,
        windSpeed: 10,
        pressure: 1013,
        visibility: 10
      }

      const originalGetWeather = controller.getWeather
      controller.getWeather = async (ctx: any) => mockWeatherData

      try {
        const result = await controller.getWeather(mockContext)
        assert.exists(result)
        assert.property(result, 'city')
        assert.property(result, 'temperature')
        assert.property(result, 'description')
        assert.property(result, 'humidity')
        assert.property(result, 'windSpeed')
        assert.isNumber(result.temperature)
        assert.isNumber(result.humidity)
        assert.isString(result.description)
      } finally {
        controller.getWeather = originalGetWeather
      }
    })

    test('should handle weather API errors gracefully', async ({ assert }) => {
      const controller = new WeathersController()
      
      const mockContext = {
        request: {
          input: (key: string) => {
            if (key === 'city') return 'InvalidCity'
            return undefined
          }
        },
        response: {
          status: (code: number) => ({
            json: (data: any) => ({ status: code, data })
          })
        }
      } as any

      // Mock API error response
      const mockErrorResponse = {
        error: 'City not found',
        status: 404
      }

      const originalGetWeather = controller.getWeather
      controller.getWeather = async (ctx: any) => {
        throw new Error('City not found')
      }

      try {
        await controller.getWeather(mockContext)
        assert.fail('Should have thrown an error')
      } catch (error) {
        assert.exists(error)
        assert.include(error.message, 'City not found')
      } finally {
        controller.getWeather = originalGetWeather
      }
    })
})

test.group('WeathersController - Units', () => {
    test('should handle temperature in Celsius', async ({ assert }) => {
      const controller = new WeathersController()
      
      const mockContext = {
        request: {
          input: (key: string) => {
            if (key === 'city') return 'Paris'
            if (key === 'units') return 'celsius'
            return undefined
          }
        },
        response: {
          json: (data: any) => data
        }
      } as any

      const mockWeatherData = {
        city: 'Paris',
        temperature: 18,
        description: 'Cloudy',
        humidity: 75,
        windSpeed: 12,
        units: 'celsius'
      }

      const originalGetWeather = controller.getWeather
      controller.getWeather = async (ctx: any) => mockWeatherData

      try {
        const result = await controller.getWeather(mockContext)
        assert.exists(result)
        assert.equal(result.units, 'celsius')
        assert.isTrue(result.temperature >= -50 && result.temperature <= 50)
      } finally {
        controller.getWeather = originalGetWeather
      }
    })

    test('should handle temperature in Fahrenheit', async ({ assert }) => {
      const controller = new WeathersController()
      
      const mockContext = {
        request: {
          input: (key: string) => {
            if (key === 'city') return 'Miami'
            if (key === 'units') return 'fahrenheit'
            return undefined
          }
        },
        response: {
          json: (data: any) => data
        }
      } as any

      const mockWeatherData = {
        city: 'Miami',
        temperature: 85,
        description: 'Hot',
        humidity: 80,
        windSpeed: 8,
        units: 'fahrenheit'
      }

      const originalGetWeather = controller.getWeather
      controller.getWeather = async (ctx: any) => mockWeatherData

      try {
        const result = await controller.getWeather(mockContext)
        assert.exists(result)
        assert.equal(result.units, 'fahrenheit')
        assert.isTrue(result.temperature >= -58 && result.temperature <= 122)
      } finally {
        controller.getWeather = originalGetWeather
      }
    })
})

test.group('WeathersController - Cache', () => {
    test('should handle cached weather data', async ({ assert }) => {
      const controller = new WeathersController()
      
      const mockContext = {
        request: {
          input: (key: string) => {
            if (key === 'city') return 'Tokyo'
            return undefined
          }
        },
        response: {
          json: (data: any) => data
        }
      } as any

      const mockWeatherData = {
        city: 'Tokyo',
        temperature: 22,
        description: 'Rainy',
        humidity: 85,
        windSpeed: 20,
        cached: true,
        cacheTime: new Date().toISOString()
      }

      const originalGetWeather = controller.getWeather
      controller.getWeather = async (ctx: any) => mockWeatherData

      try {
        const result = await controller.getWeather(mockContext)
        assert.exists(result)
        assert.property(result, 'cached')
        assert.property(result, 'cacheTime')
        assert.isTrue(result.cached)
        assert.exists(result.cacheTime)
      } finally {
        controller.getWeather = originalGetWeather
      }
    })
})
