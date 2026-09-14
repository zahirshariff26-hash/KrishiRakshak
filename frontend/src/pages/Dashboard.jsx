import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Microscope, ClipboardList, Users } from 'lucide-react';
import api from '../services/api';
import Footer from '../components/Footer';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, isGuest } = useAuth();
  const [allDiagnoses, setAllDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isGuest && user) {
      api.get('/diagnoses')
        .then(res => setAllDiagnoses(res.data.diagnoses))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, isGuest]);

  const recentDiagnoses = allDiagnoses.slice(0, 5);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8 w-full flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isGuest ? t('dashboard.guest_welcome') : `${t('dashboard.welcome')}, ${user?.name || t('dashboard.fallback_name')}`}
          </h1>
          {isGuest && (
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {t('dashboard.guest_prompt')}{' '}
              <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-medium underline">
                {t('nav.signup')}
              </Link>
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link to="/upload" className="card hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="mb-3 text-primary-600 dark:text-primary-400"><Microscope size={32} /></div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
              {t('dashboard.quick_diagnose')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {t('landing.feature1_desc')}
            </p>
          </Link>

          {!isGuest && (
            <Link to="/history" className="card hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="mb-3 text-primary-600 dark:text-primary-400"><ClipboardList size={32} /></div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                {t('nav.history')}
              </h3>
              {!loading && allDiagnoses.length > 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {t('dashboard.history_count', { count: allDiagnoses.length })}
                </p>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {t('dashboard.no_history')}
                </p>
              )}
            </Link>
          )}

          <Link to="/community" className="card hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="mb-3 text-primary-600 dark:text-primary-400"><Users size={32} /></div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
              {t('nav.community')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {t('landing.feature3_desc')}
            </p>
          </Link>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('dashboard.recent_activity')}
            </h2>
            {!isGuest && !loading && allDiagnoses.length > 0 && (
              <Link to="/history" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                {t('common.view_all')}
              </Link>
            )}
          </div>

          {!isGuest && loading && (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-2" />
            </div>
          )}

          {!isGuest && !loading && recentDiagnoses.length === 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <p>{t('dashboard.no_history')}</p>
              <Link to="/upload" className="btn-primary mt-4 inline-block">
                {t('dashboard.start_first')}
              </Link>
            </div>
          )}

          {!isGuest && !loading && recentDiagnoses.length > 0 && (
            <div className="space-y-2">
              {recentDiagnoses.map(d => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {d.disease_name.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                      {formatDate(d.created_at)}
                    </span>
                  </div>
                  <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                    {(d.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {isGuest && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <p>{t('dashboard.no_history')}</p>
              <Link to="/upload" className="btn-primary mt-4 inline-block">
                {t('dashboard.start_first')}
              </Link>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
