import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { TreePine, Mail, Lock, User, MapPin, Shield, Eye, EyeOff, Loader2, Globe } from 'lucide-react';

const T = {
  ar: {
    signIn: 'تسجيل الدخول', signUp: 'إنشاء حساب', email: 'البريد الإلكتروني',
    password: 'كلمة المرور', name: 'الاسم الكامل', region: 'المنطقة',
    regionOptional: 'المنطقة (اختياري)', confirmPass: 'تأكيد كلمة المرور',
    role: 'الدور', volunteer: 'متطوع', ranger: 'حارس غابة',
    loginBtn: 'دخول', registerBtn: 'إنشاء الحساب',
    noAccount: 'ليس لديك حساب؟', hasAccount: 'لديك حساب؟',
    subtitle: 'حارس الغابة — نظام الإنذار المبكر',
    loggingIn: 'جارٍ التحقق...', registering: 'جارٍ الإنشاء...',
    fillAll: 'يرجى ملء جميع الحقول المطلوبة',
    noMatch: 'كلمتا المرور غير متطابقتين',
  },
  en: {
    signIn: 'Sign In', signUp: 'Create Account', email: 'Email',
    password: 'Password', name: 'Full Name', region: 'Region',
    regionOptional: 'Region (optional)', confirmPass: 'Confirm Password',
    role: 'Role', volunteer: 'Volunteer', ranger: 'Forest Ranger',
    loginBtn: 'Sign In', registerBtn: 'Create Account',
    noAccount: "Don't have an account?", hasAccount: 'Already have an account?',
    subtitle: 'Forest Guardian — Early Warning System',
    loggingIn: 'Signing in...', registering: 'Creating account...',
    fillAll: 'Please fill all required fields',
    noMatch: 'Passwords do not match',
  },
  fr: {
    signIn: 'Connexion', signUp: 'Créer un compte', email: 'Email',
    password: 'Mot de passe', name: 'Nom complet', region: 'Région',
    regionOptional: 'Région (optionnel)', confirmPass: 'Confirmer le mot de passe',
    role: 'Rôle', volunteer: 'Bénévole', ranger: 'Garde forestier',
    loginBtn: 'Connexion', registerBtn: 'Créer le compte',
    noAccount: "Pas de compte ?", hasAccount: 'Déjà un compte ?',
    subtitle: 'Gardien des Forêts — Système d\'alerte précoce',
    loggingIn: 'Connexion...', registering: 'Création...',
    fillAll: 'Veuillez remplir tous les champs requis',
    noMatch: 'Les mots de passe ne correspondent pas',
  },
};

export default function AuthPage() {
  const { i18n } = useTranslation();
  const { isAuthenticated, loading, login, register } = useAuth();
  const navigate = useNavigate();
  const lang = i18n.language?.startsWith('ar') ? 'ar' : i18n.language?.startsWith('fr') ? 'fr' : 'en';
  const t = T[lang] || T.en;
  const isRTL = lang === 'ar';

  const [tab, setTab] = useState('login');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regRegion, setRegRegion] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050A07] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const cycleLang = () => {
    const langs = ['ar', 'en', 'fr'];
    const idx = langs.indexOf(lang);
    i18n.changeLanguage(langs[(idx + 1) % langs.length]);
  };

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    if (!loginEmail || !loginPass) { setError(t.fillAll); return; }
    setSubmitting(true);
    try {
      await login({ email: loginEmail, password: loginPass });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    if (!regName || !regEmail || !regPass) { setError(t.fillAll); return; }
    if (regPass !== regConfirm) { setError(t.noMatch); return; }
    setSubmitting(true);
    try {
      await register({ name: regName, email: regEmail, password: regPass, region: regRegion || undefined });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = 'w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white/90 text-sm placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all';
  const labelClass = 'block text-white/30 text-[10px] uppercase tracking-[0.15em] font-mono mb-1.5';

  return (
    <div className="min-h-screen bg-[#050A07] flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Grid overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(16,185,129,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.015)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
      {/* Subtle glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

      {/* Language toggle */}
      <button
        onClick={cycleLang}
        className="fixed top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-white/40 hover:text-white/60 text-xs font-mono uppercase tracking-wider transition-colors"
      >
        <Globe size={12} /> {lang.toUpperCase()}
      </button>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <TreePine className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-xl font-semibold text-white tracking-wide">ForestGuard</h1>
          <p className="text-white/25 text-xs mt-1 font-mono tracking-wider">{t.subtitle}</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-7 backdrop-blur-sm shadow-2xl">
          {/* Tab switcher */}
          <div className="flex bg-white/[0.03] rounded-xl p-1 mb-6">
            {['login', 'register'].map((key) => (
              <button
                key={key}
                onClick={() => { setTab(key); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-medium tracking-wide transition-all ${
                  tab === key
                    ? 'bg-emerald-500/15 text-emerald-400 shadow-sm'
                    : 'text-white/30 hover:text-white/50'
                }`}
              >
                {key === 'login' ? t.signIn : t.signUp}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-xs animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          {/* Login Form */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={labelClass}>{t.email}</label>
                <div className="relative">
                  <Mail className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-white/15 rtl:left-auto rtl:right-3" />
                  <input
                    type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                    className={`${inputClass} ${isRTL ? 'pr-10' : 'pl-10'}`}
                    placeholder="you@example.com" autoComplete="email"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t.password}</label>
                <div className="relative">
                  <Lock className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-white/15 rtl:left-auto rtl:right-3" />
                  <input
                    type={showPass ? 'text' : 'password'} value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className={`${inputClass} ${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'}`}
                    placeholder="••••••••" autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'} text-white/20 hover:text-white/40 transition-colors`}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 mt-2">
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? t.loggingIn : t.loginBtn}
              </button>
              <p className="text-center text-white/25 text-xs pt-1">
                {t.noAccount}{' '}
                <button type="button" onClick={() => { setTab('register'); setError(''); }}
                  className="text-emerald-400/70 hover:text-emerald-400 transition-colors">{t.signUp}</button>
              </p>
            </form>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className={labelClass}>{t.name}</label>
                <div className="relative">
                  <User className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-white/15 rtl:left-auto rtl:right-3" />
                  <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)}
                    className={`${inputClass} ${isRTL ? 'pr-10' : 'pl-10'}`}
                    placeholder={lang === 'ar' ? 'علي الغابي' : 'Ali Forest'} autoComplete="name"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t.email}</label>
                <div className="relative">
                  <Mail className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-white/15 rtl:left-auto rtl:right-3" />
                  <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                    className={`${inputClass} ${isRTL ? 'pr-10' : 'pl-10'}`}
                    placeholder="you@example.com" autoComplete="email"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{t.password}</label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-white/15 rtl:left-auto rtl:right-3" />
                    <input type={showPass ? 'text' : 'password'} value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                      className={`${inputClass} ${isRTL ? 'pr-10' : 'pl-10'}`}
                      placeholder="••••••" autoComplete="new-password"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t.confirmPass}</label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-white/15 rtl:left-auto rtl:right-3" />
                    <input type={showPass ? 'text' : 'password'} value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      className={`${inputClass} ${isRTL ? 'pr-10' : 'pl-10'}`}
                      placeholder="••••••" autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className={labelClass}>{t.regionOptional}</label>
                <div className="relative">
                  <MapPin className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-white/15 rtl:left-auto rtl:right-3" />
                  <input type="text" value={regRegion} onChange={(e) => setRegRegion(e.target.value)}
                    className={`${inputClass} ${isRTL ? 'pr-10' : 'pl-10'}`}
                    placeholder={lang === 'ar' ? 'لبنان' : 'Lebanon'}
                  />
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 mt-2">
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? t.registering : t.registerBtn}
              </button>
              <p className="text-center text-white/25 text-xs pt-1">
                {t.hasAccount}{' '}
                <button type="button" onClick={() => { setTab('login'); setError(''); }}
                  className="text-emerald-400/70 hover:text-emerald-400 transition-colors">{t.signIn}</button>
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-white/10 text-[10px] font-mono mt-6 tracking-wider">
          ForestGuard AI © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
