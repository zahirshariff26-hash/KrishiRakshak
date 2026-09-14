import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { UploadCloud } from 'lucide-react';
import api from '../services/api';
import Footer from '../components/Footer';

export default function UploadDiagnosis() {
  const { t, i18n } = useTranslation();
  const { user, isGuest } = useAuth();
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setSaved(false);
      handlePredict(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const handlePredict = async (file) => {
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('lang', i18n.language);
      const res = await api.post('/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
    } catch (err) {
      if (!err.response) {
        setResult({ error: t('upload.network_error') || 'Network error. Please check your connection and try again.' });
      } else {
        setResult({ error: err.response?.data?.error || t('upload.prediction_failed') });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result || result.error) return;
    try {
      await api.post('/diagnoses', {
        disease_name: result.disease_name,
        confidence: result.confidence,
        treatment_advice: result.treatment_advice,
        image_path: result.image_path,
      });
      setSaved(true);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleNew = () => {
    setPreview(null);
    setResult(null);
    setSaved(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8 w-full flex-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('upload.title')}</h1>

        {!preview ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
            }`}
          >
            <input {...getInputProps()} />
            <div className="mb-4 text-primary-600 dark:text-primary-400"><UploadCloud size={48} /></div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              {t('upload.drag_drop')}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              {t('upload.supported_formats')}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="card">
              <img src={preview} alt="Crop" className="w-full max-h-80 object-contain rounded-lg mb-4" />

              {loading && (
                <div className="flex items-center gap-3 text-primary-600 dark:text-primary-400">
                  <div className="animate-spin w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full" />
                  <span className="font-medium">{t('upload.analyzing')}</span>
                </div>
              )}

              {result && !result.error && (
                <div className="space-y-4 mt-4">
                  {result.mode === 'mock' && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-lg text-sm">
                      {t('upload.mock_warning')}
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('upload.disease')}</h3>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {result.disease_name.replace(/_/g, ' ')}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('upload.confidence')}</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-primary-600 h-3 rounded-full transition-all"
                          style={{ width: `${result.confidence * 100}%` }}
                        />
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    {result.confidence < 0.5 && (
                      <p className="text-amber-600 dark:text-amber-400 text-sm mt-1">
                        {t('upload.low_confidence')}
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('upload.advisory')}</h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{result.treatment_advice}</p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    {!isGuest && !saved && (
                      <button onClick={handleSave} className="btn-primary">
                        {t('upload.save_result')}
                      </button>
                    )}
                    {saved && (
                      <span className="text-primary-600 font-medium">{t('upload.saved')}</span>
                    )}
                    <button onClick={handleNew} className="btn-secondary">
                      {t('upload.new_diagnosis')}
                    </button>
                  </div>
                </div>
              )}

              {result?.error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mt-4">
                  {result.error}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
