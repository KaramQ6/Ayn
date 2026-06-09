import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApiResource } from '../hooks/useApiResource';
import { useWebSocketFeed } from '../hooks/useWebSocketFeed';
import { withCountry } from '../lib/api';
import type { Alert, BaydarSite, FireHotspot, Forest, JamalSite, NajjiStats, NajmSite, NizaEvent, Report, Risk, RiyahSite, Stats, UnitMode, WsMessage } from '../types';
import { MapView } from './MapView';
import { MissionBriefing } from './MissionBriefing';
import { SolarPanel } from './SolarPanel';
import { StatusBlock } from './StatusBlock';
import { ConflictPanel } from './ConflictPanel';


const emptyStats: Stats = {
  fires_24h: 0,
  reports_24h: 0,
  active_alerts: 0,
  avg_fire_risk: 0,
  forests_monitored: 0,
  forests: [],
};

type DashboardProps = {
  countryCode: string;
  onCountryChange: (countryCode: string) => void;
  unitMode: UnitMode;
  onUnitModeChange: (unitMode: UnitMode) => void;
};

type LayerKey = 'forests' | 'risk' | 'fires' | 'reports' | 'alerts' | 'solar' | 'agri' | 'dust' | 'conflict' | 'stargazing' | 'wildlife';

const modeLayers: Record<UnitMode, LayerKey[]> = {
  fayy: ['forests', 'risk', 'fires', 'reports', 'alerts'],
  najji: ['risk', 'reports', 'alerts'],
  shuaa: ['solar'],
  baydar: ['agri'],
  riyah: ['dust'],
  niza: ['conflict'],
  najm: ['stargazing'],
  jamal: ['wildlife'],
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null;
}

function isFloodAlertMessage(message: WsMessage) {
  const data = asRecord(message.data);
  return message.type === 'NEW_ALERT' && data?.type === 'flood';
}

function formatNajjiMessage(message: WsMessage) {
  if (message.type === 'NAJJI_UPDATE') {
    return `${message.risk ?? 'NORMAL'} | ${message.rain_mm ?? 0}mm | ${message.Q_m3s ?? '0.0'} m³/s`;
  }

  const data = asRecord(message.data);
  if (typeof data?.message === 'string') return data.message;
  if (Array.isArray(message.data) && message.data.length > 0) {
    const firstItem = asRecord(message.data[0]);
    if (typeof firstItem?.message === 'string') return firstItem.message;
  }

  return message.type;
}

function getFeedDetail(message: WsMessage): string | null {
  const data = asRecord(message.data);

  if (message.type === 'FIRE_UPDATE') {
    const count = Array.isArray(message.data) ? message.data.length : (data?.count as number ?? null);
    return typeof count === 'number' ? `×${count}` : null;
  }
  if (message.type === 'NEW_REPORT') {
    const rtype = data?.report_type as string ?? null;
    return rtype ?? null;
  }
  if (message.type === 'NEW_ALERT') {
    const level = data?.level as string ?? null;
    return level ?? null;
  }
  if (message.type === 'ALERT_RESOLVED') {
    return (data?.level as string) ?? null;
  }
  if (message.type === 'NAJJI_UPDATE') {
    return `${message.rain_mm ?? 0}mm`;
  }
  if (message.type === 'CLIENT_COUNT') {
    return typeof message.clientCount === 'number' ? `${message.clientCount}` : null;
  }
  return null;
}

function getPanelBackground(unitMode: UnitMode): string {
  const backgroundMap: Record<UnitMode, string> = {
    fayy: 'bg-fayy-panel',
    najji: 'bg-najji-panel',
    shuaa: 'bg-shuaa-panel',
    baydar: 'bg-baydar-panel',
    riyah: 'bg-riyah-panel',
    niza: 'bg-niza-panel',
    najm: 'bg-najm-panel',
    jamal: 'bg-jamal-panel',
  };
  return backgroundMap[unitMode] || '';
}

export function Dashboard({ countryCode, onCountryChange: _, unitMode, onUnitModeChange }: DashboardProps) {
  const { t, i18n } = useTranslation();
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    forests: true,
    risk: true,
    fires: true,
    reports: true,
    alerts: true,
    solar: true,
    agri: true,
    dust: true,
    conflict: true,
    stargazing: true,
    wildlife: true,
  });

  const emptyNajjiStats: NajjiStats = { flood_alerts_24h: 0, avg_rain_mm: 0, latest_flow_m3s: '0.0', critical_wadis: 0, wadis_monitored: 4 };

  const scopedPath = useMemo(() => (path: string) => withCountry(path, countryCode), [countryCode]);
  const stats = useApiResource<Stats>(scopedPath('/api/stats'), emptyStats);
  const forests = useApiResource<Forest[]>(scopedPath('/api/forests'), []);
  const fires = useApiResource<FireHotspot[]>(scopedPath('/api/fires'), []);
  const reports = useApiResource<Report[]>(scopedPath('/api/reports'), []);
  const alerts = useApiResource<Alert[]>(scopedPath('/api/alerts'), []);
  const risks = useApiResource<Risk[]>(scopedPath('/api/risk'), []);
  const najjiStats = useApiResource<NajjiStats>(scopedPath('/api/najji/stats'), emptyNajjiStats);
  const riyahSites = useApiResource<RiyahSite[]>(scopedPath('/api/riyah'), []);
  const baydarSites = useApiResource<BaydarSite[]>(scopedPath('/api/baydar'), []);
  const nizaEvents = useApiResource<NizaEvent[]>('/api/niza', []);
  const najmSites  = useApiResource<NajmSite[]>('/api/najm', []);
  const jamalSites = useApiResource<JamalSite[]>('/api/jamal', []);
  const wsFeed = useWebSocketFeed();

  const displayForests = forests.data.length > 0 ? forests.data : stats.data.forests;
  const floodAlerts = alerts.data.filter(alert => alert.type === 'flood');
  const najjiUpdates = wsFeed.items.filter(item => (
    item.message.type === 'NAJJI_UPDATE'
    || item.message.type === 'FLOOD_UPDATE'
    || isFloodAlertMessage(item.message)
  ));

  const metricCards = useMemo(() => {
    const isAr = i18n.language === 'ar';
    switch (unitMode) {
      case 'najji': {
        const ns = najjiStats.data;
        return [
          { label: t('floodAlerts24h'), value: ns.flood_alerts_24h },
          { label: t('avgRain'),        value: `${ns.avg_rain_mm} mm` },
          { label: t('runoffFlow'),     value: `${ns.latest_flow_m3s} m³/s` },
          { label: t('criticalWadis'), value: ns.critical_wadis },
          { label: t('wadisMonitored'), value: ns.wadis_monitored },
        ];
      }
      case 'shuaa':
        return [
          { label: t('solarPotential'),    value: '—' },
          { label: t('currentIrradiance'), value: '—' },
          { label: t('uvIndex'),           value: '—' },
          { label: t('sunshineHours'),     value: '—' },
          { label: t('solarSites'),        value: '8' },
        ];
      case 'baydar': {
        const sites = baydarSites.data;
        const avgNDVI    = sites.length ? (sites.reduce((s, x) => s + x.ndvi_proxy, 0) / sites.length).toFixed(2) : '—';
        const avgStress  = sites.length ? Math.round(sites.reduce((s, x) => s + x.crop_stress, 0) / sites.length) : 0;
        const avgMoist   = sites.length ? sites.reduce((s, x) => s + x.soil_moisture, 0) / sites.length : 0.2;
        const drought    = avgMoist > 0.25 ? (isAr ? 'منخفض' : 'Low') : avgMoist > 0.12 ? (isAr ? 'متوسط' : 'Moderate') : (isAr ? 'مرتفع' : 'High');
        return [
          { label: t('cropStress'),      value: avgStress },
          { label: t('avgNDVI'),         value: avgNDVI },
          { label: t('droughtIndex'),    value: drought },
          { label: t('farmReports'),     value: reports.data.length },
          { label: t('fieldsMonitored'), value: sites.length || 5 },
        ];
      }
      case 'riyah': {
        const sites = riyahSites.data;
        const avgPm10 = sites.length ? Math.round(sites.reduce((s, x) => s + x.pm10, 0) / sites.length) : 0;
        const avgWind = sites.length ? (sites.reduce((s, x) => s + x.wind_speed, 0) / sites.length * 3.6).toFixed(1) : '0';
        const dustCount = sites.filter(s => s.condition !== 'Clear').length;
        const vis = avgPm10 < 30 ? '20+ km' : avgPm10 < 60 ? '10-15 km' : avgPm10 < 150 ? '5-8 km' : '< 2 km';
        return [
          { label: t('dustAdvisories'),    value: dustCount },
          { label: t('pm10'),              value: `${avgPm10} µg/m³` },
          { label: t('avgWind'),           value: `${avgWind} km/h` },
          { label: t('visibility'),        value: vis },
          { label: t('stationsMonitored'), value: sites.length || 6 },
        ];
      }
      case 'niza': {
        const recent24h = nizaEvents.data.filter(e => {
          const d = new Date(e.event_date ?? e.created_at ?? 0);
          return !isNaN(d.getTime()) && (Date.now() - d.getTime()) < 24 * 60 * 60 * 1000;
        }).length;
        return [
          { label: t('activeDisputes'),    value: 4 },
          { label: t('encroachments24h'),  value: recent24h },
          { label: t('monitoredZones'),    value: 15 },
          { label: t('resolvedConflicts'), value: 8 },
          { label: t('conflictRisk'),      value: isAr ? 'مرتفع' : 'High' },
        ];
      }
      case 'najm': {
        const sites = najmSites.data;
        const best   = sites.length ? sites[0] : null; // sorted desc by seeing_score
        const avgSee = sites.length ? Math.round(sites.reduce((s, x) => s + x.seeing_score, 0) / sites.length) : 0;
        const avgCloud = sites.length ? Math.round(sites.reduce((s, x) => s + x.cloud_cover, 0) / sites.length) : 0;
        const moonIll  = sites.length ? sites[0].moon_illumination : 0;
        const moonLabel = moonIll < 20 ? (isAr ? 'هلال' : 'Crescent') : moonIll < 60 ? (isAr ? 'نصف' : 'Half') : (isAr ? 'بدر' : 'Full');
        return [
          { label: isAr ? 'مواقع رصد النجوم' : 'Stargazing Sites',   value: sites.length || 7 },
          { label: isAr ? 'أفضل موقع الليلة' : 'Best Site Tonight',  value: best ? best.site_name.split(' ').slice(0, 2).join(' ') : '—' },
          { label: isAr ? 'متوسط جودة الرؤية' : 'Avg Seeing Score',  value: sites.length ? `${avgSee}/100` : '—' },
          { label: isAr ? 'متوسط الغيوم' : 'Avg Cloud Cover',        value: sites.length ? `${avgCloud}%` : '—' },
          { label: isAr ? 'مرحلة القمر' : 'Moon Phase',              value: sites.length ? `${moonIll}% (${moonLabel})` : '—' },
        ];
      }
      case 'jamal': {
        const sites = jamalSites.data;
        const totalObs   = sites.reduce((s, x) => s + (x.obs_count_year ?? 0), 0);
        const activeSite = sites.length ? sites[0] : null; // sorted desc by activity_score
        const withObs    = sites.filter(x => x.obs_count_year > 0).length;
        return [
          { label: isAr ? 'أنواع مهددة' : 'Endangered Species',         value: sites.length || 8 },
          { label: isAr ? 'مشاهدات هذا العام' : 'Sightings This Year',  value: totalObs > 0 ? totalObs : '—' },
          { label: isAr ? 'أنشط موقع' : 'Most Active Site',             value: activeSite ? activeSite.site_name.split(' ').slice(0, 2).join(' ') : '—' },
          { label: isAr ? 'أنواع مرصودة' : 'Species w/ Sightings',      value: withObs > 0 ? withObs : '—' },
          { label: isAr ? 'المحميات الطبيعية' : 'Protected Reserves',   value: 5 },
        ];
      }
      case 'fayy':
      default:
        return [
          { label: t('fires24h'),          value: stats.data.fires_24h },
          { label: t('reports24h'),        value: stats.data.reports_24h },
          { label: t('activeAlerts'),      value: stats.data.active_alerts },
          { label: t('avgRisk'),           value: `${stats.data.avg_fire_risk}/100` },
          { label: t('forestsMonitored'),  value: stats.data.forests_monitored },
        ];
    }
  }, [unitMode, stats.data, najjiStats.data, riyahSites.data, baydarSites.data, nizaEvents.data, najmSites.data, jamalSites.data, reports.data.length, t, i18n.language]);


  function toggleLayer(layer: LayerKey) {
    setLayers(current => ({ ...current, [layer]: !current[layer] }));
  }

  function refetchAll() {
    stats.refetch();
    forests.refetch();
    fires.refetch();
    reports.refetch();
    alerts.refetch();
    risks.refetch();
    najjiStats.refetch();
    riyahSites.refetch();
    baydarSites.refetch();
    nizaEvents.refetch();
    najmSites.refetch();
    jamalSites.refetch();
  }

  const modeColors: Record<UnitMode, string> = {
    fayy: '#ff5e3a',
    najji: '#00d2ff',
    shuaa: '#f59e0b',
    baydar: '#10b981',
    riyah: '#d97706',
    niza: '#ef4444',
    najm: '#818cf8',
    jamal: '#84cc16',
  };

  const isAr = i18n.language === 'ar';

  return (
    <section className="space-y-5 px-4 py-6 sm:px-6 lg:px-8 font-sans">
      {/* COMMAND CENTER HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-start flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h2 className="section-title">
              {t('dashboardTitle')}
            </h2>
            <p className="section-subtitle">{t('dashboardSubtitle')}</p>
          </div>
        </div>

        {/* CONSOLE CONTROLS */}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn-secondary rounded-2xl text-xs font-black min-h-10 hover:border-accent/40" onClick={refetchAll}>
            {t('retry')}
          </button>
        </div>
      </div>

      {/* MISSION BRIEFING — Educational game panel */}
      <MissionBriefing unitMode={unitMode} />

      <StatusBlock
        error={stats.error}
        isLoading={stats.isLoading}
        hasData={stats.data.forests_monitored > 0}
        onRetry={stats.refetch}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metricCards.map(card => (
          <div className={`metric-card ${getPanelBackground(unitMode)}`} key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row rtl:lg:flex-row-reverse items-start gap-5 w-full">
        {/* SATELLITE MODULES SWITCHER (LEFT SIDE) */}
        <div className="w-full lg:w-[240px] shrink-0 panel p-5 flex flex-col gap-3 bg-slate-950/40 border-white/10 rounded-[2rem] backdrop-blur-xl">
          <div className="text-start border-b border-white/5 pb-2.5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {isAr ? 'وحدات الرصد الفضائي' : 'Satellite Modules'}
            </h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {(['fayy', 'najji', 'shuaa', 'baydar', 'riyah', 'niza', 'najm', 'jamal'] as UnitMode[]).map((mode) => {
              const active = unitMode === mode;
              const color = modeColors[mode];
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onUnitModeChange(mode)}
                  className={`w-full text-start px-4 py-3 rounded-2xl font-black text-xs transition-colors duration-200 border flex items-center justify-between group ${active ? 'text-slate-950' : ''
                    }`}
                  style={{
                    backgroundColor: active ? color : `${color}15`,
                    borderColor: active ? color : `${color}40`,
                    color: active ? '#030712' : color,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = `${color}30`;
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.borderColor = color;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = `${color}15`;
                      e.currentTarget.style.color = color;
                      e.currentTarget.style.borderColor = `${color}40`;
                    }
                  }}
                >
                  <span className={active ? '' : 'group-hover:text-white transition-colors duration-200'}>
                    {t(mode)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MIDDLE PANEL: MAP VIEW */}
        <div className="panel flex-1 min-w-0 self-start overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-start">
              <h3 className="panel-title">{t('mapTitle')}</h3>
              <p className="text-sm text-muted">
                {unitMode === 'najji' ? t('floodFocus') : unitMode === 'shuaa' ? t('solarTitle') : unitMode === 'najm' ? (isAr ? 'أفضل مواقع رصد النجوم في الأردن' : 'Best stargazing sites in Jordan') : unitMode === 'jamal' ? (isAr ? 'الحيوانات المهددة بالانقراض' : 'Endangered wildlife sites') : t('layers')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t('layers')}>
              {modeLayers[unitMode].map(layer => (
                <label className="layer-toggle" key={layer}>
                  <input
                    type="checkbox"
                    checked={layers[layer]}
                    onChange={() => toggleLayer(layer)}
                  />
                  <span>{t(layer)}</span>
                </label>
              ))}
            </div>
          </div>
          <MapView
            forests={displayForests}
            risks={risks.data}
            fires={fires.data}
            reports={reports.data}
            alerts={alerts.data}
            riyahSites={riyahSites.data}
            baydarSites={baydarSites.data}
            layers={layers}
            unitMode={unitMode}
          />
        </div>

        {/* RIGHT PANEL: ASIDE DETAILS */}
        <aside className="w-full lg:w-[360px] shrink-0 self-start space-y-5">
          <div className={`panel p-4 ${getPanelBackground(unitMode)}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="panel-title">{t('liveFeed')}</h3>
              <span className={`status-pill ${wsFeed.status}`}>{t(wsFeed.status)}</span>
            </div>
            {wsFeed.items.length === 0 ? (
              <p className="text-start text-sm text-muted">{t('noData')}</p>
            ) : (
              <ul className="space-y-3 text-start">
                {wsFeed.items.slice(0, 8).map(item => {
                  const label = t(`wsEvents.${item.message.type}`, item.message.type);
                  const detail = getFeedDetail(item.message);
                  return (
                    <li className="feed-item" key={item.id}>
                      <span>
                        {label}
                        {detail ? <em className="ms-1.5 not-italic text-text/60">{detail}</em> : null}
                      </span>
                      <time>{new Date(item.receivedAt).toLocaleTimeString()}</time>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {unitMode === 'shuaa' ? (
            <SolarPanel countryCode={countryCode} unitMode={unitMode} />
          ) : unitMode === 'niza' ? (
            <ConflictPanel unitMode={unitMode} />
          ) : unitMode === 'najm' ? (
            <div className="panel p-4 bg-najm-panel">
              <div className="flex items-center justify-between mb-3">
                <h3 className="panel-title" style={{ color: '#818cf8' }}>
                  {isAr ? 'جودة السماء الليلة' : 'Tonight\'s Sky Conditions'}
                </h3>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {najmSites.isLoading ? '…' : najmSites.data.length ? 'Open-Meteo' : 'offline'}
                </span>
              </div>
              {najmSites.isLoading ? (
                <p className="text-start text-sm text-muted">{isAr ? 'جارٍ تحميل بيانات السماء…' : 'Loading sky conditions…'}</p>
              ) : najmSites.data.length > 0 ? (
                <ul className="space-y-3 text-start">
                  {najmSites.data.slice(0, 5).map((site) => {
                    const scoreColor = site.seeing_score >= 80 ? '#818cf8' : site.seeing_score >= 60 ? '#10b981' : site.seeing_score >= 40 ? '#f59e0b' : '#ef4444';
                    return (
                      <li key={site.site_id} className="group">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-white truncate">{site.site_name}</span>
                          <span className="text-xs font-semibold shrink-0" style={{ color: scoreColor }}>
                            {site.seeing_score}/100
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full transition-all" style={{ width: `${site.seeing_score}%`, backgroundColor: scoreColor }} />
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-muted">
                          <span>{isAr ? 'غيوم' : 'Cloud'}: {site.cloud_cover}%</span>
                          <span>{isAr ? 'رياح' : 'Wind'}: {site.wind_speed.toFixed(1)} m/s</span>
                          <span>{isAr ? 'رؤية' : 'Seeing'}: {site.seeing_label}</span>
                        </div>
                      </li>
                    );
                  })}
                  {najmSites.data[0] && (
                    <li className="pt-1 border-t border-white/10 text-[11px] text-muted text-start">
                      {isAr ? `القمر: ${najmSites.data[0].moon_illumination}% إضاءة` : `Moon: ${najmSites.data[0].moon_illumination}% illuminated`}
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-start text-sm text-muted">{isAr ? 'لا تتوفر بيانات حالياً' : 'No data yet — fetching on next cycle'}</p>
              )}
            </div>
          ) : unitMode === 'jamal' ? (
            <div className="panel p-4 bg-jamal-panel">
              <div className="flex items-center justify-between mb-3">
                <h3 className="panel-title" style={{ color: '#84cc16' }}>
                  {isAr ? 'مشاهدات الحياة البرية' : 'Wildlife Observations'}
                </h3>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {jamalSites.isLoading ? '…' : jamalSites.data.length ? 'GBIF' : 'offline'}
                </span>
              </div>
              {jamalSites.isLoading ? (
                <p className="text-start text-sm text-muted">{isAr ? 'جارٍ تحميل بيانات الحياة البرية…' : 'Loading wildlife data…'}</p>
              ) : jamalSites.data.length > 0 ? (
                <ul className="space-y-3 text-start">
                  {jamalSites.data.slice(0, 6).map((site) => {
                    const hasObs  = site.obs_count_year > 0;
                    const obsColor = site.activity_score >= 60 ? '#84cc16' : site.activity_score >= 30 ? '#f59e0b' : '#94a3b8';
                    return (
                      <li key={site.site_id} className="group">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white/90 truncate">{site.site_name}</span>
                          <span className="text-[10px] font-semibold shrink-0" style={{ color: obsColor }}>
                            {hasObs ? `${site.obs_count_year} obs` : (isAr ? 'لا مشاهدات' : 'no obs')}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-muted">
                          <span className="italic">{site.taxon_name}</span>
                          {site.latest_obs_date && <span>{site.latest_obs_date}</span>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-start text-sm text-muted">{isAr ? 'لا تتوفر بيانات حالياً' : 'No data yet — fetching on next cycle'}</p>
              )}
            </div>
          ) : (
            <div className={`panel p-4 ${getPanelBackground(unitMode)}`}>
              <h3 className="panel-title mb-3">
                {unitMode === 'najji'
                  ? t('latestFloodUpdates')

                  : unitMode === 'baydar'
                    ? (isAr ? 'حالة الحقول الزراعية' : 'Vegetative Health')
                    : unitMode === 'riyah'
                      ? (isAr ? 'تنبيهات الغبار' : 'Dust Advisories')
                      : (isAr ? 'تنبيهات حرائق الغابات' : 'Forest Fire Advisories')}
              </h3>
              {unitMode === 'najji' ? (
                floodAlerts.length === 0 && najjiUpdates.length === 0 ? (
                  <p className="text-start text-sm text-muted">{t('noData')}</p>
                ) : (
                  <ul className="space-y-3 text-start">
                    {floodAlerts.slice(0, 6).map(alert => (
                      <li className="list-row" key={alert.id ?? alert.message}>
                        <strong className="text-accent">{alert.level}</strong>
                        <span>{alert.message}</span>
                      </li>
                    ))}
                    {najjiUpdates.slice(0, 6 - Math.min(floodAlerts.length, 6)).map(item => (
                      <li className="list-row" key={item.id}>
                        <strong className="text-accent">{item.message.type}</strong>
                        <span>{formatNajjiMessage(item.message)}</span>
                      </li>
                    ))}
                  </ul>
                )

              ) : unitMode === 'baydar' ? (
                <ul className="space-y-3 text-start">
                  <li className="list-row">
                    <strong className="text-success">NDVI Peak</strong>
                    <span>{isAr ? 'حقول عجلون الزراعية تظهر إنتاجية عالية' : 'Ajloun agricultural fields showing high productivity'}</span>
                  </li>
                  <li className="list-row">
                    <strong className="text-warning">Water Stress</strong>
                    <span>{isAr ? 'طلب ري لحقل المفرق B12' : 'Irrigation requested for Mafraq field B12'}</span>
                  </li>
                </ul>
              ) : unitMode === 'riyah' ? (
                <ul className="space-y-3 text-start">
                  <li className="list-row">
                    <strong className="text-danger">Dust Alert</strong>
                    <span>{isAr ? 'سحابة غبار قادمة من الصحراء الشرقية' : 'Approaching dust cloud from eastern desert'}</span>
                  </li>
                  <li className="list-row">
                    <strong className="text-success">Clear</strong>
                    <span>{isAr ? 'مدى الرؤية ممتاز في عجلون وجرش' : 'Ajloun/Jerash area visibility excellent'}</span>
                  </li>
                </ul>
              ) : (
                <ul className="space-y-3 text-start">
                  <li className="list-row">
                    <strong className="text-danger">{isAr ? 'مراقبة خطر' : 'Fire Watch'}</strong>
                    <span>{isAr ? 'مراقبة مكثفة لمحمية دبين وغابات جرش' : 'Intense monitoring for Dibeen Reserve and Jerash forests'}</span>
                  </li>
                  <li className="list-row">
                    <strong className="text-success">{isAr ? 'مستقر' : 'Stable'}</strong>
                    <span>{isAr ? 'رطوبة الهواء والتربة في مستويات آمنة بعجلون' : 'Air and soil moisture at safe levels in Ajloun'}</span>
                  </li>
                </ul>
              )}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
