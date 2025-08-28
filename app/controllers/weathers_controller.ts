import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import axios from 'axios'
import vine from '@vinejs/vine'

const weatherCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 5 // 5 minutes

// 🌤️ VineJS schema
const weatherQuerySchema = vine.object({
  lat: vine
    .string()
    .regex(/^-?\d+(\.\d+)?$/)
    .optional(),
  lon: vine
    .string()
    .regex(/^-?\d+(\.\d+)?$/)
    .optional(),
})

export default class WeatherController {
  public async get({ request, response }: HttpContext) {
    let lat: string | undefined
    let lon: string | undefined

    // Debug: log incoming query params
    console.log('Incoming weather request query:', request.qs())
    try {
      // ✅ Validate query params
      const { lat: inputLat, lon: inputLon } = await vine.validate({
        schema: weatherQuerySchema,
        data: request.qs(), // Use query string
      })

      lat = inputLat
      lon = inputLon
    } catch (validationError) {
      console.error('WeatherController: Invalid query params', validationError)
      return response.status(422).send({
        error: 'Invalid query parameters',
        messages: validationError.messages,
      })
    }

    // 🌐 IP fallback (using ip-api.com)
    if (!lat || !lon) {
      try {
        const ipInfo = await axios.get('http://ip-api.com/json')
        console.log('IP lookup response:', ipInfo.data)
        lat = ipInfo.data.lat?.toString()
        lon = ipInfo.data.lon?.toString()

        if (!lat || !lon) {
          return response.status(400).send({
            error: 'Could not determine location from IP',
            ipData: ipInfo.data,
          })
        }
      } catch (ipErr) {
        console.error('IP lookup failed:', ipErr)
        return response.status(400).send({
          error: 'Location not found and no lat/lon provided.',
          ipError: ipErr.message || ipErr,
        })
      }
    }

    const cacheKey = `${lat}:${lon}`
    const cached = weatherCache.get(cacheKey)

    // ✅ Return from cache if available
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return response.send({ ...cached.data, cached: true })
    }

    try {
      const apiKey = env.get('WEATHER_API_KEY')
      const weatherRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      )

      const weatherData = weatherRes.data
      weatherCache.set(cacheKey, { data: weatherData, timestamp: Date.now() })

      return response.send(weatherData)
    } catch (err: any) {
      console.error('Weather API error:', err.message)
      return response.status(500).send({ error: 'Failed to fetch weather data' })
    }
  }
}
