import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Sun, CloudRain, Cloud, MapPin } from 'lucide-react';
import { Toast } from './Toast.js';

interface WeatherData {
  name: string;
  main: {
    temp: number;
    humidity: number;
  };
  weather: { main: string; description: string; icon: string }[];
}

const Weather: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let didCancel = false;
    const fetchWeather = async (lat?: number, lon?: number) => {
      try {
        const cacheKey = lat && lon ? `weather_${lat}_${lon}` : 'weather_ip';
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 1000 * 60 * 60) {
            setWeather(data);
            setLoading(false);
            return;
          }
        }
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

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setToast('Requesting your location for weather updates...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setToast('Location access granted! Showing local weather.');
          setTimeout(() => setToast(null), 2000);
          const { latitude, longitude } = pos.coords;
          fetchWeather(latitude, longitude);
        },
        () => {
          setToast('Location denied. Using IP-based location.');
          setTimeout(() => setToast(null), 2000);
          fetchWeather();
        },
        { timeout: 10000 }
      );
    } else {
      fetchWeather();
    }
    return () => {
      didCancel = true;
    };
  }, []);

  const getWeatherIcon = () => {
    if (!weather) return <Cloud className="text-gray-400" size={40} />;
    // OpenWeatherMap returns 'main' as a property of each weather object
    const main = weather.weather[0]?.main?.toLowerCase() || '';
    if (main.includes('rain')) return <CloudRain className="text-blue-400" size={40} />;
    if (main.includes('clear')) return <Sun className="text-yellow-400" size={40} />;
    return <Cloud className="text-gray-400" size={40} />;
  };

  return (
    <>
      {toast && (
        <div className="fixed top-6 right-6 z-50">
          <Toast
            id="weather-toast"
            type="info"
            title={toast}
            onClose={() => setToast(null)}
          />
        </div>
      )}
      <motion.div
        className="bg-[#23232b] border border-orange-500/30 shadow-lg rounded-2xl p-6 w-full max-w-sm mx-auto flex flex-col items-center backdrop-blur-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-2">
          {getWeatherIcon()}
          <h3 className="text-xl font-bold text-white flex items-center gap-1">
            <MapPin className="w-5 h-5 text-orange-400" />
            {weather?.name || 'Your City'}
          </h3>
        </div>
        {loading ? (
          <div className="text-gray-400">Loading weather...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : weather ? (
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-5xl font-bold text-white mb-1 drop-shadow">
              {Math.round(weather.main.temp)}°C
            </div>
            <div className="capitalize text-gray-300 mb-1 text-lg">
              {weather.weather[0].description}
            </div>
            <div className="text-gray-400 text-sm">Humidity: {weather.main.humidity}%</div>
          </motion.div>
        ) : null}
      </motion.div>
    </>
  );
};

export default Weather;
