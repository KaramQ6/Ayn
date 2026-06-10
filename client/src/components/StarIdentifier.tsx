import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { identifyStar } from '../lib/api';
import type { StarAnalysis, StarRealismVerdict } from '../types';

const NAJM_ACCENT = '#818cf8';

const realismStyles: Record<StarRealismVerdict, { color: string; bg: string; labelKey: string }> = {
  genuine: { color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', labelKey: 'starIdRealismGenuine' },
  suspect: { color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)', labelKey: 'starIdRealismSuspect' },
  not_celestial: { color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', labelKey: 'starIdRealismNotCelestial' },
};

const typeLabelKeys: Record<StarAnalysis['object_type'], string> = {
  star: 'starIdTypeStar',
  planet: 'starIdTypePlanet',
  constellation: 'starIdTypeConstellation',
  galaxy: 'starIdTypeGalaxy',
  nebula: 'starIdTypeNebula',
  moon: 'starIdTypeMoon',
  other: 'starIdTypeOther',
  unknown: 'starIdTypeUnknown',
};

export function StarIdentifier() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language.startsWith('ar');
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<StarAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  function selectFile(nextFile: File | undefined | null) {
    if (!nextFile) return;
    setFile(nextFile);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(nextFile);
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    selectFile(e.dataTransfer.files?.[0]);
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleAnalyze() {
    if (!file) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const { analysis } = await identifyStar(file);
      setResult(analysis);
    } catch {
      setError(t('starIdError'));
    } finally {
      setIsAnalyzing(false);
    }
  }

  const realism = result ? realismStyles[result.realism_verdict] ?? realismStyles.suspect : null;
  const name = result ? (isAr ? result.object_name_ar : result.object_name_en) : '';
  const constellation = result ? (isAr ? result.constellation_ar : result.constellation_en) : '';
  const description = result ? (isAr ? result.description_ar : result.description_en) : '';
  const realismReason = result ? (isAr ? result.realism_reason_ar : result.realism_reason_en) : '';

  return (
    <div className="panel p-4 bg-najm-panel mt-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="panel-title" style={{ color: NAJM_ACCENT }}>
          {t('starIdTitle')}
        </h3>
        {result?.demo && (
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {t('starIdDemoNote')}
          </span>
        )}
      </div>
      <p className="text-start text-xs text-muted mb-3">{t('starIdSubtitle')}</p>

      {/* Upload / preview zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-token border border-dashed transition ${
          dragActive ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/15 bg-slate-950/40 hover:border-white/30'
        }`}
      >
        {preview ? (
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={NAJM_ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.4L12 15l-1.9-4.6L5.5 9l4.6-1.4L12 3z" />
              <path d="M5 19h14" />
            </svg>
            <span className="text-xs font-semibold text-muted">{t('starIdDropHint')}</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => selectFile(e.target.files?.[0])}
      />

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          className="btn-primary flex-1"
          style={{ backgroundColor: NAJM_ACCENT }}
          disabled={!file || isAnalyzing}
          onClick={handleAnalyze}
        >
          {isAnalyzing ? t('starIdAnalyzing') : t('starIdAnalyze')}
        </button>
        {file && (
          <button type="button" className="btn-secondary" disabled={isAnalyzing} onClick={reset}>
            {t('starIdReset')}
          </button>
        )}
      </div>

      {error && <p className="mt-3 text-start text-sm text-danger">{error}</p>}

      {/* Result */}
      {result && realism && (
        <div className="mt-4 space-y-3 text-start">
          {/* Realism gate badge — shown first */}
          <div className="flex items-center justify-between gap-2 rounded-token border border-white/10 px-3 py-2" style={{ backgroundColor: realism.bg }}>
            <span className="text-sm font-black" style={{ color: realism.color }}>
              {t(realism.labelKey)}
            </span>
            <span className="text-xs font-semibold text-muted">
              {t('starIdRealismScore')}: {result.realism_score}/100
            </span>
          </div>
          {realismReason && <p className="text-xs text-muted">{realismReason}</p>}

          {/* Identification */}
          <div className="rounded-token border border-white/10 bg-slate-950/40 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <h4 className="text-lg font-black text-white">{name || '—'}</h4>
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: NAJM_ACCENT }}>
                {t(typeLabelKeys[result.object_type] ?? 'starIdTypeUnknown')}
              </span>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {constellation && <FactRow label={t('starIdConstellation')} value={constellation} />}
              {result.apparent_magnitude != null && (
                <FactRow label={t('starIdMagnitude')} value={String(result.apparent_magnitude)} />
              )}
              {result.distance_ly != null && (
                <FactRow label={t('starIdDistance')} value={String(result.distance_ly)} />
              )}
              {result.spectral_type && <FactRow label={t('starIdSpectral')} value={result.spectral_type} />}
              <FactRow label={t('starIdConfidence')} value={`${result.confidence}/100`} />
            </dl>

            {description && <p className="mt-3 text-sm leading-relaxed text-slate-200">{description}</p>}

            {result.fun_facts?.length > 0 && (
              <div className="mt-3">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted">{t('starIdFunFacts')}</p>
                <ul className="space-y-1">
                  {result.fun_facts.map((fact, i) => (
                    <li key={i} className="flex gap-2 text-xs text-slate-300">
                      <span style={{ color: NAJM_ACCENT }}>★</span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold text-white">{value}</dd>
    </div>
  );
}
