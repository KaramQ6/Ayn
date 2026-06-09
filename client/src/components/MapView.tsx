import { Fragment, useEffect } from 'react';
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import type { LatLngExpression, PathOptions } from 'leaflet';
import { useApiResource } from '../hooks/useApiResource';
import type { Alert, BaydarSite, FireHotspot, Forest, Report, Risk, RiyahSite, SolarSite, UnitMode } from '../types';

const HOME_CENTER: [number, number] = [31.165, 36.25];
const HOME_ZOOM = 7.5;
const JORDAN_BOUNDS: [[number, number], [number, number]] = [[29.0, 34.0], [33.5, 39.5]];

// Documented real Jordan conflict/encroachment zones (static — geographic ground truth)
const NIZA_SITES = [
  { id: 1, name: 'Ajloun Forest Border',     nameAr: 'حدود غابات عجلون',     lat: 32.33, lng: 35.75, type: 'Encroachment',    typeAr: 'تعدي سكني',            intensity: 'High',   intensityAr: 'عالي',    status: 'Under Review',        statusAr: 'تحت المراجعة',       area: '1.2 km²' },
  { id: 2, name: 'Wadi Rum Pastoral Lands',  nameAr: 'أراضي رم الرعوية',      lat: 29.58, lng: 35.42, type: 'Land Use Dispute', typeAr: 'نزاع استخدام أراضي',   intensity: 'Medium', intensityAr: 'متوسط',   status: 'Active Mediation',    statusAr: 'وساطة نشطة',         area: '4.5 km²' },
  { id: 3, name: 'Badia Aquifers Zone C',    nameAr: 'آبار البادية المنطقة C', lat: 31.83, lng: 36.82, type: 'Water Conflict',   typeAr: 'نزاع مائي',            intensity: 'High',   intensityAr: 'عالي',    status: 'Enforcement Pending', statusAr: 'بانتظار الإنفاذ',    area: '0.8 km²' },
  { id: 4, name: 'Dibeen Encroachment Sector',nameAr: 'قطاع تعديات دبين',     lat: 32.25, lng: 35.84, type: 'Encroachment',    typeAr: 'تعدي زراعي',           intensity: 'Medium', intensityAr: 'متوسط',   status: 'Monitored',           statusAr: 'مراقب',              area: '0.6 km²' }
];

const NAJM_SITES = [
  { id: 'wadi-rum', name: 'Wadi Rum Dark Sky Reserve', nameAr: 'محمية وادي رم للسماء المظلمة', lat: 29.57, lng: 35.42, darkSkyRating: 95, elevation: 960, bestMonths: 'Mar–Oct', events: ['قلب درب التبانة', 'أمطار البرشاويات'], tier: 'Gold', bortle: 2 },
  { id: 'dana', name: 'Dana Biosphere Reserve', nameAr: 'محمية ضانا الطبيعية', lat: 30.69, lng: 35.62, darkSkyRating: 88, elevation: 1500, bestMonths: 'Apr–Sep', events: ['سديم الجبار', 'تقابل المشتري'], tier: 'Gold', bortle: 2 },
  { id: 'badia', name: 'Northern Badia Desert', nameAr: 'صحراء البادية الشمالية', lat: 32.0, lng: 37.5, darkSkyRating: 85, elevation: 690, bestMonths: 'Jun–Sep', events: ['أمطار البرشاويات', 'قوس درب التبانة'], tier: 'Gold', bortle: 2 },
  { id: 'shoubak', name: 'Shoubak Highlands', nameAr: 'مرتفعات الشوبك', lat: 30.53, lng: 35.56, darkSkyRating: 82, elevation: 1365, bestMonths: 'Apr–Nov', events: ['حلقات زحل', 'تقابل المريخ'], tier: 'Silver', bortle: 3 },
  { id: 'azraq', name: 'Azraq Desert Reserve', nameAr: 'محمية الأزرق الصحراوية', lat: 31.83, lng: 36.82, darkSkyRating: 75, elevation: 530, bestMonths: 'Jun–Oct', events: ['أمطار الأسد', 'أجرام السماء العميقة'], tier: 'Silver', bortle: 3 },
  { id: 'dibeen', name: 'Dibeen Forest Observatory', nameAr: 'غابة دبين - المرصد', lat: 32.25, lng: 35.84, darkSkyRating: 65, elevation: 980, bestMonths: 'Jul–Sep', events: ['مجرة أندروميدا', 'التجمعات النجمية المزدوجة'], tier: 'Bronze', bortle: 4 },
  { id: 'aqaba', name: 'Aqaba Desert Coast', nameAr: 'ساحل العقبة الصحراوي', lat: 29.50, lng: 35.01, darkSkyRating: 70, elevation: 50, bestMonths: 'Nov–Mar', events: ['أجرام السماء الجنوبية', 'القمر الجديد'], tier: 'Bronze', bortle: 4 },
];

const JAMAL_SITES = [
  { id: 'oryx-rum', name: 'Arabian Oryx Sanctuary', nameAr: 'محمية المها العربي - وادي رم', lat: 29.58, lng: 35.42, species: 'Arabian Oryx', speciesAr: 'المها العربي', status: 'Vulnerable', statusAr: 'عرضة للخطر', population: 200, trend: 'Stable', trendAr: 'مستقر', habitat: 'Desert & semi-arid', habitatAr: 'صحراء وشبه جافة', color: '#f59e0b' },
  { id: 'bear-ajloun', name: 'Syrian Brown Bear Zone', nameAr: 'منطقة الدب البني السوري - عجلون', lat: 32.33, lng: 35.75, species: 'Syrian Brown Bear', speciesAr: 'الدب البني السوري', status: 'Critically Endangered', statusAr: 'مهدد بشدة', population: 8, trend: 'Declining', trendAr: 'متراجع', habitat: 'Oak & pine forest', habitatAr: 'غابات بلوط وصنوبر', color: '#ef4444' },
  { id: 'leopard-dana', name: 'Arabian Leopard Territory', nameAr: 'نطاق النمر العربي - محمية ضانا', lat: 30.69, lng: 35.62, species: 'Arabian Leopard', speciesAr: 'النمر العربي', status: 'Critically Endangered', statusAr: 'مهدد بشدة', population: 0, trend: 'Unknown', trendAr: 'غير معروف', habitat: 'Rocky highland terrain', habitatAr: 'تضاريس صخرية مرتفعة', color: '#ef4444' },
  { id: 'deer-shaumari', name: 'Shaumari Wildlife Reserve', nameAr: 'محمية الشومري للحياة البرية', lat: 31.68, lng: 36.95, species: 'Persian Fallow Deer', speciesAr: 'الأيل الفارسي', status: 'Endangered', statusAr: 'مهدد', population: 45, trend: 'Increasing', trendAr: 'في تزايد', habitat: 'Semi-arid woodland', habitatAr: 'غابات شبه جافة', color: '#f97316' },
  { id: 'houbara-badia', name: 'Houbara Bustard Zone', nameAr: 'منطقة الحبارى - البادية', lat: 32.1, lng: 37.8, species: 'Houbara Bustard', speciesAr: 'طائر الحبارى', status: 'Vulnerable', statusAr: 'عرضة للخطر', population: 120, trend: 'Stable', trendAr: 'مستقر', habitat: 'Desert plains', habitatAr: 'سهول صحراوية', color: '#f59e0b' },
  { id: 'hyena-mujib', name: 'Striped Hyena Territory', nameAr: 'نطاق الضبع المخطط - وادي الموجب', lat: 31.47, lng: 35.63, species: 'Striped Hyena', speciesAr: 'الضبع المخطط', status: 'Near Threatened', statusAr: 'قريب من الخطر', population: 35, trend: 'Declining', trendAr: 'متراجع', habitat: 'Wadi & rocky terrain', habitatAr: 'أودية وتضاريس صخرية', color: '#a855f7' },
  { id: 'ibex-petra', name: 'Nubian Ibex Zone', nameAr: 'منطقة الوعل النوبي - البتراء', lat: 30.32, lng: 35.44, species: 'Nubian Ibex', speciesAr: 'الوعل النوبي', status: 'Vulnerable', statusAr: 'عرضة للخطر', population: 90, trend: 'Stable', trendAr: 'مستقر', habitat: 'Rocky desert mountains', habitatAr: 'جبال صحراوية صخرية', color: '#f59e0b' },
  { id: 'wolf-badia', name: 'Arabian Wolf Corridor', nameAr: 'ممر الذئب العربي - البادية الشرقية', lat: 31.5, lng: 38.0, species: 'Arabian Wolf', speciesAr: 'الذئب العربي', status: 'Endangered', statusAr: 'مهدد', population: 15, trend: 'Declining', trendAr: 'متراجع', habitat: 'Desert & steppe', habitatAr: 'صحراء وسهوب', color: '#f97316' },
];

type VisibleLayers = {
  forests: boolean;
  risk: boolean;
  fires: boolean;
  reports: boolean;
  alerts: boolean;
  solar: boolean;
  agri: boolean;
  dust: boolean;
  conflict: boolean;
  stargazing: boolean;
  wildlife: boolean;
};

type MapViewProps = {
  forests: Forest[];
  risks: Risk[];
  fires: FireHotspot[];
  reports: Report[];
  alerts: Alert[];
  riyahSites?: RiyahSite[];
  baydarSites?: BaydarSite[];
  layers: VisibleLayers;
  unitMode: UnitMode;
};

function riskColor(score: number) {
  if (score >= 85) return '#ef4444';
  if (score >= 65) return '#f59e0b';
  if (score >= 45) return '#eab308';
  return '#10b981';
}

function alertColor(alert: Alert) {
  if (alert.type === 'flood') return '#00d2ff';
  if (alert.level === 'CRITICAL') return '#ef4444';
  if (alert.level === 'HIGH') return '#f59e0b';
  return '#3b82f6';
}

function solarColor(score: number) {
  if (score >= 80) return '#f59e0b';
  if (score >= 60) return '#fbbf24';
  if (score >= 40) return '#d1d5db';
  return '#6b7280';
}

function circleStyle(color: string, fillOpacity = 0.18): PathOptions {
  return {
    color,
    fillColor: color,
    fillOpacity,
    opacity: 0.85,
    weight: 2,
  };
}

function MapResizer() {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 150);
    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
}

export function MapView({ forests, risks, fires, reports, alerts, riyahSites = [], baydarSites = [], layers, unitMode }: MapViewProps) {
  const solarSites = useApiResource<SolarSite[]>('/api/solar', []);

  const visibleAlerts = unitMode === 'najji'
    ? alerts.filter(alert => alert.type === 'flood')
    : alerts;

  return (
    <div className="map-frame" aria-label="Jordan operational map">
      <MapContainer
        center={HOME_CENTER as LatLngExpression}
        zoom={HOME_ZOOM}
        minZoom={7}
        maxBounds={JORDAN_BOUNDS}
        scrollWheelZoom
        className="h-[520px] w-full"
      >
        <MapResizer />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* --- Fayy (Fire) & Najji (Flood) Standard Data Layers --- */}
        {(unitMode === 'fayy' || unitMode === 'najji') && (
          <>
            {layers.risk && risks.map(risk => (
              <Circle
                key={`risk-${risk.id ?? risk.region}`}
                center={[risk.latitude, risk.longitude]}
                radius={9000 + Math.max(0, risk.risk_score) * 220}
                pathOptions={circleStyle(riskColor(risk.risk_score), 0.14)}
              >
                <Popup>
                  <strong>{risk.region}</strong>
                  <br />
                  Risk: {risk.risk_score}/100
                  {typeof risk.rain_probability === 'number' ? (
                    <>
                      <br />
                      Rain: {Math.round(risk.rain_probability)}%
                    </>
                  ) : null}
                </Popup>
              </Circle>
            ))}

            {layers.forests && forests.map(forest => (
              <Circle
                key={forest.id}
                center={[forest.lat, forest.lng]}
                radius={forest.radius * 1000}
                pathOptions={circleStyle('#10b981', 0.08)}
              >
                <Popup>
                  <strong>{forest.nameAr} / {forest.name}</strong>
                  <br />
                  {forest.forestType}
                  <br />
                  Radius: {forest.radius} km
                </Popup>
              </Circle>
            ))}

            {layers.fires && fires.map((fire, index) => (
              <CircleMarker
                key={`fire-${fire.id ?? index}`}
                center={[fire.latitude, fire.longitude]}
                radius={8}
                pathOptions={circleStyle('#ff5e3a', 0.72)}
              >
                <Popup>
                  <strong>FIRMS</strong>
                  <br />
                  {fire.confidence ? `Confidence: ${fire.confidence}` : 'Fire hotspot'}
                </Popup>
              </CircleMarker>
            ))}

            {layers.reports && reports.map((report, index) => (
              <CircleMarker
                key={`report-${report.id ?? index}`}
                center={[report.latitude, report.longitude]}
                radius={7}
                pathOptions={circleStyle('#00d2ff', 0.62)}
              >
                <Popup>
                  <strong>{report.report_type}</strong>
                  <br />
                  {report.description || report.status || 'Community report'}
                </Popup>
              </CircleMarker>
            ))}

            {layers.alerts && visibleAlerts.map((alert, index) => {
              if (typeof alert.latitude !== 'number' || typeof alert.longitude !== 'number') return null;
              return (
                <CircleMarker
                  key={`alert-${alert.id ?? index}`}
                  center={[alert.latitude, alert.longitude]}
                  radius={10}
                  pathOptions={circleStyle(alertColor(alert), 0.78)}
                >
                  <Popup>
                    <strong>{alert.level}</strong>
                    <br />
                    {alert.message || alert.type || 'Alert'}
                  </Popup>
                </CircleMarker>
              );
            })}
          </>
        )}

        {/* --- Shu'aa (Solar Irradiance) Layer --- */}
        {unitMode === 'shuaa' && layers.solar && solarSites.data.map((site) => {
          const color = solarColor(site.potential_score);
          const radius = Math.max(5, site.potential_score / 8);
          return (
            <Fragment key={`shuaa-${site.site_id}`}>
              <Circle
                center={[site.latitude, site.longitude]}
                radius={12000 + site.potential_score * 150}
                pathOptions={circleStyle(color, 0.10)}
              />
              <CircleMarker
                center={[site.latitude, site.longitude]}
                radius={radius}
                pathOptions={circleStyle(color, 0.80)}
              >
                <Popup>
                  <strong style={{ color }}>{site.site_id.replace(/_/g, ' ')}</strong>
                  <br />
                  GHI: {site.ghi_w_m2} W/m²
                  <br />
                  Potential: {site.potential_label} ({site.potential_score}/100)
                  <br />
                  UV Index: {site.uv_index?.toFixed(1) ?? '–'}
                  <br />
                  Sunshine: {site.sunshine_hours?.toFixed(1) ?? '–'} h/day
                </Popup>
              </CircleMarker>
            </Fragment>
          );
        })}



        {/* --- Baydar (Agriculture) — Live Open-Meteo data --- */}
        {unitMode === 'baydar' && layers.agri && baydarSites.map((site) => {
          const color = site.health_label === 'Healthy' ? '#10b981' : site.health_label === 'Dry Stress' ? '#f59e0b' : '#6ee7b7';
          const ndviPct = Math.round((site.ndvi_proxy ?? 0) * 100);
          return (
            <Fragment key={`baydar-${site.site_id}`}>
              <Circle
                center={[site.latitude, site.longitude]}
                radius={6000 + ndviPct * 60}
                pathOptions={circleStyle(color, 0.12)}
              />
              <CircleMarker
                center={[site.latitude, site.longitude]}
                radius={8}
                pathOptions={circleStyle(color, 0.85)}
              >
                <Popup>
                  <strong style={{ color }}>{site.site_name}</strong>
                  <br />NDVI≈{site.ndvi_proxy?.toFixed(2)} | Stress: {site.crop_stress}%
                  <br />Soil Moisture: {(site.soil_moisture * 100).toFixed(1)}% | Temp: {site.temperature?.toFixed(1)}°C
                  <br />Health: <strong>{site.health_label}</strong>
                </Popup>
              </CircleMarker>
            </Fragment>
          );
        })}

        {/* --- Riyah (Air Quality & Wind) — Live OpenWeatherMap data --- */}
        {unitMode === 'riyah' && layers.dust && riyahSites.map((site) => {
          const isDust = site.condition !== 'Clear';
          const color = site.condition === 'Hazardous' ? '#ef4444' : site.condition === 'High Dust' ? '#f59e0b' : isDust ? '#d97706' : '#6b7280';
          const radius = Math.max(12000, site.pm10 * 180);
          return (
            <Fragment key={`riyah-${site.site_id}`}>
              <Circle
                center={[site.latitude, site.longitude]}
                radius={radius}
                pathOptions={circleStyle(color, isDust ? 0.22 : 0.08)}
              />
              <CircleMarker
                center={[site.latitude, site.longitude]}
                radius={9}
                pathOptions={circleStyle(color, 0.85)}
              >
                <Popup>
                  <strong style={{ color }}>{site.site_name}</strong>
                  <br />PM10: {site.pm10} µg/m³ | PM2.5: {site.pm2_5} µg/m³
                  <br />Wind: {(site.wind_speed * 3.6).toFixed(1)} km/h ({site.wind_deg}°)
                  <br />AQI: {site.aqi} | <strong>{site.condition}</strong>
                </Popup>
              </CircleMarker>
            </Fragment>
          );
        })}

        {/* --- Niza' (Conflict Zones) Custom Space Layer --- */}
        {unitMode === 'niza' && layers.conflict && NIZA_SITES.map((site) => (
          <Fragment key={`niza-${site.id}`}>
            <Circle
              center={[site.lat, site.lng]}
              radius={site.intensity === 'High' ? 14000 : 8000}
              pathOptions={circleStyle('#ef4444', 0.15)}
            />
            <CircleMarker
              center={[site.lat, site.lng]}
              radius={site.intensity === 'High' ? 10 : 7}
              pathOptions={circleStyle('#ef4444', 0.85)}
            >
              <Popup>
                <strong className="text-[#ef4444]">{site.nameAr} / {site.name}</strong>
                <br />
                <strong>Type:</strong> {site.typeAr} / {site.type}
                <br />
                <strong>Intensity:</strong> {site.intensityAr} / {site.intensity}
                <br />
                <strong>Status:</strong> {site.statusAr} / {site.status}
                <br />
                <strong>Area:</strong> {site.area}
              </Popup>
            </CircleMarker>
          </Fragment>
        ))}

        {/* --- Najm (Stargazing) Layer --- */}
        {unitMode === 'najm' && layers.stargazing && NAJM_SITES.map((site) => {
          const tierColor = site.tier === 'Gold' ? '#f59e0b' : site.tier === 'Silver' ? '#94a3b8' : '#cd7c3a';
          const markerRadius = site.tier === 'Gold' ? 11 : site.tier === 'Silver' ? 8 : 7;
          return (
            <Fragment key={`najm-${site.id}`}>
              <Circle
                center={[site.lat, site.lng]}
                radius={8000 + site.darkSkyRating * 180}
                pathOptions={circleStyle(tierColor, 0.10)}
              />
              <CircleMarker
                center={[site.lat, site.lng]}
                radius={markerRadius}
                pathOptions={circleStyle(tierColor, 0.88)}
              >
                <Popup>
                  <strong style={{ color: tierColor }}>{site.nameAr}</strong>
                  <br />
                  {site.name}
                  <br />
                  <strong>تقييم السماء المظلمة:</strong> {site.darkSkyRating}/100
                  <br />
                  <strong>تصنيف بورتل:</strong> {site.bortle} | <strong>الارتفاع:</strong> {site.elevation} م
                  <br />
                  <strong>أفضل أشهر الرصد:</strong> {site.bestMonths}
                  <br />
                  <strong>الأحداث:</strong> {site.events.join('، ')}
                  <br />
                  <span style={{ color: tierColor, fontWeight: 'bold' }}>{site.tier === 'Gold' ? '🥇 ذهبي' : site.tier === 'Silver' ? '🥈 فضي' : '🥉 برونزي'}</span>
                </Popup>
              </CircleMarker>
            </Fragment>
          );
        })}

        {/* --- Jamal Jamal (Endangered Wildlife) Layer --- */}
        {unitMode === 'jamal' && layers.wildlife && JAMAL_SITES.map((site) => {
          const isCritical = site.status === 'Critically Endangered';
          const markerRadius = isCritical ? 12 : 9;
          const circleRadius = 7000 + (site.population > 0 ? Math.min(site.population * 80, 12000) : 3000);
          return (
            <Fragment key={`jamal-${site.id}`}>
              <Circle
                center={[site.lat, site.lng]}
                radius={circleRadius}
                pathOptions={circleStyle(site.color, isCritical ? 0.18 : 0.10)}
              />
              <CircleMarker
                center={[site.lat, site.lng]}
                radius={markerRadius}
                pathOptions={circleStyle(site.color, 0.88)}
              >
                <Popup>
                  <strong style={{ color: site.color }}>{site.speciesAr}</strong>
                  <br />
                  {site.species}
                  <br />
                  <strong>الموقع:</strong> {site.nameAr}
                  <br />
                  <strong>الحالة:</strong> <span style={{ color: site.color }}>{site.statusAr}</span>
                  <br />
                  <strong>التعداد التقريبي:</strong> {site.population > 0 ? `~${site.population} فرد` : 'غير مؤكد / منقرض محلياً'}
                  <br />
                  <strong>اتجاه التعداد:</strong> {site.trendAr}
                  <br />
                  <strong>الموئل:</strong> {site.habitatAr}
                </Popup>
              </CircleMarker>
            </Fragment>
          );
        })}

      </MapContainer>
    </div>
  );
}
