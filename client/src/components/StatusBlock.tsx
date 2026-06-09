import { useTranslation } from 'react-i18next';

type StatusBlockProps = {
  error: string | null;
  isLoading: boolean;
  hasData: boolean;
  onRetry?: () => void;
};

export function StatusBlock({ error, isLoading, hasData, onRetry }: StatusBlockProps) {
  const { t } = useTranslation();

  if (error) {
    return (
      <div className="rounded-token border border-danger/30 bg-danger/10 backdrop-blur-xl p-5 text-start text-sm text-red-200 shadow-lg shadow-danger/5 animate-pulse">
        <div className="flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <h5 className="font-black text-white">{t('reportError')}</h5>
            <p className="mt-1 font-medium text-red-300/90">{error}</p>
          </div>
        </div>
        {onRetry ? (
          <button 
            type="button" 
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-danger/20 hover:bg-danger/30 border border-danger/40 px-4 py-2 text-xs font-black text-white transition-colors duration-350" 
            onClick={onRetry}
          >
            {t('retry')}
          </button>
        ) : null}
      </div>
    );
  }

  if (isLoading && !hasData) {
    return (
      <div className="rounded-token border border-white/10 bg-slate-900/40 backdrop-blur-xl p-5 text-start text-sm text-slate-300 shadow-md">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="font-extrabold">{t('loading')}...</span>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="rounded-token border border-white/5 bg-slate-900/30 backdrop-blur-md p-5 text-start text-sm text-slate-400 shadow-inner">
        <span className="font-bold">{t('noData')}</span>
      </div>
    );
  }

  return null;
}
