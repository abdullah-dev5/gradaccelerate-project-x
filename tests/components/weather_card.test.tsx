import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WeatherCard } from '../../../inertia/components/WeatherCard.js'

// Mock the weather service
const mockWeatherService = {
  getCurrentWeather: jest.fn(),
  getWeatherForecast: jest.fn(),
}

jest.mock('../../../inertia/services/weatherService.js', () => ({
  weatherService: mockWeatherService,
}))

describe('WeatherCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Loading State', () => {
    it('shows loading spinner when weather data is loading', () => {
      mockWeatherService.getCurrentWeather.mockReturnValue({
        loading: true,
        data: null,
        error: null
      })

      render(<WeatherCard />)
      
      expect(screen.getByTestId('weather-loading')).toBeInTheDocument()
      expect(screen.getByText('Loading weather...')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('shows error message when weather fetch fails', () => {
      mockWeatherService.getCurrentWeather.mockReturnValue({
        loading: false,
        data: null,
        error: 'Failed to fetch weather data'
      })

      render(<WeatherCard />)
      
      expect(screen.getByText('Failed to fetch weather data')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    it('retries weather fetch when retry button is clicked', async () => {
      mockWeatherService.getCurrentWeather
        .mockReturnValueOnce({
          loading: false,
          data: null,
          error: 'Network error'
        })
        .mockReturnValueOnce({
          loading: true,
          data: null,
          error: null
        })

      render(<WeatherCard />)
      
      const retryButton = screen.getByText('Try Again')
      fireEvent.click(retryButton)
      
      expect(mockWeatherService.getCurrentWeather).toHaveBeenCalledTimes(2)
    })
  })

  describe('Success State', () => {
    const mockWeatherData = {
      location: 'New York, NY',
      temperature: 72,
      condition: 'Sunny',
      humidity: 65,
      windSpeed: 10,
      icon: 'sunny',
      description: 'Clear sky with sunshine'
    }

    beforeEach(() => {
      mockWeatherService.getCurrentWeather.mockReturnValue({
        loading: false,
        data: mockWeatherData,
        error: null
      })
    })

    it('displays current weather information', () => {
      render(<WeatherCard />)
      
      expect(screen.getByText('New York, NY')).toBeInTheDocument()
      expect(screen.getByText('72°F')).toBeInTheDocument()
      expect(screen.getByText('Sunny')).toBeInTheDocument()
      expect(screen.getByText('Clear sky with sunshine')).toBeInTheDocument()
    })

    it('displays weather details', () => {
      render(<WeatherCard />)
      
      expect(screen.getByText('Humidity: 65%')).toBeInTheDocument()
      expect(screen.getByText('Wind: 10 mph')).toBeInTheDocument()
    })

    it('shows weather icon', () => {
      render(<WeatherCard />)
      
      const weatherIcon = screen.getByAltText('Sunny')
      expect(weatherIcon).toBeInTheDocument()
      expect(weatherIcon).toHaveAttribute('src', '/icons/sunny.svg')
    })

    it('formats temperature correctly', () => {
      const coldWeather = {
        ...mockWeatherData,
        temperature: 32
      }

      mockWeatherService.getCurrentWeather.mockReturnValue({
        loading: false,
        data: coldWeather,
        error: null
      })

      render(<WeatherCard />)
      
      expect(screen.getByText('32°F')).toBeInTheDocument()
    })
  })

  describe('Location Services', () => {
    it('requests user location on mount', () => {
      const mockGeolocation = {
        getCurrentPosition: jest.fn()
      }
      
      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true
      })

      render(<WeatherCard />)
      
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled()
    })

    it('handles geolocation permission denied', async () => {
      const mockGeolocation = {
        getCurrentPosition: jest.fn((_success, error) => {
          error({ code: 1, message: 'Permission denied' })
        })
      }
      
      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true
      })

      mockWeatherService.getCurrentWeather.mockReturnValue({
        loading: false,
        data: null,
        error: 'Location access denied'
      })

      render(<WeatherCard />)
      
      await waitFor(() => {
        expect(screen.getByText('Location access denied')).toBeInTheDocument()
      })
    })

    it('uses default location when geolocation fails', async () => {
      const mockGeolocation = {
        getCurrentPosition: jest.fn((_success, error) => {
          error({ code: 2, message: 'Position unavailable' })
        })
      }
      
      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true
      })

      const defaultWeatherData = {
        location: 'Default City',
        temperature: 70,
        condition: 'Partly Cloudy',
        humidity: 60,
        windSpeed: 8,
        icon: 'partly-cloudy',
        description: 'Partly cloudy skies'
      }

      mockWeatherService.getCurrentWeather.mockReturnValue({
        loading: false,
        data: defaultWeatherData,
        error: null
      })

      render(<WeatherCard />)
      
      await waitFor(() => {
        expect(screen.getByText('Default City')).toBeInTheDocument()
      })
    })
  })

  describe('Refresh Functionality', () => {
    it('refreshes weather data when refresh button is clicked', async () => {
      const mockWeatherData = {
        location: 'New York, NY',
        temperature: 72,
        condition: 'Sunny',
        humidity: 65,
        windSpeed: 10,
        icon: 'sunny',
        description: 'Clear sky with sunshine'
      }

      mockWeatherService.getCurrentWeather.mockReturnValue({
        loading: false,
        data: mockWeatherData,
        error: null
      })

      render(<WeatherCard />)
      
      const refreshButton = screen.getByLabelText('Refresh weather')
      fireEvent.click(refreshButton)
      
      expect(mockWeatherService.getCurrentWeather).toHaveBeenCalledTimes(2)
    })

    it('shows loading state during refresh', async () => {
      mockWeatherService.getCurrentWeather
        .mockReturnValueOnce({
          loading: false,
          data: { location: 'NYC', temperature: 70 },
          error: null
        })
        .mockReturnValueOnce({
          loading: true,
          data: null,
          error: null
        })

      render(<WeatherCard />)
      
      const refreshButton = screen.getByLabelText('Refresh weather')
      fireEvent.click(refreshButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('weather-loading')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      const mockWeatherData = {
        location: 'New York, NY',
        temperature: 72,
        condition: 'Sunny',
        humidity: 65,
        windSpeed: 10,
        icon: 'sunny',
        description: 'Clear sky with sunshine'
      }

      mockWeatherService.getCurrentWeather.mockReturnValue({
        loading: false,
        data: mockWeatherData,
        error: null
      })

      render(<WeatherCard />)
      
      expect(screen.getByRole('region')).toBeInTheDocument()
      expect(screen.getByLabelText('Current weather')).toBeInTheDocument()
    })

    it('has proper heading structure', () => {
      const mockWeatherData = {
        location: 'New York, NY',
        temperature: 72,
        condition: 'Sunny',
        humidity: 65,
        windSpeed: 10,
        icon: 'sunny',
        description: 'Clear sky with sunshine'
      }

      mockWeatherService.getCurrentWeather.mockReturnValue({
        loading: false,
        data: mockWeatherData,
        error: null
      })

      render(<WeatherCard />)
      
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveTextContent('Weather')
    })
  })

  describe('Edge Cases', () => {
    it('handles missing weather data gracefully', () => {
      mockWeatherService.getCurrentWeather.mockReturnValue({
        loading: false,
        data: null,
        error: null
      })

      render(<WeatherCard />)
      
      expect(screen.getByText('Weather data unavailable')).toBeInTheDocument()
    })

    it('handles malformed weather data', () => {
      mockWeatherService.getCurrentWeather.mockReturnValue({
        loading: false,
        data: { temperature: null, condition: undefined },
        error: null
      })

      render(<WeatherCard />)
      
      expect(screen.getByText('--°F')).toBeInTheDocument()
      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })

    it('handles extreme temperature values', () => {
      const extremeWeather = {
        location: 'Antarctica',
        temperature: -40,
        condition: 'Blizzard',
        humidity: 90,
        windSpeed: 50,
        icon: 'blizzard',
        description: 'Extreme blizzard conditions'
      }

      mockWeatherService.getCurrentWeather.mockReturnValue({
        loading: false,
        data: extremeWeather,
        error: null
      })

      render(<WeatherCard />)
      
      expect(screen.getByText('-40°F')).toBeInTheDocument()
      expect(screen.getByText('Blizzard')).toBeInTheDocument()
    })
  })
})
