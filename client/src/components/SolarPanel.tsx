import { useTranslation } from 'react-i18next';
import { useApiResource } from '../hooks/useApiResource';
import type { SolarSite } from '../types';

function potentialColor(label: string) {
  if (label === 'EXCELLENT') return 'text-[#f59e0b]';
  if (label === 'GOOD') return 'text-[#fbbf24]';
  if (label === 'MODERATE') return 'text-[#d1d5db]';
  return 'text-muted';
}

function scoreBar(score: number) {
  const pct = Math.max(0, Math.min(100, score));
  const color = pct >= 80 ? '#f59e0b' : pct >= 60 ? '#fbbf24' : pct >= 40 ? '#6b7280' : '#4b5563';
  return (
    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export function SolarPanel({ countryCode }: { countryCode: string }) {
  const { t } = useTranslation();
  const url = countryCode ? `/api/solar?country=${countryCode}` : '/api/solar';
  const solar = useApiResource<SolarSite[]>(url, []);

  const best = solar.data[0] ?? null;

  return (
    <>
      <div className="panel p-4 bg-shuaa-panel">
        <h3 className="panel-title mb-1">{t('solarTitle')}</h3>
        <p className="mb-3 text-xs text-muted">{t('solarSubtitle')}</p>

        {best && (
          <div className="mb-3 rounded-token border border-[#f59e0b]/30 bg-[#f59e0b]/5 p-3 text-start">
            <p className="text-xs text-muted">{t('bestSolarSite')}</p>
            <p className="mt-0.5 text-sm font-bold text-[#f59e0b]">{best.site_id.replace(/_/g, ' ')}</p>
            <p className="text-xs text-text/70">
              {best.ghi_w_m2} W/m² · {t(`potential_${best.potential_label}`, best.potential_label)}
            </p>
          </div>
        )}

        {solar.data.length === 0 ? (
          <p className="text-start text-sm text-muted">{t('noData')}</p>
        ) : (
          <ul className="space-y-2.5 text-start">
            {solar.data.map((site) => (
              <li key={site.site_id} className="group">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium capitalize text-text">
                    {site.site_id.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-xs font-semibold ${potentialColor(site.potential_label)}`}>
                    {t(`potential_${site.potential_label}`, site.potential_label)}
                  </span>
                </div>
                {scoreBar(site.potential_score)}
                <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                  <span>{site.ghi_w_m2} W/m²</span>
                  <span>{t('uvIndex')}: {site.uv_index?.toFixed(1) ?? '–'}</span>
                  <span>{site.sunshine_hours?.toFixed(1) ?? '–'} h</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel p-4 bg-shuaa-panel">
        <h3 className="panel-title mb-3">{t('solarInsight')}</h3>
        <ul className="space-y-3 text-start">
          {solar.data.filter(s => s.potential_label === 'EXCELLENT').slice(0, 2).map(site => (
            <li className="list-row" key={`insight-${site.site_id}`}>
              <strong className="text-[#f59e0b]">{t('potential_EXCELLENT')}</strong>
              <span className="capitalize">{site.site_id.replace(/_/g, ' ')} · {site.potential_score}/100</span>
            </li>
          ))}
          {solar.data.filter(s => s.potential_label === 'GOOD').slice(0, 2).map(site => (
            <li className="list-row" key={`insight-${site.site_id}`}>
              <strong className="text-[#fbbf24]">{t('potential_GOOD')}</strong>
              <span className="capitalize">{site.site_id.replace(/_/g, ' ')} · {site.potential_score}/100</span>
            </li>
          ))}
          {solar.data.length === 0 && (
            <li className="text-sm text-muted">{t('noData')}</li>
          )}
        </ul>
      </div>
    </>
  );
}
