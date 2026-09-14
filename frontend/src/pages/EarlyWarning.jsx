import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Cloud, Droplets, Thermometer, Wind, MapPin, RefreshCw, ChevronRight, Sprout } from 'lucide-react';
import api from '../services/api';
import Footer from '../components/Footer';

const RISK_STYLES = {
  low: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-300', badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' },
  moderate: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
  high: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-300', badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' },
};

export default function EarlyWarning() {
  const { t } = useTranslation();
  const [crops, setCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cropsLoading, setCropsLoading] = useState(true);

  useEffect(() => {
    api.get('/weather/crops')
      .then(res => {
        setCrops(res.data.crops);
        if (res.data.crops.length > 0) setSelectedCrop(res.data.crops[0].id);
      })
      .catch(() => setError(t('early_warning.load_failed')))
      .finally(() => setCropsLoading(false));
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(t('early_warning.geo_not_supported'));
      return;
    }
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setManualLat(pos.coords.latitude.toFixed(4));
        setManualLon(pos.coords.longitude.toFixed(4));
      },
      () => {
        setLocationError(t('early_warning.geo_denied'));
      },
      { timeout: 10000 }
    );
  }, []);

  useEffect(() => { requestLocation(); }, []);

  const handleManualLocation = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (Number.isNaN(lat) || Number.isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setLocationError(t('early_warning.invalid_coords'));
      return;
    }
    setLocationError('');
    setLocation({ lat, lon });
  };

  const fetchRisk = async () => {
    if (!selectedCrop || !location) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.get('/weather/risk', {
        params: { crop: selectedCrop, lat: location.lat, lon: location.lon },
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || t('early_warning.fetch_failed'));
    } finally {
      setLoading(false);
    }
  };

  const canFetch = selectedCrop && location && !loading;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8 w-full flex-1">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <AlertTriangle className="text-amber-500" size={28} />
            {t('early_warning.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('early_warning.subtitle')}
          </p>
        </div>

        <div className="card mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sprout size={20} className="text-green-600 dark:text-green-400" />
            {t('early_warning.select_crop')}
          </h2>
          {cropsLoading ? (
            <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {crops.map(crop => (
                <button
                  key={crop.id}
                  onClick={() => { setSelectedCrop(crop.id); setResult(null); }}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors border ${
                    selectedCrop === crop.id
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary-400'
                  }`}
                >
                  {crop.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin size={20} className="text-blue-600 dark:text-blue-400" />
            {t('early_warning.location')}
          </h2>
          {location && (
            <p className="text-sm text-green-600 dark:text-green-400 mb-3">
              {t('early_warning.location_found')} {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
            </p>
          )}
          {locationError && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mb-3">{locationError}</p>
          )}
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={manualLat}
                onChange={e => { setManualLat(e.target.value); setResult(null); }}
                placeholder="e.g. 19.7515"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={manualLon}
                onChange={e => { setManualLon(e.target.value); setResult(null); }}
                placeholder="e.g. 75.7139"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <button onClick={handleManualLocation} className="btn-secondary text-sm">
              {t('early_warning.set_location')}
            </button>
            <button onClick={requestLocation} className="btn-secondary text-sm flex items-center gap-1">
              <MapPin size={14} />
              {t('early_warning.auto_detect')}
            </button>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <button
            onClick={fetchRisk}
            disabled={!canFetch}
            className={`btn-primary text-base px-8 py-3 flex items-center gap-2 ${!canFetch ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                {t('early_warning.analyzing')}
              </>
            ) : (
              <>
                <AlertTriangle size={18} />
                {t('early_warning.check_risk')}
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 mb-6">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            <button onClick={fetchRisk} className="text-sm text-red-600 dark:text-red-400 underline mt-2 flex items-center gap-1">
              <RefreshCw size={14} /> {t('common.retry')}
            </button>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <RiskResult result={result} t={t} />
            <ForecastSection result={result} t={t} />
            <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                {t('early_warning.diagnosis_note')}{' '}
                <Link to="/upload" className="underline font-medium">
                  {t('early_warning.upload_photo')}
                </Link>
              </p>
            </div>
          </div>
        )}

        <div className="card mt-6 text-xs text-gray-400 dark:text-gray-500">
          <p>{t('early_warning.disclaimer')}</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function RiskResult({ result, t }) {
  const { risk, crop, weather, timestamp } = result;
  const styles = RISK_STYLES[risk.level] || RISK_STYLES.low;
  const riskLabel = t(`early_warning.risk_${risk.level}`);

  return (
    <div className={`card ${styles.bg} ${styles.border} border`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('early_warning.crop')}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{crop.name}</h3>
        </div>
        <div className="text-right">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${styles.badge}`}>
            {riskLabel}
          </span>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {t('early_warning.score')}: {risk.score}/100
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <WeatherStat icon={<Thermometer size={16} />} label={t('early_warning.temperature')} value={`${weather.current.temperature?.toFixed(1)}°C`} />
        <WeatherStat icon={<Droplets size={16} />} label={t('early_warning.humidity')} value={`${weather.current.humidity?.toFixed(0)}%`} />
        <WeatherStat icon={<Cloud size={16} />} label={t('early_warning.rainfall')} value={`${weather.current.precipitation?.toFixed(1)} mm`} />
        <WeatherStat icon={<Wind size={16} />} label={t('early_warning.wind')} value={`${weather.current.windSpeed?.toFixed(1)} km/h`} />
      </div>

      {risk.factors.length > 0 && (
        <div className="mb-4">
          <h4 className={`text-sm font-bold ${styles.text} mb-2`}>{t('early_warning.why')}</h4>
          <ul className="space-y-1">
            {risk.factors.map((f, i) => (
              <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${styles.text === 'text-red-700 dark:text-red-300' ? 'bg-red-500' : styles.text === 'text-amber-700 dark:text-amber-300' ? 'bg-amber-500' : 'bg-green-500'}`} />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {risk.actions.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('early_warning.recommended_actions')}</h4>
          <ul className="space-y-1">
            {risk.actions.map((a, i) => (
              <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                <ChevronRight size={14} className="mt-0.5 flex-shrink-0 text-primary-500" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
        {t('early_warning.updated')}: {new Date(timestamp).toLocaleString()}
      </p>
    </div>
  );
}

function WeatherStat({ icon, label, value }) {
  return (
    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
      <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-xs mb-1">
        {icon} {label}
      </div>
      <p className="text-sm font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function ForecastSection({ result, t }) {
  if (!result.weather.forecast || result.weather.forecast.length === 0) return null;

  return (
    <div className="card">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('early_warning.forecast')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {result.weather.forecast.map((day, i) => (
          <div key={day.date} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              {i === 0 ? t('early_warning.today') : i === 1 ? t('early_warning.tomorrow') : day.date}
            </p>
            <div className="space-y-1 text-sm">
              <p className="text-gray-900 dark:text-white">
                {day.tempMin?.toFixed(0)}° – {day.tempMax?.toFixed(0)}°C
              </p>
              <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Cloud size={12} /> {day.precipitationMm?.toFixed(1)} mm ({day.precipProbability || 0}%)
              </p>
              <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Droplets size={12} /> {t('early_warning.humidity')}: {day.humidityMax || '—'}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
