import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import Footer from '../components/Footer';

export default function History() {
  const { t } = useTranslation();
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/diagnoses');
      setDiagnoses(res.data.diagnoses);
    } catch (err) {
      setError(err.response?.data?.error || t('history.failed_to_load'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('history.delete_confirm'))) return;
    try {
      await api.delete(`/diagnoses/${id}`);
      setDiagnoses(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8 w-full flex-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('history.title')}</h1>

        {loading && (
          <div className="card text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {!loading && diagnoses.length === 0 && (
          <div className="card text-center py-12 text-gray-400 dark:text-gray-500">
            <p className="text-lg">{t('history.empty')}</p>
          </div>
        )}

        <div className="space-y-3">
          {diagnoses.map(d => (
            <div key={d.id} className="card flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-900 dark:text-white">
                    {d.disease_name.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>{t('history.date')}: {formatDate(d.created_at)}</span>
                  <span>{t('history.confidence')}: {(d.confidence * 100).toFixed(1)}%</span>
                </div>
                {d.treatment_advice && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                    {d.treatment_advice}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(d.id)}
                className="text-red-500 hover:text-red-700 text-sm font-medium self-start"
              >
                {t('common.delete')}
              </button>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
