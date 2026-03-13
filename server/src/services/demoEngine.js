// Demo Scenario Engine — auto-playing 3-minute live scenario for competition judges
// Simulates a realistic escalating fire detection event in real-time

import { JORDAN_FORESTS } from '../services/firms.js';

let demoTimer = null;
let demoActive = false;

// The Ajloun Forest fire scenario: 3-minute escalation
const SCENARIO_EVENTS = [
  // T+0s: Temperature spike detected
  {
    delay: 0,
    action: 'weather_spike',
    data: {
      forest: 0, // Ajloun
      temperature: 42.5,
      humidity: 14,
      wind_speed: 35,
      rain_1h: 0,
      risk_score: 82,
    },
    log: 'Weather anomaly detected — Ajloun: 42.5°C, humidity 14%',
  },
  // T+15s: NASA FIRMS hotspot appears
  {
    delay: 15000,
    action: 'firms_hotspot',
    data: {
      latitude: 32.3395,
      longitude: 35.7505,
      brightness: 352,
      confidence: 88,
      satellite: 'VIIRS',
    },
    log: 'NASA FIRMS satellite — thermal anomaly near Ajloun Forest',
  },
  // T+30s: Second hotspot — confirming
  {
    delay: 30000,
    action: 'firms_hotspot',
    data: {
      latitude: 32.3410,
      longitude: 35.7520,
      brightness: 368,
      confidence: 93,
      satellite: 'MODIS',
    },
    log: 'Second satellite confirmation — fire spreading NE',
  },
  // T+45s: Community report with AI analysis
  {
    delay: 45000,
    action: 'community_report',
    data: {
      username: 'Ahmad_Ranger',
      latitude: 32.3400,
      longitude: 35.7510,
      report_type: 'fire',
      ai_classification: 'fire',
      ai_confidence: 91,
    },
    log: 'Ground report — Ranger Ahmad confirms fire + AI Vision: 91% fire',
  },
  // T+60s: Cross-validation triggers HIGH alert
  {
    delay: 60000,
    action: 'cross_validate_alert',
    data: {
      level: 'HIGH',
      latitude: 32.3400,
      longitude: 35.7515,
      sources: 'FIRMS,COMMUNITY,WEATHER_RISK',
      confidence: 78,
      message: '🔴 تنبيه عالي — 3 مصادر مؤكدة بالقرب من غابة عجلون (0.2 كم) — ثقة: 78%',
    },
    log: 'Cross-validation — HIGH alert: 3 sources confirmed, 78% confidence',
  },
  // T+80s: More reports flooding in
  {
    delay: 80000,
    action: 'community_report',
    data: {
      username: 'Sara_Volunteer',
      latitude: 32.3420,
      longitude: 35.7530,
      report_type: 'smoke',
      ai_classification: 'smoke',
      ai_confidence: 85,
    },
    log: 'Second ground report — Sara reports heavy smoke, AI confirms 85%',
  },
  // T+100s: Weather risk escalates further
  {
    delay: 100000,
    action: 'weather_spike',
    data: {
      forest: 0,
      temperature: 44.1,
      humidity: 11,
      wind_speed: 42,
      rain_1h: 0,
      risk_score: 93,
    },
    log: 'Weather escalation — temperature 44.1°C, wind 42 km/h, FWI EXTREME',
  },
  // T+120s: AI Vision detects fire spreading — third hotspot
  {
    delay: 120000,
    action: 'firms_hotspot',
    data: {
      latitude: 32.3430,
      longitude: 35.7545,
      brightness: 385,
      confidence: 97,
      satellite: 'VIIRS',
    },
    log: 'Third FIRMS detection — fire has expanded 500m',
  },
  // T+140s: CRITICAL cross-validation — all 4 sources
  {
    delay: 140000,
    action: 'cross_validate_alert',
    data: {
      level: 'CRITICAL',
      latitude: 32.3415,
      longitude: 35.7520,
      sources: 'FIRMS,COMMUNITY,WEATHER_RISK,AI_VISION',
      confidence: 96,
      message: '🚨 تنبيه حرج — 4 مصادر مؤكدة بالقرب من غابة عجلون (0.1 كم) — ثقة: 96%',
    },
    log: 'CRITICAL ALERT — All 4 sources confirmed: FIRMS + Community + Weather + AI Vision',
  },
  // T+160s: Neighboring forest risk rises
  {
    delay: 160000,
    action: 'weather_spike',
    data: {
      forest: 1, // Dibeen
      temperature: 39.8,
      humidity: 18,
      wind_speed: 28,
      rain_1h: 0,
      risk_score: 71,
    },
    log: 'Adjacent threat — Dibeen Forest risk rising to 71 due to wind direction',
  },
  // T+180s: Demo complete
  {
    delay: 180000,
    action: 'demo_complete',
    data: {},
    log: 'Demo scenario complete — system demonstrated full detection pipeline',
  },
];

export function startDemo(db, broadcast) {
  if (demoActive) {
    return { success: false, message: 'Demo already running' };
  }

  demoActive = true;
  const timers = [];

  console.log('\n🎬 ═══════════════════════════════════════');
  console.log('   ForestGuard AI — DEMO MODE ACTIVATED');
  console.log('   3-minute escalation scenario starting...');
  console.log('═══════════════════════════════════════\n');

  broadcast({ type: 'DEMO_STARTED', data: { duration: 180, events: SCENARIO_EVENTS.length } });

  for (const event of SCENARIO_EVENTS) {
    const timer = setTimeout(() => {
      console.log(`🎬 [DEMO T+${event.delay / 1000}s] ${event.log}`);

      switch (event.action) {
        case 'weather_spike': {
          const forest = JORDAN_FORESTS[event.data.forest];
          db.prepare(`
            INSERT INTO fire_risk (region, latitude, longitude, temperature, humidity, wind_speed, rain_1h, risk_score, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `).run(forest.name, forest.lat, forest.lng, event.data.temperature, event.data.humidity, event.data.wind_speed, event.data.rain_1h, event.data.risk_score);

          broadcast({
            type: 'RISK_UPDATE',
            data: [{
              region: forest.name,
              latitude: forest.lat,
              longitude: forest.lng,
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
            INSERT INTO fire_hotspots (latitude, longitude, brightness, confidence, satellite, source, created_at)
            VALUES (?, ?, ?, ?, ?, 'FIRMS_DEMO', datetime('now'))
          `).run(event.data.latitude, event.data.longitude, event.data.brightness, event.data.confidence, event.data.satellite);

          broadcast({
            type: 'FIRE_UPDATE',
            data: [{
              latitude: event.data.latitude,
              longitude: event.data.longitude,
              brightness: event.data.brightness,
              confidence: event.data.confidence,
              satellite: event.data.satellite,
            }],
          });
          broadcast({ type: 'DEMO_EVENT', data: { event: event.log, progress: event.delay / 180000 } });
          break;
        }

        case 'community_report': {
          const result = db.prepare(`
            INSERT INTO reports (telegram_user_id, username, latitude, longitude, report_type, status, ai_classification, ai_confidence, points_awarded, created_at)
            VALUES (?, ?, ?, ?, ?, 'verified', ?, ?, 10, datetime('now'))
          `).run(
            String(Math.floor(Math.random() * 900000 + 100000)),
            event.data.username,
            event.data.latitude,
            event.data.longitude,
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
            INSERT INTO alerts (level, type, latitude, longitude, message, sources, confidence, created_at)
            VALUES (?, 'cross_validated', ?, ?, ?, ?, ?, datetime('now'))
          `).run(event.data.level, event.data.latitude, event.data.longitude, event.data.message, event.data.sources, event.data.confidence);

          broadcast({
            type: 'NEW_ALERT',
            data: {
              level: event.data.level,
              type: 'cross_validated',
              latitude: event.data.latitude,
              longitude: event.data.longitude,
              message: event.data.message,
              sources: event.data.sources,
              confidence: event.data.confidence,
            },
          });
          broadcast({ type: 'DEMO_EVENT', data: { event: event.log, progress: event.delay / 180000 } });
          break;
        }

        case 'demo_complete': {
          demoActive = false;
          broadcast({ type: 'DEMO_COMPLETE', data: { message: 'Demo scenario complete' } });
          console.log('\n🎬 ═══════════════════════════════════════');
          console.log('   DEMO SCENARIO COMPLETE');
          console.log('═══════════════════════════════════════\n');
          break;
        }
      }
    }, event.delay);

    timers.push(timer);
  }

  demoTimer = timers;
  return { success: true, message: 'Demo started', duration: 180, events: SCENARIO_EVENTS.length };
}

export function stopDemo() {
  if (demoTimer) {
    demoTimer.forEach(t => clearTimeout(t));
    demoTimer = null;
  }
  demoActive = false;
  console.log('🎬 Demo stopped');
  return { success: true, message: 'Demo stopped' };
}

export function isDemoActive() {
  return demoActive;
}
