import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-6">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('footer.built_for')} | {t('footer.sih_ps')}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          &copy; {new Date().getFullYear()} KrishiRakshak. {t('footer.all_rights')}
        </p>
      </div>
    </footer>
  );
}
