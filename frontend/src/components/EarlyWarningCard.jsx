import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ChevronRight, Cloud } from 'lucide-react';
import api from '../services/api';

const RISK_BADGE = {
  low: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  moderate: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  high: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
};

const RISK_BORDER = {
  low: 'border-green-200 dark:border-green-800',
  moderate: 'border-amber-200 dark:border-amber-800',
  high: 'border-red-200 dark:border-red-800',
};

export default function EarlyWarningCard() {
  const { t } = useTranslation();
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const getCrop = () => {
      try { return localStorage.getItem('krishirakshak-ew-crop') || 'tomato'; } catch { return 'tomato'; }
    };
    const getLatLon = () => {
      try {
        const lat = parseFloat(localStorage.getItem('krishirakshak-ew-lat'));
        const lon = parseFloat(localStorage.getItem('krishirakshak-ew-lon'));
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) return { lat, lon };
      } catch {}
      return null;
    };

    const loc = getLatLon();
    if (!loc) { setLoading(false); return; }

    api.get('/weather/risk', { params: { crop: getCrop(), lat: loc.lat, lon: loc.lon } })
      .then(res => { if (!cancelled) setPreview(res.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  return (
    <Link to="/early-warning" className={`card hover:shadow-lg transition-shadow cursor-pointer group border ${preview ? RISK_BORDER[preview.risk.level] || '' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-amber-500"><AlertTriangle size={20} /></div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
              {t('early_warning.title')}
            </h3>
          </div>

          {loading && (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          )}

          {!loading && preview && (
            <>
              <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                {preview.crop.name}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${RISK_BADGE[preview.risk.level] || ''}`}>
                  {t(`early_warning.risk_${preview.risk.level}`)}
                </span>
              </p>
              {preview.risk.factors[0] && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                  <Cloud size={12} />
                  {preview.risk.factors[0]}
                </p>
              )}
            </>
          )}

          {!loading && !preview && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('early_warning.card_empty')}
            </p>
          )}
        </div>
        <ChevronRight size={20} className="text-gray-300 dark:text-gray-600 group-hover:text-primary-500 mt-1 flex-shrink-0" />
      </div>
    </Link>
  );
}
