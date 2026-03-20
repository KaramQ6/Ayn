import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, User, Mail, MapPin, Shield, LogOut, Save, X, Loader2, FileText } from 'lucide-react';

const T = {
  ar: {
    profile: 'الملف الشخصي', info: 'المعلومات', back: 'العودة',
    name: 'الاسم', email: 'البريد الإلكتروني', region: 'المنطقة',
    role: 'الدور', volunteer: 'متطوع', ranger: 'حارس غابة', admin: 'مشرف',
    edit: 'تعديل', save: 'حفظ', cancel: 'إلغاء', saving: 'جارٍ الحفظ...',
    logout: 'تسجيل الخروج', updated: '✓ تم تحديث الملف الشخصي',
    reports: 'التقارير', member: 'عضو منذ',
  },
  en: {
    profile: 'Profile', info: 'Information', back: 'Back',
    name: 'Name', email: 'Email', region: 'Region',
    role: 'Role', volunteer: 'Volunteer', ranger: 'Forest Ranger', admin: 'Admin',
    edit: 'Edit', save: 'Save', cancel: 'Cancel', saving: 'Saving...',
    logout: 'Sign Out', updated: '✓ Profile updated',
    reports: 'Reports', member: 'Member since',
  },
  fr: {
    profile: 'Profil', info: 'Informations', back: 'Retour',
    name: 'Nom', email: 'Email', region: 'Région',
    role: 'Rôle', volunteer: 'Bénévole', ranger: 'Garde forestier', admin: 'Admin',
    edit: 'Modifier', save: 'Sauvegarder', cancel: 'Annuler', saving: 'Sauvegarde...',
    logout: 'Déconnexion', updated: '✓ Profil mis à jour',
    reports: 'Rapports', member: 'Membre depuis',
  },
};

export default function ProfilePage() {
  const { i18n } = useTranslation();
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const lang = i18n.language?.startsWith('ar') ? 'ar' : i18n.language?.startsWith('fr') ? 'fr' : 'en';
  const t = T[lang] || T.en;
  const isRTL = lang === 'ar';

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', region: user?.region || '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const roleLabel = t[user.role] || t.volunteer;

  async function handleSave() {
    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      await updateProfile({ name: form.name, region: form.region || 'MENA Region' });
      setMsg({ type: 'success', text: t.updated });
      setEditing(false);
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/auth');
  }

  const inputClass = 'w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white/90 text-sm focus:border-emerald-500/50 focus:outline-none transition-all';

  return (
    <div className="min-h-screen bg-[#050A07] text-white" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Grid overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(16,185,129,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.015)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      <div className="relative max-w-lg mx-auto px-4 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-white/40 hover:text-white/70 text-xs font-mono uppercase tracking-wider transition-colors">
            <ArrowLeft size={14} /> {t.back}
          </Link>
          <h1 className="text-sm font-semibold text-white/60 tracking-wide">{t.profile}</h1>
          <div className="w-16" />
        </div>

        {/* Avatar Card */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-4 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4 shadow-lg shadow-emerald-500/20">
            {user.name?.[0]?.toUpperCase() || '?'}
          </div>
          <h2 className="text-white font-semibold text-lg">{user.name}</h2>
          <p className="text-white/30 text-xs mt-0.5 font-mono">{user.email}</p>
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] px-3 py-1 rounded-full font-mono uppercase tracking-wider">
              <Shield size={10} /> {roleLabel}
            </span>
            {user.reportsCount > 0 && (
              <span className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] px-3 py-1 rounded-full font-mono uppercase tracking-wider">
                <FileText size={10} /> {user.reportsCount} {t.reports}
              </span>
            )}
          </div>
          {user.createdAt && (
            <p className="text-white/15 text-[10px] mt-3 font-mono">
              {t.member} {new Date(user.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : lang === 'fr' ? 'fr-FR' : 'en-US')}
            </p>
          )}
        </div>

        {/* Message */}
        {msg.text && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-xs ${msg.type === 'success'
            ? 'bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/[0.08] border border-red-500/20 text-red-400'}`}>
            {msg.text}
          </div>
        )}

        {/* Info */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-4 mb-4">
          <div>
            <label className="text-white/25 text-[10px] uppercase tracking-[0.15em] font-mono block mb-1.5">{t.name}</label>
            <input type="text"
              value={editing ? form.name : user.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              disabled={!editing}
              className={`${inputClass} ${editing ? '' : 'opacity-50 cursor-default'}`}
            />
          </div>
          <div>
            <label className="text-white/25 text-[10px] uppercase tracking-[0.15em] font-mono block mb-1.5">{t.email}</label>
            <input type="email" value={user.email} disabled className={`${inputClass} opacity-50 cursor-default`} />
          </div>
          <div>
            <label className="text-white/25 text-[10px] uppercase tracking-[0.15em] font-mono block mb-1.5">{t.region}</label>
            <input type="text"
              value={editing ? form.region : (user.region || '—')}
              onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
              disabled={!editing}
              className={`${inputClass} ${editing ? '' : 'opacity-50 cursor-default'}`}
            />
          </div>

          <div className="flex gap-3 pt-1">
            {editing ? (
              <>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {saving ? t.saving : t.save}
                </button>
                <button onClick={() => { setEditing(false); setForm({ name: user.name, region: user.region || '' }); }}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] text-white/50 font-medium py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2">
                  <X size={14} /> {t.cancel}
                </button>
              </>
            ) : (
              <button onClick={() => { setEditing(true); setForm({ name: user.name, region: user.region || '' }); }}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] text-white/50 font-medium py-2.5 rounded-xl text-xs transition-all">
                {t.edit}
              </button>
            )}
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full bg-red-500/[0.06] border border-red-500/15 hover:bg-red-500/[0.12] text-red-400/80 hover:text-red-400 font-medium py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2">
          <LogOut size={14} /> {t.logout}
        </button>
      </div>
    </div>
  );
}
