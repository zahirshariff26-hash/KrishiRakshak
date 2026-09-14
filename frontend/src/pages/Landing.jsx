import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Microscope, Stethoscope, Users } from 'lucide-react';
import Footer from '../components/Footer';

export default function Landing() {
  const { t } = useTranslation();
  const { continueAsGuest } = useAuth();
  const navigate = useNavigate();

  const handleGuest = () => {
    continueAsGuest();
    navigate('/dashboard');
  };

  const features = [
    { title: t('landing.feature1_title'), desc: t('landing.feature1_desc'), icon: Microscope, highlight: true },
    { title: t('landing.feature2_title'), desc: t('landing.feature2_desc'), icon: Stethoscope, highlight: false },
    { title: t('landing.feature3_title'), desc: t('landing.feature3_desc'), icon: Users, highlight: false },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl">
            <img src="/assets/krishirakshak-logo.png" alt="KrishiRakshak" className="h-16 w-16 rounded-xl object-contain mb-6" />
            <h1 className="font-headline text-4xl md:text-6xl mb-6 leading-tight">
              {t('landing.hero_title')}
            </h1>
            <p className="text-lg md:text-xl text-primary-100 mb-8">
              {t('landing.hero_subtitle')}
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <Link
                to="/signup"
                className="bg-accent hover:bg-accent-500 text-white font-semibold py-3 px-8 rounded-lg transition-colors text-lg"
              >
                {t('landing.get_started')}
              </Link>
              <button
                onClick={handleGuest}
                className="text-white/80 hover:text-white font-medium text-base transition-colors underline underline-offset-4 decoration-white/30 hover:decoration-white/60"
              >
                {t('landing.continue_guest')}
              </button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surface dark:from-[#1A1A16] to-transparent pointer-events-none" />
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className={`text-center transition-shadow hover:shadow-lg rounded-xl p-8 ${
                  feature.highlight
                    ? 'bg-primary-600 text-white border-2 border-primary-500 p-10 md:p-12'
                    : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
                }`}
              >
                <div className={`mb-5 ${feature.highlight ? 'text-accent' : 'text-primary-600 dark:text-primary-400'}`}>
                  <Icon className="w-12 h-12 mx-auto" />
                </div>
                <h3 className={`text-xl font-headline mb-3 ${feature.highlight ? 'text-white' : 'text-ink dark:text-white'}`}>
                  {feature.title}
                </h3>
                <p className={feature.highlight ? 'text-primary-100' : 'text-ink-muted dark:text-gray-400'}>
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
}
