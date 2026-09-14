import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'te', label: 'తెలుగు' },
];

const THEMES = [
  { value: 'light', Icon: Sun },
  { value: 'dark', Icon: Moon },
  { value: 'system', Icon: Monitor },
];

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, isGuest, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: '/dashboard', label: t('nav.dashboard'), show: true },
    { to: '/upload', label: t('nav.upload'), show: true },
    { to: '/history', label: t('nav.history'), show: !!user },
    { to: '/community', label: t('nav.community'), show: true },
    { to: '/map', label: t('nav.map'), show: true },
  ];

  return (
    <nav className="bg-surface dark:bg-[#1A1A16] border-b border-primary-100 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src="/assets/krishirakshak-logo.png" alt="KrishiRakshak" className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-headline font-bold text-lg text-ink dark:text-white hidden sm:block">
              {t('app_name')}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.filter(l => l.show).map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300'
                    : 'text-ink-muted dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={i18n.language}
              onChange={handleLanguageChange}
              className="text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-gray-700 dark:text-gray-300 outline-none"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>

            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              {THEMES.map(t_option => (
                <button
                  key={t_option.value}
                  onClick={() => setTheme(t_option.value)}
                  className={`w-7 h-7 rounded-md text-sm flex items-center justify-center transition-colors ${
                    theme === t_option.value
                      ? 'bg-white dark:bg-gray-600 shadow-sm'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  title={t_option.value}
                >
                  <t_option.Icon size={14} className="text-ink-muted dark:text-gray-300" />
                </button>
              ))}
            </div>

            {isGuest && (
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                {t('nav.guest')}
              </span>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:block text-sm text-ink-muted dark:text-gray-400">
                  {user.name}
                </span>
                <button onClick={handleLogout} className="btn-secondary text-sm py-1.5 px-3">
                  {t('nav.logout')}
                </button>
              </div>
            ) : !isGuest ? (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm py-1.5 px-3">
                  {t('nav.login')}
                </Link>
                <Link to="/signup" className="btn-primary text-sm py-1.5 px-3 hidden sm:inline-flex">
                  {t('nav.signup')}
                </Link>
              </div>
            ) : null}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-ink-muted dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
            {navLinks.filter(l => l.show).map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(link.to)
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300'
                    : 'text-ink-muted dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
