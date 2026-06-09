import { useEffect, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Analytics } from './components/Analytics';
import { Dashboard } from './components/Dashboard';
import { Landing } from './components/Landing';
import { LanguageToggle } from './components/LanguageToggle';
import { ReportForm } from './components/ReportForm';
import type { UnitMode } from './types';

type View = 'dashboard' | 'report' | 'analytics' | 'landing';
const SECOND_PAGE_PATH = '/dashboard';

const unitBackgrounds: Record<UnitMode, string> = {
  fayy: '/firre 1.png',
  najji: '/سيول.png',
  shuaa: '/شمس 2.png',
  baydar: '/زيتون.png',
  riyah: '/ريح.png',
  niza: '/صراعات.png',
  najm: '/space-bg.jpg',
  jamal: '/زيتون.png',
};

function isSecondPagePath(pathname: string) {
  try {
    return decodeURIComponent(pathname) === SECOND_PAGE_PATH;
  } catch {
    return pathname === SECOND_PAGE_PATH;
  }
}

function getInitialView(): View {
  return isSecondPagePath(window.location.pathname) ? 'dashboard' : 'landing';
}

function pathForView(view: View) {
  return view === 'landing' ? '/' : SECOND_PAGE_PATH;
}

function App() {
  const { i18n, t } = useTranslation();
  const [view, setView] = useState<View>(getInitialView);
  const [countryCode, setCountryCode] = useState('JO');
  const [unitMode, setUnitMode] = useState<UnitMode>('fayy');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const language = i18n.language.startsWith('en') ? 'en' : 'ar';
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  useEffect(() => {
    const handlePopState = () => {
      setView(getInitialView());
    };
    window.history.replaceState(null, '', pathForView(view));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);


  const navigationItems: Array<{ id: View; label: string }> = [
    { id: 'dashboard', label: t('navDashboard') },
    { id: 'report', label: t('navReport') },
    { id: 'analytics', label: t('navAnalytics') },
  ];

  const navigateToView = (nextView: View) => {
    setView(nextView);
    const nextPath = pathForView(nextView);
    const isCurrentPath = nextView === 'landing'
      ? window.location.pathname === '/'
      : isSecondPagePath(window.location.pathname);
    if (!isCurrentPath) {
      window.history.pushState(null, '', nextPath);
    }
  };

  const handleLandingStart = () => {
    navigateToView('dashboard');
  };

  const isLanding = view === 'landing';
  const backgroundStyle: CSSProperties = {
    backgroundImage: isLanding
      ? "url('/blur.png')"
      : `linear-gradient(to bottom, rgba(2, 6, 23, 0.62), rgba(2, 6, 23, 0.86)), url('${unitBackgrounds[unitMode]}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  };

  return (
    <div className={`min-h-screen bg-bg text-text ${view !== 'landing' ? `app-theme-${unitMode}` : ''} relative overflow-hidden`} style={backgroundStyle}>
      {/* Landing Page */}
      {view === 'landing' && (
        <Landing
          onStart={handleLandingStart}
          onUnitModeChange={setUnitMode}
        />
      )}

      {/* NAVBAR - "The Floating Island" */}
      {view !== 'landing' && (
        <header className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-5xl rounded-full border transition-all duration-500 ${isScrolled ? 'bg-slate-950/75 backdrop-blur-xl border-white/10 py-3 px-6 shadow-2xl' : 'bg-transparent border-transparent py-4 px-4 text-white'}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="text-start cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-3" onClick={() => navigateToView('landing')}>
              <div className="flex items-center gap-2">
                <img
                  src="/ayn-logo.svg"
                  alt=""
                  aria-hidden="true"
                  className="h-10 w-10 rounded-xl bg-white/90 object-contain p-1 shadow-md"
                  decoding="async"
                />
                <div>
                  <p className="text-sm font-black leading-tight text-white tracking-wide">{t('appName')}</p>
                  <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase">{t('appSubtitle')}</p>
                </div>
              </div>
              {view === 'dashboard' && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/20 bg-slate-950/45 text-[10px] font-black text-white shadow-sm">
                  <span>{t(unitMode)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <nav className="hidden md:inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-0.5">
                {navigationItems.map(item => (
                  <button
                    type="button"
                    key={item.id}
                    className={`rounded-full px-5 py-2 text-xs font-black transition-all duration-300 ${view === item.id ? 'bg-white text-slate-950 shadow-lg scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    onClick={() => navigateToView(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
              <div className="flex items-center gap-2">
                <LanguageToggle />
                <button
                  type="button"
                  onClick={() => navigateToView('report')}
                  className="group relative inline-flex h-9 items-center justify-center overflow-hidden rounded-full bg-accent px-4 text-xs font-black text-slate-950 transition hover:scale-[1.04] duration-300 active:scale-[0.98] shadow-lg shadow-accent/15"
                >
                  <span>{i18n.language === 'ar' ? 'إرسال بلاغ' : 'Submit Report'}</span>
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="mx-auto max-w-7xl relative z-10 pt-20">
        {view === 'dashboard' ? (
          <Dashboard
            countryCode={countryCode}
            onCountryChange={setCountryCode}
            unitMode={unitMode}
            onUnitModeChange={setUnitMode}
          />
        ) : null}
        {view === 'report' ? <ReportForm /> : null}
        {view === 'analytics' ? <Analytics countryCode={countryCode} /> : null}
      </main>

    </div>
  );
}

export default App;
