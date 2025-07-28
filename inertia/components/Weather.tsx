import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface WeatherData {
  name: string;
  main: {
    temp: number;
    humidity: number;
  };
  weather: { description: string; icon: string }[];
}

const Weather: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    let didCancel = false;
    const fetchWeather = async (lat?: number, lon?: number) => {
      try {
        // Cache key based on lat/lon
        const cacheKey = lat && lon ? `weather_${lat}_${lon}` : 'weather_ip';
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          // 1 hour cache
          if (Date.now() - timestamp < 1000 * 60 * 60) {
            setWeather(data);
            setLoading(false);
            return;
          }
        }

        // Send lat/lon to backend if available
        let url = '/weather';
        if (lat && lon) {
          url += `?lat=${lat}&lon=${lon}`;
        }
        const res = await axios.get(url);
        if (!didCancel) {
          setWeather(res.data);
          setLoading(false);
          sessionStorage.setItem(cacheKey, JSON.stringify({ data: res.data, timestamp: Date.now() }));
        }
      } catch (err: any) {
        if (!didCancel) {
          setError('Could not fetch weather');
          setLoading(false);
        }
      }
    };

    // Try browser geolocation first
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetchWeather(latitude, longitude);
        },
        (err) => {
          // If denied or error, fallback to IP-based
          fetchWeather();
        },
        { timeout: 10000 }
      );
    } else {
      // No geolocation support, fallback
      fetchWeather();
    }
    return () => {
      didCancel = true;
    };
  }, []);

  if (loading) return <div>Loading weather...</div>;
  if (error) return <div>{error}</div>;
  if (!weather) return null;

  return (
    <div className="weather-widget">
      <h3>Weather in {weather.name}</h3>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`} alt="weather icon" />
        <div>
          <div>{weather.weather[0].description}</div>
          <div>Temp: {weather.main.temp}°C</div>
          <div>Humidity: {weather.main.humidity}%</div>
        </div>
      </div>
    </div>
  );
};

export default Weather;
