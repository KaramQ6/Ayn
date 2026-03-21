import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from './ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function lazyRetry(importFn) {
  return lazy(() =>
    importFn().catch(() => {
      window.location.reload();
      return new Promise(() => {});
    })
  );
}

const Landing = lazyRetry(() => import('./Landing'));
const Dashboard = lazyRetry(() => import('./Dashboard'));
const Community = lazyRetry(() => import('./Community'));
const PostDetail = lazyRetry(() => import('./PostDetail'));
const AuthPage = lazyRetry(() => import('./pages/AuthPage'));
const ProfilePage = lazyRetry(() => import('./pages/ProfilePage'));

function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="bg-[#050A07] min-h-screen flex flex-col items-center justify-center text-white/80 font-sans selection:bg-[var(--alert-signal)] selection:text-white">
      <div className="text-center space-y-4">
        <div className="text-6xl font-bold tracking-tighter text-[var(--alert-signal)]">{t('app.notFound.code')}</div>
        <h1 className="text-xl font-bold uppercase tracking-widest">{t('app.notFound.title')}</h1>
        <p className="text-sm text-white/40 max-w-md">{t('app.notFound.description')}</p>
        <div className="flex gap-3 justify-center pt-4">
          <Link to="/" aria-label={t('app.notFound.returnBase')} className="px-5 py-2 rounded-full border border-white/10 text-xs font-data uppercase tracking-widest text-white/60 hover:text-white hover:border-white/20 bg-white/5 transition-all focus-ring hover-lift click-scale">
            {t('app.notFound.returnBase')}
          </Link>
          <Link to="/dashboard" aria-label={t('app.notFound.commandCenter')} className="px-5 py-2 rounded-full border border-green-500/30 text-xs font-data uppercase tracking-widest text-green-400 hover:text-green-300 hover:border-green-500/50 bg-green-500/10 transition-all focus-ring hover-lift click-scale">
            {t('app.notFound.commandCenter')}
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  const { t } = useTranslation();
  return (
    <div className="bg-[#050A07] min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-white/40 font-mono uppercase tracking-widest">{t('app.loading')}</p>
      </div>
    </div>
  );
}

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <AuthProvider>
      <Router>
        <ErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={
                <ProtectedRoute><ProfilePage /></ProtectedRoute>
              } />
              <Route path="/community" element={<Community />} />
              <Route path="/community/:postId" element={<PostDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}

export default App;
