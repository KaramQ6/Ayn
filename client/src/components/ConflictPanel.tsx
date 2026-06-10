import { useTranslation } from 'react-i18next';
import { useApiResource } from '../hooks/useApiResource';
import type { NizaEvent } from '../types';

const NIZA_SITES = [
  { id: 1, name: 'Ajloun Forest Border',      nameAr: 'حدود غابات عجلون',      lat: 32.33, lng: 35.75, type: 'Encroachment',    typeAr: 'تعدي سكني',          intensity: 'High',   intensityAr: 'عالي',  status: 'Under Review',        statusAr: 'تحت المراجعة',    area: '1.2 km²' },
  { id: 2, name: 'Wadi Rum Pastoral Lands',   nameAr: 'أراضي رم الرعوية',       lat: 29.58, lng: 35.42, type: 'Land Use Dispute', typeAr: 'نزاع استخدام أراضي', intensity: 'Medium', intensityAr: 'متوسط', status: 'Active Mediation',    statusAr: 'وساطة نشطة',      area: '4.5 km²' },
  { id: 3, name: 'Badia Aquifers Zone C',     nameAr: 'آبار البادية المنطقة C',  lat: 31.83, lng: 36.82, type: 'Water Conflict',   typeAr: 'نزاع مائي',          intensity: 'High',   intensityAr: 'عالي',  status: 'Enforcement Pending', statusAr: 'بانتظار الإنفاذ', area: '0.8 km²' },
  { id: 4, name: 'Dibeen Encroachment Sector',nameAr: 'قطاع تعديات دبين',        lat: 32.25, lng: 35.84, type: 'Encroachment',    typeAr: 'تعدي زراعي',         intensity: 'Medium', intensityAr: 'متوسط', status: 'Monitored',           statusAr: 'مراقب',           area: '0.6 km²' }
];

function intensityColor(intensity: string) {
  if (intensity === 'High'   || intensity === 'عالي')  return 'text-red-400';
  if (intensity === 'Medium' || intensity === 'متوسط') return 'text-amber-400';
  return 'text-green-400';
}

function intensityBar(intensity: string) {
  const width = intensity === 'High' || intensity === 'عالي' ? '100%' : intensity === 'Medium' || intensity === 'متوسط' ? '65%' : '30%';
  const color = intensity === 'High' || intensity === 'عالي' ? '#ef4444' : intensity === 'Medium' || intensity === 'متوسط' ? '#f59e0b' : '#10b981';
  return (
    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full transition-all" style={{ width, backgroundColor: color }} />
    </div>
  );
}

function formatEventDate(dateStr?: string) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function ConflictPanel() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const nizaEvents = useApiResource<NizaEvent[]>('/api/niza', []);
  const hasEvents = nizaEvents.data.length > 0;

  return (
    <>
      {/* Known Conflict Zones — real documented locations */}
      <div className="panel p-4 bg-niza-panel">
        <h3 className="panel-title mb-1">
          {isAr ? 'مراقبة مناطق النزاع والتعديات' : 'Conflict & Encroachment Monitor'}
        </h3>
        <p className="mb-3 text-xs text-muted">
          {isAr ? 'النزاعات النشطة وتعديات الملكية على أراضي الدولة والغابات.' : 'Active disputes and property encroachment on state and forest land.'}
        </p>

        <ul className="space-y-3.5 text-start">
          {NIZA_SITES.map((site) => (
            <li key={site.id} className="group">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-white">
                  {isAr ? site.nameAr : site.name}
                </span>
                <span className={`text-xs font-semibold ${intensityColor(site.intensity)}`}>
                  {isAr ? site.intensityAr : site.intensity}
                </span>
              </div>
              {intensityBar(site.intensity)}
              <div className="mt-1.5 flex items-center justify-between text-xs text-muted">
                <span>{isAr ? site.typeAr : site.type}</span>
                <span>{isAr ? site.statusAr : site.status}</span>
                <span>{site.area}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* GDELT Intelligence Feed — real news from public API */}
      <div className="panel p-4 bg-niza-panel">
        <div className="flex items-center justify-between mb-3">
          <h3 className="panel-title">
            {isAr ? 'تحليل الاستخبارات الميدانية' : 'Field Intelligence Feed'}
          </h3>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {nizaEvents.isLoading ? '…' : hasEvents ? 'Wikipedia' : 'offline'}
          </span>
        </div>

        {nizaEvents.isLoading ? (
          <p className="text-start text-sm text-muted">{isAr ? 'جارٍ تحميل البيانات…' : 'Loading intelligence…'}</p>
        ) : hasEvents ? (
          <ul className="space-y-3 text-start">
            {nizaEvents.data.slice(0, 6).map((event) => (
              <li key={event.id ?? event.url} className="group">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-red-400 text-xs">▲</span>
                  <div className="min-w-0">
                    {event.url ? (
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-white/90 leading-snug hover:text-accent transition-colors line-clamp-2"
                      >
                        {event.title}
                      </a>
                    ) : (
                      <p className="text-xs font-medium text-white/90 leading-snug line-clamp-2">{event.title}</p>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted">
                      {event.source_domain && <span>{event.source_domain}</span>}
                      {event.event_date && <span>{formatEventDate(event.event_date)}</span>}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          // Fallback static analysis when GDELT is unavailable
          <ul className="space-y-3 text-start">
            <li className="list-row border-red-500/20 bg-red-950/5">
              <strong className="text-red-400">{isAr ? 'خطر مرتفع' : 'High Risk'}</strong>
              <span>
                {isAr
                  ? 'عجلون · توسع سكاني غير قانوني داخل حدود الغابات المحمية'
                  : 'Ajloun · Illegal residential sprawl inside protected forest boundaries'}
              </span>
            </li>
            <li className="list-row border-red-500/20 bg-red-950/5">
              <strong className="text-red-400">{isAr ? 'خطر مرتفع' : 'High Risk'}</strong>
              <span>
                {isAr
                  ? 'البادية · حفر آبار ارتوازية غير مرخصة يزيد من توتر الموارد المائية'
                  : 'Badia · Unlicensed borehole drilling increasing water resource tension'}
              </span>
            </li>
            <li className="list-row border-amber-500/20 bg-amber-950/5">
              <strong className="text-amber-400">{isAr ? 'وساطة' : 'Mediation'}</strong>
              <span>
                {isAr
                  ? 'وادي رم · تنسيق مناطق الرعي التقليدية وممرات السياحة'
                  : 'Wadi Rum · Coordination of traditional grazing zones and tourism trails'}
              </span>
            </li>
          </ul>
        )}
      </div>
    </>
  );
}
