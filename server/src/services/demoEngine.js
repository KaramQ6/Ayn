// Demo Scenario Engine — auto-playing 3-minute live scenarios for competition judges
// Simulates realistic escalating fire detection events in real-time
// Supports 5 scenarios across different countries

import { FORESTS, getForestById } from '../data/forests.js';

let demoTimer = null;
let demoActive = false;
let activeScenarioId = null;

// ── Helper: get forest by ID or fallback to first JO forest ─────────────────
function getForest(forestId) {
  return getForestById(forestId) || FORESTS[0];
}

// ── Scenario Definitions ────────────────────────────────────────────────────
// Each scenario: 10 timed events, ~3-minute duration

function buildAjlounScenario() {
  const f = getForest('jo-ajloun');
  const f2 = getForest('jo-dibeen');
  return {
    id: 'ajloun',
    name: 'Ajloun Forest Fire',
    nameAr: 'حريق غابة عجلون',
    nameFr: 'Incendie de la forêt d\'Ajloun',
    country: 'JO',
    description: 'Escalating wildfire in Ajloun Forest, Jordan — the classic ForestGuard scenario',
    center: [f.lat, f.lng],
    zoom: 11,
    events: [
      { delay: 0,      action: 'weather_spike',       data: { forestId: 'jo-ajloun', temperature: 42.5, humidity: 14, wind_speed: 35, rain_1h: 0, risk_score: 82 }, log: `Weather anomaly — ${f.nameAr}: 42.5°C, humidity 14%` },
      { delay: 15000,  action: 'firms_hotspot',        data: { latitude: f.lat + 0.006, longitude: f.lng + 0.0005, brightness: 352, confidence: 88, satellite: 'VIIRS', country: 'JO' }, log: 'NASA FIRMS — thermal anomaly near Ajloun' },
      { delay: 30000,  action: 'firms_hotspot',        data: { latitude: f.lat + 0.008, longitude: f.lng + 0.002, brightness: 368, confidence: 93, satellite: 'MODIS', country: 'JO' }, log: 'Second satellite confirmation — fire spreading NE' },
      { delay: 45000,  action: 'community_report',     data: { username: 'Ahmad_Ranger', latitude: f.lat + 0.007, longitude: f.lng + 0.001, report_type: 'fire', ai_classification: 'fire', ai_confidence: 91, country: 'JO' }, log: 'Ground report — Ranger Ahmad confirms fire + AI: 91%' },
      { delay: 60000,  action: 'cross_validate_alert', data: { level: 'HIGH', latitude: f.lat + 0.007, longitude: f.lng + 0.0015, sources: 'FIRMS,COMMUNITY,WEATHER_RISK', confidence: 78, country: 'JO', message: `🔴 تنبيه عالي — 3 مصادر مؤكدة بالقرب من ${f.nameAr} / ${f.name} (0.2 كم) — ثقة: 78%` }, log: 'HIGH alert: 3 sources confirmed, 78% confidence' },
      { delay: 80000,  action: 'community_report',     data: { username: 'Sara_Volunteer', latitude: f.lat + 0.009, longitude: f.lng + 0.003, report_type: 'smoke', ai_classification: 'smoke', ai_confidence: 85, country: 'JO' }, log: 'Second report — Sara reports heavy smoke, AI 85%' },
      { delay: 100000, action: 'weather_spike',        data: { forestId: 'jo-ajloun', temperature: 44.1, humidity: 11, wind_speed: 42, rain_1h: 0, risk_score: 93 }, log: 'Weather escalation — 44.1°C, wind 42 km/h, FWI EXTREME' },
      { delay: 120000, action: 'firms_hotspot',        data: { latitude: f.lat + 0.010, longitude: f.lng + 0.0045, brightness: 385, confidence: 97, satellite: 'VIIRS', country: 'JO' }, log: 'Third FIRMS — fire expanded 500m' },
      { delay: 140000, action: 'cross_validate_alert', data: { level: 'CRITICAL', latitude: f.lat + 0.008, longitude: f.lng + 0.002, sources: 'FIRMS,COMMUNITY,WEATHER_RISK,AI_VISION', confidence: 96, country: 'JO', message: `🚨 تنبيه حرج — 4 مصادر مؤكدة بالقرب من ${f.nameAr} / ${f.name} (0.1 كم) — ثقة: 96%` }, log: 'CRITICAL — All 4 sources confirmed' },
      { delay: 160000, action: 'weather_spike',        data: { forestId: 'jo-dibeen', temperature: 39.8, humidity: 18, wind_speed: 28, rain_1h: 0, risk_score: 71 }, log: `Adjacent threat — ${f2.nameAr} risk rising to 71` },
    ],
  };
}

function buildLebanonCedarScenario() {
  const f = getForest('lb-cedars');
  const f2 = getForest('lb-ehden');
  return {
    id: 'lebanon-cedar',
    name: 'Cedars of God Fire',
    nameAr: 'حريق أرز الرب',
    nameFr: 'Incendie des Cèdres de Dieu',
    country: 'LB',
    description: 'UNESCO World Heritage cedar forest under threat — Lebanon',
    center: [f.lat, f.lng],
    zoom: 12,
    events: [
      { delay: 0,      action: 'weather_spike',       data: { forestId: 'lb-cedars', temperature: 38.2, humidity: 18, wind_speed: 30, rain_1h: 0, risk_score: 78 }, log: `Weather anomaly — ${f.nameAr}: 38.2°C, dry wind` },
      { delay: 15000,  action: 'firms_hotspot',        data: { latitude: f.lat + 0.003, longitude: f.lng + 0.002, brightness: 340, confidence: 85, satellite: 'VIIRS', country: 'LB' }, log: 'FIRMS thermal anomaly near Cedars of God' },
      { delay: 30000,  action: 'community_report',     data: { username: 'Charbel_Ranger', latitude: f.lat + 0.002, longitude: f.lng + 0.001, report_type: 'smoke', ai_classification: 'smoke', ai_confidence: 83, country: 'LB' }, log: 'Ranger Charbel reports smoke near ancient cedars' },
      { delay: 45000,  action: 'firms_hotspot',        data: { latitude: f.lat + 0.005, longitude: f.lng + 0.004, brightness: 358, confidence: 91, satellite: 'MODIS', country: 'LB' }, log: 'Second satellite — fire approaching heritage zone' },
      { delay: 60000,  action: 'cross_validate_alert', data: { level: 'HIGH', latitude: f.lat + 0.004, longitude: f.lng + 0.003, sources: 'FIRMS,COMMUNITY,WEATHER_RISK', confidence: 82, country: 'LB', message: `🔴 تنبيه عالي — 3 مصادر مؤكدة بالقرب من ${f.nameAr} / ${f.name} (0.3 كم) — ثقة: 82%` }, log: 'HIGH alert — UNESCO heritage at risk' },
      { delay: 80000,  action: 'community_report',     data: { username: 'Nadia_Vol', latitude: f.lat + 0.006, longitude: f.lng + 0.005, report_type: 'fire', ai_classification: 'fire', ai_confidence: 92, country: 'LB' }, log: 'Nadia confirms active flames, AI 92%' },
      { delay: 100000, action: 'weather_spike',        data: { forestId: 'lb-cedars', temperature: 40.5, humidity: 12, wind_speed: 38, rain_1h: 0, risk_score: 91 }, log: 'Wind shift — fire spreading toward Ehden' },
      { delay: 120000, action: 'firms_hotspot',        data: { latitude: f.lat + 0.008, longitude: f.lng + 0.007, brightness: 380, confidence: 96, satellite: 'VIIRS', country: 'LB' }, log: 'Third FIRMS — fire front 800m wide' },
      { delay: 140000, action: 'cross_validate_alert', data: { level: 'CRITICAL', latitude: f.lat + 0.006, longitude: f.lng + 0.005, sources: 'FIRMS,COMMUNITY,WEATHER_RISK,AI_VISION', confidence: 94, country: 'LB', message: `🚨 تنبيه حرج — 4 مصادر مؤكدة بالقرب من ${f.nameAr} / ${f.name} (0.1 كم) — ثقة: 94%` }, log: 'CRITICAL — UNESCO site in immediate danger' },
      { delay: 160000, action: 'weather_spike',        data: { forestId: 'lb-ehden', temperature: 37.0, humidity: 20, wind_speed: 25, rain_1h: 0, risk_score: 68 }, log: `Adjacent — ${f2.nameAr} risk rising to 68` },
    ],
  };
}

function buildIraqKurdistanScenario() {
  const f = getForest('iq-halgurd');
  const f2 = getForest('iq-barzan');
  return {
    id: 'iraq-kurdistan',
    name: 'Halgurd-Sakran Wildfire',
    nameAr: 'حريق هلكورد-سكران',
    nameFr: 'Feu de forêt Halgurd-Sakran',
    country: 'IQ',
    description: 'Mountain wildfire in Kurdistan Region, Iraq — oak forests at 3600m',
    center: [f.lat, f.lng],
    zoom: 11,
    events: [
      { delay: 0,      action: 'weather_spike',       data: { forestId: 'iq-halgurd', temperature: 40.0, humidity: 16, wind_speed: 32, rain_1h: 0, risk_score: 80 }, log: `Weather spike — ${f.nameAr}: 40°C, mountain winds` },
      { delay: 15000,  action: 'firms_hotspot',        data: { latitude: f.lat + 0.004, longitude: f.lng + 0.003, brightness: 345, confidence: 86, satellite: 'VIIRS', country: 'IQ' }, log: 'FIRMS — thermal anomaly Halgurd slopes' },
      { delay: 30000,  action: 'community_report',     data: { username: 'Dilshad_Ranger', latitude: f.lat + 0.003, longitude: f.lng + 0.002, report_type: 'fire', ai_classification: 'fire', ai_confidence: 84, country: 'IQ' }, log: 'Ranger Dilshad reports fire on mountain slope' },
      { delay: 50000,  action: 'firms_hotspot',        data: { latitude: f.lat + 0.006, longitude: f.lng + 0.005, brightness: 362, confidence: 92, satellite: 'MODIS', country: 'IQ' }, log: 'Second satellite — fire climbing upslope' },
      { delay: 65000,  action: 'cross_validate_alert', data: { level: 'HIGH', latitude: f.lat + 0.005, longitude: f.lng + 0.004, sources: 'FIRMS,COMMUNITY,WEATHER_RISK', confidence: 80, country: 'IQ', message: `🔴 تنبيه عالي — 3 مصادر مؤكدة بالقرب من ${f.nameAr} / ${f.name} (0.4 كم) — ثقة: 80%` }, log: 'HIGH alert — mountain fire confirmed' },
      { delay: 85000,  action: 'community_report',     data: { username: 'Shilan_Vol', latitude: f.lat + 0.007, longitude: f.lng + 0.006, report_type: 'smoke', ai_classification: 'smoke', ai_confidence: 87, country: 'IQ' }, log: 'Shilan reports thick smoke, visibility near zero' },
      { delay: 105000, action: 'weather_spike',        data: { forestId: 'iq-halgurd', temperature: 42.3, humidity: 10, wind_speed: 40, rain_1h: 0, risk_score: 92 }, log: 'Extreme conditions — 42.3°C, gusts 40 km/h' },
      { delay: 125000, action: 'firms_hotspot',        data: { latitude: f.lat + 0.009, longitude: f.lng + 0.008, brightness: 388, confidence: 97, satellite: 'VIIRS', country: 'IQ' }, log: 'Third FIRMS — fire spread to adjacent ridge' },
      { delay: 145000, action: 'cross_validate_alert', data: { level: 'CRITICAL', latitude: f.lat + 0.007, longitude: f.lng + 0.006, sources: 'FIRMS,COMMUNITY,WEATHER_RISK,AI_VISION', confidence: 95, country: 'IQ', message: `🚨 تنبيه حرج — 4 مصادر مؤكدة بالقرب من ${f.nameAr} / ${f.name} (0.1 كم) — ثقة: 95%` }, log: 'CRITICAL — mountain ecosystem under severe threat' },
      { delay: 165000, action: 'weather_spike',        data: { forestId: f2 ? 'iq-barzan' : 'iq-halgurd', temperature: 38.5, humidity: 19, wind_speed: 27, rain_1h: 0, risk_score: 65 }, log: 'Adjacent region risk rising' },
    ],
  };
}

function buildMoroccoAtlasScenario() {
  const f = getForest('ma-ifrane');
  const f2 = getForest('ma-rif');
  return {
    id: 'morocco-atlas',
    name: 'Ifrane Cedar Fire',
    nameAr: 'حريق أرز إفران',
    nameFr: 'Incendie des cèdres d\'Ifrane',
    country: 'MA',
    description: 'Cedar and atlas oak fire in Middle Atlas mountains, Morocco',
    center: [f.lat, f.lng],
    zoom: 11,
    events: [
      { delay: 0,      action: 'weather_spike',       data: { forestId: 'ma-ifrane', temperature: 41.0, humidity: 15, wind_speed: 33, rain_1h: 0, risk_score: 81 }, log: `Heatwave — ${f.nameAr}: 41°C, Chergui wind` },
      { delay: 15000,  action: 'firms_hotspot',        data: { latitude: f.lat + 0.005, longitude: f.lng - 0.002, brightness: 348, confidence: 87, satellite: 'VIIRS', country: 'MA' }, log: 'FIRMS — hotspot in Ifrane cedar belt' },
      { delay: 30000,  action: 'community_report',     data: { username: 'Youssef_Garde', latitude: f.lat + 0.004, longitude: f.lng - 0.001, report_type: 'smoke', ai_classification: 'smoke', ai_confidence: 81, country: 'MA' }, log: 'Forest guard Youssef reports smoke in cedar area' },
      { delay: 50000,  action: 'firms_hotspot',        data: { latitude: f.lat + 0.007, longitude: f.lng - 0.004, brightness: 365, confidence: 93, satellite: 'MODIS', country: 'MA' }, log: 'Second satellite — fire moving west' },
      { delay: 65000,  action: 'cross_validate_alert', data: { level: 'HIGH', latitude: f.lat + 0.006, longitude: f.lng - 0.003, sources: 'FIRMS,COMMUNITY,WEATHER_RISK', confidence: 79, country: 'MA', message: `🔴 تنبيه عالي — 3 مصادر مؤكدة بالقرب من ${f.nameAr} / ${f.name} (0.4 كم) — ثقة: 79%` }, log: 'HIGH — cedar forest fire confirmed' },
      { delay: 85000,  action: 'community_report',     data: { username: 'Fatima_Vol', latitude: f.lat + 0.008, longitude: f.lng - 0.005, report_type: 'fire', ai_classification: 'fire', ai_confidence: 90, country: 'MA' }, log: 'Fatima reports visible flames, AI 90%' },
      { delay: 105000, action: 'weather_spike',        data: { forestId: 'ma-ifrane', temperature: 43.2, humidity: 9, wind_speed: 40, rain_1h: 0, risk_score: 94 }, log: 'Extreme Chergui — 43.2°C, gusts 40 km/h' },
      { delay: 125000, action: 'firms_hotspot',        data: { latitude: f.lat + 0.010, longitude: f.lng - 0.006, brightness: 392, confidence: 98, satellite: 'VIIRS', country: 'MA' }, log: 'Third FIRMS — fire front 1km' },
      { delay: 145000, action: 'cross_validate_alert', data: { level: 'CRITICAL', latitude: f.lat + 0.008, longitude: f.lng - 0.005, sources: 'FIRMS,COMMUNITY,WEATHER_RISK,AI_VISION', confidence: 97, country: 'MA', message: `🚨 تنبيه حرج — 4 مصادر مؤكدة بالقرب من ${f.nameAr} / ${f.name} (0.1 كم) — ثقة: 97%` }, log: 'CRITICAL — ancient cedar forest at critical risk' },
      { delay: 165000, action: 'weather_spike',        data: { forestId: f2 ? 'ma-rif' : 'ma-ifrane', temperature: 38.0, humidity: 22, wind_speed: 25, rain_1h: 0, risk_score: 63 }, log: 'Adjacent Rif forests risk rising' },
    ],
  };
}

function buildYemenSocotraScenario() {
  const f = getForest('ye-socotra');
  return {
    id: 'yemen-socotra',
    name: 'Socotra Dragon Blood Trees',
    nameAr: 'أشجار دم الأخوين - سقطرى',
    nameFr: 'Dragonniers de Socotra',
    country: 'YE',
    description: 'Endemic dragon blood trees under deforestation and climate threat — Socotra, Yemen',
    center: [f.lat, f.lng],
    zoom: 11,
    events: [
      { delay: 0,      action: 'weather_spike',       data: { forestId: 'ye-socotra', temperature: 36.5, humidity: 22, wind_speed: 28, rain_1h: 0, risk_score: 72 }, log: `Drought warning — ${f.nameAr}: unusual heat` },
      { delay: 15000,  action: 'firms_hotspot',        data: { latitude: f.lat + 0.004, longitude: f.lng + 0.003, brightness: 320, confidence: 78, satellite: 'VIIRS', country: 'YE' }, log: 'FIRMS — thermal anomaly on Socotra plateau' },
      { delay: 35000,  action: 'community_report',     data: { username: 'Salem_Local', latitude: f.lat + 0.003, longitude: f.lng + 0.002, report_type: 'fire', ai_classification: 'fire', ai_confidence: 75, country: 'YE' }, log: 'Local Salem reports brush fire near dragon blood grove' },
      { delay: 50000,  action: 'firms_hotspot',        data: { latitude: f.lat + 0.006, longitude: f.lng + 0.005, brightness: 342, confidence: 85, satellite: 'MODIS', country: 'YE' }, log: 'Second satellite — fire near endemic species zone' },
      { delay: 65000,  action: 'cross_validate_alert', data: { level: 'HIGH', latitude: f.lat + 0.005, longitude: f.lng + 0.004, sources: 'FIRMS,COMMUNITY,WEATHER_RISK', confidence: 76, country: 'YE', message: `🔴 تنبيه عالي — 3 مصادر مؤكدة بالقرب من ${f.nameAr} / ${f.name} (0.5 كم) — ثقة: 76%` }, log: 'HIGH — endemic ecosystem threatened' },
      { delay: 85000,  action: 'community_report',     data: { username: 'Ammar_Vol', latitude: f.lat + 0.007, longitude: f.lng + 0.006, report_type: 'smoke', ai_classification: 'smoke', ai_confidence: 82, country: 'YE' }, log: 'Ammar reports smoke engulfing dragon blood trees' },
      { delay: 105000, action: 'weather_spike',        data: { forestId: 'ye-socotra', temperature: 39.0, humidity: 15, wind_speed: 35, rain_1h: 0, risk_score: 86 }, log: 'Extreme drying — monsoon failure, 39°C' },
      { delay: 125000, action: 'firms_hotspot',        data: { latitude: f.lat + 0.009, longitude: f.lng + 0.008, brightness: 368, confidence: 93, satellite: 'VIIRS', country: 'YE' }, log: 'Third FIRMS — irreplaceable habitat burning' },
      { delay: 145000, action: 'cross_validate_alert', data: { level: 'CRITICAL', latitude: f.lat + 0.007, longitude: f.lng + 0.006, sources: 'FIRMS,COMMUNITY,WEATHER_RISK,AI_VISION', confidence: 92, country: 'YE', message: `🚨 تنبيه حرج — 4 مصادر مؤكدة بالقرب من ${f.nameAr} / ${f.name} (0.2 كم) — ثقة: 92%` }, log: 'CRITICAL — UNESCO endemic site in crisis' },
      { delay: 165000, action: 'weather_spike',        data: { forestId: 'ye-socotra', temperature: 40.2, humidity: 12, wind_speed: 38, rain_1h: 0, risk_score: 93 }, log: 'Conditions worsening — no relief in sight' },
    ],
  };
}

// ── Build all scenarios ─────────────────────────────────────────────────────
const SCENARIOS = {
  ajloun: buildAjlounScenario,
  'lebanon-cedar': buildLebanonCedarScenario,
  'iraq-kurdistan': buildIraqKurdistanScenario,
  'morocco-atlas': buildMoroccoAtlasScenario,
  'yemen-socotra': buildYemenSocotraScenario,
};

/**
 * Get list of available demo scenarios (metadata only).
 */
export function getScenarios() {
  return Object.entries(SCENARIOS).map(([id, builder]) => {
    const s = builder();
    return {
      id: s.id,
      name: s.name,
      nameAr: s.nameAr,
      nameFr: s.nameFr,
      country: s.country,
      description: s.description,
      center: s.center,
      zoom: s.zoom,
    };
  });
}

/**
 * Start a demo scenario.
 * @param {object} db - Database instance
 * @param {function} broadcast - WebSocket broadcast function
 * @param {string} scenarioId - Scenario identifier (default: 'ajloun')
 */
export function startDemo(db, broadcast, scenarioId = 'ajloun') {
  if (demoActive) {
    return { success: false, message: 'Demo already running', activeScenario: activeScenarioId };
  }

  const builder = SCENARIOS[scenarioId];
  if (!builder) {
    return { success: false, message: `Unknown scenario: ${scenarioId}. Available: ${Object.keys(SCENARIOS).join(', ')}` };
  }

  const scenario = builder();
  demoActive = true;
  activeScenarioId = scenarioId;
  const timers = [];

  console.log(`\n🎬 ═══════════════════════════════════════`);
  console.log(`   ForestGuard AI — DEMO: ${scenario.name}`);
  console.log(`   ${scenario.nameAr} (${scenario.country})`);
  console.log(`   3-minute scenario starting...`);
  console.log(`═══════════════════════════════════════\n`);

  broadcast({
    type: 'DEMO_STARTED',
    data: {
      scenarioId: scenario.id,
      name: scenario.name,
      nameAr: scenario.nameAr,
      country: scenario.country,
      center: scenario.center,
      zoom: scenario.zoom,
      duration: 180,
      events: scenario.events.length,
    },
  });

  for (const event of scenario.events) {
    const timer = setTimeout(() => {
      console.log(`🎬 [DEMO ${scenario.id} T+${event.delay / 1000}s] ${event.log}`);

      switch (event.action) {
        case 'weather_spike': {
          const forest = getForest(event.data.forestId);
          const regionName = `${forest.nameAr} - ${forest.name}`;
          db.prepare(`
            INSERT INTO fire_risk (region, latitude, longitude, country, temperature, humidity, wind_speed, rain_1h, risk_score, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `).run(regionName, forest.lat, forest.lng, forest.country, event.data.temperature, event.data.humidity, event.data.wind_speed, event.data.rain_1h, event.data.risk_score);

          broadcast({
            type: 'RISK_UPDATE',
            data: [{
              region: regionName,
              latitude: forest.lat,
              longitude: forest.lng,
              country: forest.country,
              temperature: event.data.temperature,
              humidity: event.data.humidity,
              wind_speed: event.data.wind_speed,
              risk_score: event.data.risk_score,
            }],
          });
          broadcast({ type: 'DEMO_EVENT', data: { event: event.log, progress: event.delay / 180000 } });
          break;
        }

        case 'firms_hotspot': {
          db.prepare(`
            INSERT INTO fire_hotspots (latitude, longitude, brightness, confidence, satellite, source, country, created_at)
            VALUES (?, ?, ?, ?, ?, 'FIRMS_DEMO', ?, datetime('now'))
          `).run(event.data.latitude, event.data.longitude, event.data.brightness, event.data.confidence, event.data.satellite, event.data.country);

          broadcast({
            type: 'FIRE_UPDATE',
            data: [{
              latitude: event.data.latitude,
              longitude: event.data.longitude,
              brightness: event.data.brightness,
              confidence: event.data.confidence,
              satellite: event.data.satellite,
              country: event.data.country,
            }],
          });
          broadcast({ type: 'DEMO_EVENT', data: { event: event.log, progress: event.delay / 180000 } });
          break;
        }

        case 'community_report': {
          const result = db.prepare(`
            INSERT INTO reports (telegram_user_id, username, latitude, longitude, country, report_type, status, ai_classification, ai_confidence, points_awarded, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'verified', ?, ?, 10, datetime('now'))
          `).run(
            String(Math.floor(Math.random() * 900000 + 100000)),
            event.data.username,
            event.data.latitude,
            event.data.longitude,
            event.data.country,
            event.data.report_type,
            event.data.ai_classification,
            event.data.ai_confidence,
          );

          const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(result.lastInsertRowid);
          broadcast({ type: 'NEW_REPORT', data: report });
          broadcast({ type: 'DEMO_EVENT', data: { event: event.log, progress: event.delay / 180000 } });
          break;
        }

        case 'cross_validate_alert': {
          db.prepare(`
            INSERT INTO alerts (level, type, latitude, longitude, country, message, sources, confidence, created_at)
            VALUES (?, 'cross_validated', ?, ?, ?, ?, ?, ?, datetime('now'))
          `).run(event.data.level, event.data.latitude, event.data.longitude, event.data.country, event.data.message, event.data.sources, event.data.confidence);

          broadcast({
            type: 'NEW_ALERT',
            data: {
              level: event.data.level,
              type: 'cross_validated',
              latitude: event.data.latitude,
              longitude: event.data.longitude,
              country: event.data.country,
              message: event.data.message,
              sources: event.data.sources,
              confidence: event.data.confidence,
            },
          });
          broadcast({ type: 'DEMO_EVENT', data: { event: event.log, progress: event.delay / 180000 } });
          break;
        }
      }
    }, event.delay);

    timers.push(timer);
  }

  // Demo complete timer
  const completeTimer = setTimeout(() => {
    demoActive = false;
    activeScenarioId = null;
    broadcast({ type: 'DEMO_COMPLETE', data: { scenarioId: scenario.id, message: `Demo ${scenario.name} complete` } });
    console.log(`\n🎬 ═══════════════════════════════════════`);
    console.log(`   DEMO COMPLETE: ${scenario.name}`);
    console.log(`═══════════════════════════════════════\n`);
  }, 180000);
  timers.push(completeTimer);

  demoTimer = timers;
  return {
    success: true,
    message: `Demo started: ${scenario.name}`,
    scenarioId: scenario.id,
    name: scenario.name,
    nameAr: scenario.nameAr,
    country: scenario.country,
    center: scenario.center,
    zoom: scenario.zoom,
    duration: 180,
    events: scenario.events.length,
  };
}

export function stopDemo() {
  if (demoTimer) {
    demoTimer.forEach(t => clearTimeout(t));
    demoTimer = null;
  }
  const wasActive = activeScenarioId;
  demoActive = false;
  activeScenarioId = null;
  console.log('🎬 Demo stopped');
  return { success: true, message: 'Demo stopped', stoppedScenario: wasActive };
}

export function isDemoActive() {
  return demoActive;
}

export function getActiveScenario() {
  return activeScenarioId;
}
