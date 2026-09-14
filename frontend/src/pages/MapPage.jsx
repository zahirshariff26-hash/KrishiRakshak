import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import api from '../services/api';
import Footer from '../components/Footer';

const diseaseIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:24px;height:24px;background:#dc2626;border:2px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const healthyIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:24px;height:24px;background:#22c55e;border:2px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function getIcon(diseaseName) {
  if (!diseaseName) return diseaseIcon;
  const lower = diseaseName.toLowerCase();
  if (lower.includes('healthy')) return healthyIcon;
  return diseaseIcon;
}

export default function MapPage() {
  const { t } = useTranslation();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports');
      setReports(res.data.reports);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const center = [19.7515, 75.7139];

  return (
    <div className="flex flex-col min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8 w-full flex-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('map.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{t('map.subtitle')}</p>

        {loading ? (
          <div className="card text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="card text-center py-12 text-gray-400 dark:text-gray-500">
            <div className="mb-3 text-gray-400 dark:text-gray-500"><MapPin size={48} /></div>
            <p>{t('common.no_data')}</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 h-[350px] sm:h-[500px]">
            <MapContainer
              center={center}
              zoom={7}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {reports.map(r => (
                <Marker
                  key={`${r.source}-${r.id}`}
                  position={[r.latitude, r.longitude]}
                  icon={getIcon(r.disease_name)}
                >
                  <Popup>
                    <div className="text-sm min-w-[180px]">
                      <p className="font-bold mb-1">{r.disease_name?.replace(/_/g, ' ') || t('map.unknown')}</p>
                      {r.confidence && <p>{t('map.confidence')} {(r.confidence * 100).toFixed(1)}%</p>}
                      {r.user?.name && <p>{t('map.reported_by')} {r.user.name}</p>}
                      <p className="text-gray-500">{formatDate(r.created_at)}</p>
                      {r.caption && <p className="mt-1 italic">{r.caption}</p>}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}

        {!loading && reports.length > 0 && (
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-red-600 rounded-full inline-block" /> {t('map.disease_reported')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-green-500 rounded-full inline-block" /> {t('map.healthy')}
            </span>
            <span>{t('map.reports_shown', { count: reports.length })}</span>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
