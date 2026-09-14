const express = require('express');
const { CROP_LIST, getCrop } = require('../config/crops');
const { fetchWeather } = require('../services/weatherService');
const { assessRisk } = require('../services/riskEngine');

const router = express.Router();

router.get('/crops', (req, res) => {
  res.json({ crops: CROP_LIST });
});

router.get('/weather', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ error: 'Valid latitude and longitude are required.' });
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Coordinates out of range.' });
    }

    const weather = await fetchWeather(lat, lon);
    res.json(weather);
  } catch (err) {
    console.error('[WEATHER] Error:', err.message);
    res.status(502).json({ error: 'Failed to fetch weather data. Please try again later.' });
  }
});

router.get('/risk', async (req, res) => {
  try {
    const cropId = (req.query.crop || '').toLowerCase().trim();
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);

    if (!cropId) {
      return res.status(400).json({ error: 'Crop is required.' });
    }
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ error: 'Valid latitude and longitude are required.' });
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Coordinates out of range.' });
    }

    const crop = getCrop(cropId);
    if (!crop) {
      return res.status(400).json({ error: `Unsupported crop: ${cropId}. Use GET /api/weather/crops for supported crops.` });
    }

    const weather = await fetchWeather(lat, lon);

    const weatherForRisk = {
      temperature: weather.current.temperature,
      humidity: weather.current.humidity,
      precipitation: weather.current.precipitation,
      windSpeed: weather.current.windSpeed,
      precipitationTomorrow: weather.forecast[1]?.precipitationMm || 0,
    };

    const risk = assessRisk(crop, weatherForRisk);

    res.json({
      crop: { id: cropId, name: crop.name },
      location: weather.location,
      weather: {
        current: weather.current,
        forecast: weather.forecast,
      },
      risk: {
        level: risk.risk,
        score: risk.score,
        factors: risk.factors,
        actions: risk.actions,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[RISK] Error:', err.message);
    res.status(502).json({ error: 'Failed to calculate risk. Please try again later.' });
  }
});

module.exports = router;
