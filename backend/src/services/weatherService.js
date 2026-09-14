const cache = new Map();
const CACHE_TTL = 15 * 60 * 1000;

function cacheKey(lat, lon) {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

function getCache(lat, lon) {
  const key = cacheKey(lat, lon);
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  if (entry) cache.delete(key);
  return null;
}

function setCache(lat, lon, data) {
  const key = cacheKey(lat, lon);
  if (cache.size > 500) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, { data, ts: Date.now() });
}

async function fetchWeather(lat, lon) {
  const cached = getCache(lat, lon);
  if (cached) return cached;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,relative_humidity_2m_max&timezone=auto&forecast_days=3`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.current || !data.daily) {
    throw new Error('Invalid weather API response');
  }

  const todayPrecip = data.daily.precipitation_sum?.[0] || 0;
  const tomorrowPrecip = data.daily.precipitation_sum?.[1] || 0;

  const result = {
    location: { latitude: lat, longitude: lon },
    current: {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      precipitation: data.current.precipitation,
      windSpeed: data.current.wind_speed_10m,
    },
    forecast: (data.daily.time || []).slice(0, 3).map((date, i) => ({
      date,
      tempMax: data.daily.temperature_2m_max?.[i],
      tempMin: data.daily.temperature_2m_min?.[i],
      precipitationMm: data.daily.precipitation_sum?.[i] || 0,
      precipProbability: data.daily.precipitation_probability_max?.[i] || 0,
      windSpeedMax: data.daily.wind_speed_10m_max?.[i] || 0,
      humidityMax: data.daily.relative_humidity_2m_max?.[i] || 0,
    })),
    todayPrecipitationMm: todayPrecip,
    tomorrowPrecipitationMm: tomorrowPrecip,
  };

  setCache(lat, lon, result);
  return result;
}

module.exports = { fetchWeather };
