import { useTranslation } from 'react-i18next';

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.language.startsWith('en') ? 'en' : 'ar';

  return (
    <div className="inline-flex items-center gap-1 rounded-token border border-line bg-panel p-1" aria-label={t('language')}>
      {(['ar', 'en'] as const).map(language => (
        <button
          key={language}
          type="button"
          className={`rounded-[6px] px-3 py-2 text-sm font-semibold transition ${
            currentLanguage === language
              ? 'bg-accent text-white'
              : 'text-muted hover:bg-surface hover:text-text'
          }`}
          onClick={() => void i18n.changeLanguage(language)}
          aria-pressed={currentLanguage === language}
        >
          {language === 'ar' ? t('arabic') : t('english')}
        </button>
      ))}
    </div>
  );
}
