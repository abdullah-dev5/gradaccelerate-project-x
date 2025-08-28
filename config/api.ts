import env from '#start/env'

export default {
  weatherApiKey: env.get('WEATHER_API_KEY'),
  giphyApiKey: env.get('GIPHY_API_KEY'),
}
