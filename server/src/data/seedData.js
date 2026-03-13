// Seed Data — 7 days of realistic historical data for ForestGuard AI
// Pre-loads the database with believable fire activity to impress judges

import { JORDAN_FORESTS } from '../services/firms.js';

export function seedDatabase(db) {
  const now = new Date();

  console.log('🌱 Seeding database with 7 days of historical data...');

  // Clear existing data to prevent duplicates on re-seed
  db.exec(`
    DELETE FROM fire_hotspots;
    DELETE FROM reports;
    DELETE FROM alerts;
    DELETE FROM fire_risk;
    DELETE FROM rangers;
  `);

  // --- 1. Fire Hotspots (20 hotspots over 7 days) ---
  const hotspots = [
    // Day -7: small cluster near Ajloun
    { lat: 32.3380, lng: 35.7520, brightness: 312, confidence: 78, satellite: 'VIIRS', daysAgo: 7 },
    { lat: 32.3410, lng: 35.7490, brightness: 298, confidence: 65, satellite: 'VIIRS', daysAgo: 7 },
    // Day -6: Dana reserve activity
    { lat: 30.6550, lng: 35.6200, brightness: 335, confidence: 85, satellite: 'MODIS', daysAgo: 6 },
    { lat: 30.6480, lng: 35.6150, brightness: 322, confidence: 72, satellite: 'VIIRS', daysAgo: 6 },
    { lat: 30.6510, lng: 35.6180, brightness: 340, confidence: 88, satellite: 'VIIRS', daysAgo: 6 },
    // Day -5: quiet day — only 1 low-confidence
    { lat: 32.1020, lng: 35.8050, brightness: 290, confidence: 45, satellite: 'MODIS', daysAgo: 5 },
    // Day -4: Mujib flare-up
    { lat: 31.4700, lng: 35.6380, brightness: 355, confidence: 92, satellite: 'VIIRS', daysAgo: 4 },
    { lat: 31.4720, lng: 35.6350, brightness: 348, confidence: 89, satellite: 'VIIRS', daysAgo: 4 },
    { lat: 31.4680, lng: 35.6400, brightness: 360, confidence: 94, satellite: 'MODIS', daysAgo: 4 },
    // Day -3: spreading to Barqash
    { lat: 32.4680, lng: 35.7350, brightness: 310, confidence: 75, satellite: 'VIIRS', daysAgo: 3 },
    { lat: 32.4700, lng: 35.7380, brightness: 325, confidence: 81, satellite: 'VIIRS', daysAgo: 3 },
    { lat: 31.4690, lng: 35.6370, brightness: 340, confidence: 87, satellite: 'MODIS', daysAgo: 3 },
    // Day -2: multi-region
    { lat: 32.3350, lng: 35.7180, brightness: 318, confidence: 79, satellite: 'VIIRS', daysAgo: 2 },
    { lat: 32.2850, lng: 35.8200, brightness: 305, confidence: 70, satellite: 'VIIRS', daysAgo: 2 },
    { lat: 30.6520, lng: 35.6170, brightness: 330, confidence: 83, satellite: 'MODIS', daysAgo: 2 },
    { lat: 31.8350, lng: 36.8200, brightness: 295, confidence: 60, satellite: 'VIIRS', daysAgo: 2 },
    // Day -1: recent cluster near Ajloun (escalating)
    { lat: 32.3400, lng: 35.7510, brightness: 365, confidence: 95, satellite: 'VIIRS', daysAgo: 1 },
    { lat: 32.3420, lng: 35.7530, brightness: 370, confidence: 96, satellite: 'MODIS', daysAgo: 1 },
    { lat: 32.3390, lng: 35.7480, brightness: 358, confidence: 93, satellite: 'VIIRS', daysAgo: 1 },
    // Day 0: today — live
    { lat: 32.3415, lng: 35.7505, brightness: 375, confidence: 97, satellite: 'VIIRS', daysAgo: 0 },
  ];

  const insertHotspot = db.prepare(`
    INSERT INTO fire_hotspots (latitude, longitude, brightness, confidence, satellite, source, created_at)
    VALUES (?, ?, ?, ?, ?, 'FIRMS', datetime('now', ?))
  `);

  for (const h of hotspots) {
    const offset = `-${h.daysAgo * 24 + Math.floor(Math.random() * 12)} hours`;
    insertHotspot.run(h.lat, h.lng, h.brightness, h.confidence, h.satellite, offset);
  }
  console.log(`  🔥 Inserted ${hotspots.length} fire hotspots`);

  // --- 2. Community Reports (15 reports) ---
  const reports = [
    { user: 'Ahmad', type: 'fire', lat: 32.3370, lng: 35.7510, days: 7, aiClass: 'fire', aiConf: 87 },
    { user: 'Sara', type: 'smoke', lat: 30.6540, lng: 35.6190, days: 6, aiClass: 'smoke', aiConf: 72 },
    { user: 'Omar', type: 'logging', lat: 32.4690, lng: 35.7340, days: 5, aiClass: 'logging', aiConf: 68 },
    { user: 'Layla', type: 'fire', lat: 31.4710, lng: 35.6360, days: 4, aiClass: 'fire', aiConf: 91 },
    { user: 'Khaled', type: 'smoke', lat: 32.2860, lng: 35.8180, days: 4, aiClass: 'smoke', aiConf: 75 },
    { user: 'Noor', type: 'fire', lat: 31.4700, lng: 35.6390, days: 3, aiClass: 'fire', aiConf: 89 },
    { user: 'Faisal', type: 'pollution', lat: 31.8340, lng: 36.8190, days: 3, aiClass: 'none', aiConf: 12 },
    { user: 'Dina', type: 'wildlife', lat: 30.6530, lng: 35.6200, days: 2, aiClass: 'none', aiConf: 8 },
    { user: 'Tariq', type: 'fire', lat: 32.3410, lng: 35.7500, days: 2, aiClass: 'fire', aiConf: 93 },
    { user: 'Rania', type: 'smoke', lat: 32.3350, lng: 35.7170, days: 2, aiClass: 'smoke', aiConf: 78 },
    { user: 'Ahmad', type: 'fire', lat: 32.3395, lng: 35.7490, days: 1, aiClass: 'fire', aiConf: 95 },
    { user: 'Sara', type: 'smoke', lat: 32.3430, lng: 35.7520, days: 1, aiClass: 'smoke', aiConf: 82 },
    { user: 'Omar', type: 'logging', lat: 32.1010, lng: 35.8020, days: 1, aiClass: 'logging', aiConf: 64 },
    { user: 'Layla', type: 'fire', lat: 32.3405, lng: 35.7515, days: 0, aiClass: 'fire', aiConf: 96 },
    { user: 'Khaled', type: 'fire', lat: 32.3425, lng: 35.7540, days: 0, aiClass: 'fire', aiConf: 94 },
  ];

  const insertReport = db.prepare(`
    INSERT INTO reports (telegram_user_id, username, latitude, longitude, report_type, status, ai_classification, ai_confidence, points_awarded, created_at)
    VALUES (?, ?, ?, ?, ?, 'verified', ?, ?, 10, datetime('now', ?))
  `);

  for (const r of reports) {
    const offset = `-${r.days * 24 + Math.floor(Math.random() * 18)} hours`;
    insertReport.run(String(Math.floor(Math.random() * 900000 + 100000)), r.user, r.lat, r.lng, r.type, r.aiClass, r.aiConf, offset);
  }
  console.log(`  📝 Inserted ${reports.length} community reports`);

  // --- 3. Alerts (10 alerts with varying levels) ---
  const alerts = [
    { level: 'MEDIUM', type: 'cross_validated', lat: 32.3380, lng: 35.7520, msg: '🟠 تنبيه متوسط — 2 مصادر مؤكدة بالقرب من غابة عجلون (0.5 كم) — ثقة: 55%', sources: 'FIRMS,COMMUNITY', confidence: 55, days: 7, resolved: 1 },
    { level: 'HIGH', type: 'cross_validated', lat: 30.6540, lng: 35.6190, msg: '🔴 تنبيه عالي — 3 مصادر مؤكدة بالقرب من محمية دانا (0.8 كم) — ثقة: 78%', sources: 'FIRMS,COMMUNITY,WEATHER_RISK', confidence: 78, days: 6, resolved: 1 },
    { level: 'MEDIUM', type: 'fire_risk', lat: 32.1000, lng: 35.8000, msg: '🌡️ خطر حريق عالي في غابة الزي — مؤشر FWI: 72/100 [VERY_HIGH]', sources: 'WEATHER', confidence: 72, days: 5, resolved: 1 },
    { level: 'CRITICAL', type: 'cross_validated', lat: 31.4700, lng: 35.6380, msg: '🚨 تنبيه حرج — 4 مصادر مؤكدة بالقرب من محمية الموجب (0.3 كم) — ثقة: 95%', sources: 'FIRMS,COMMUNITY,WEATHER_RISK,AI_VISION', confidence: 95, days: 4, resolved: 1 },
    { level: 'HIGH', type: 'cross_validated', lat: 32.4680, lng: 35.7350, msg: '🔴 تنبيه عالي — 2 مصادر مؤكدة بالقرب من غابة برقش (0.4 كم) — ثقة: 68%', sources: 'FIRMS,COMMUNITY', confidence: 68, days: 3, resolved: 1 },
    { level: 'CRITICAL', type: 'cross_validated', lat: 31.4690, lng: 35.6370, msg: '🚨 تنبيه حرج — 3 مصادر مؤكدة بالقرب من محمية الموجب (0.2 كم) — ثقة: 88%', sources: 'FIRMS,WEATHER_RISK,AI_VISION', confidence: 88, days: 3, resolved: 0 },
    { level: 'MEDIUM', type: 'fire_risk', lat: 32.2850, lng: 35.8200, msg: '🌡️ خطر حريق عالي في غابة دبين — مؤشر FWI: 65/100 [VERY_HIGH]', sources: 'WEATHER', confidence: 65, days: 2, resolved: 0 },
    { level: 'HIGH', type: 'cross_validated', lat: 32.3400, lng: 35.7510, msg: '🔴 تنبيه عالي — 3 مصادر مؤكدة بالقرب من غابة عجلون (0.2 كم) — ثقة: 82%', sources: 'FIRMS,COMMUNITY,AI_VISION', confidence: 82, days: 1, resolved: 0 },
    { level: 'CRITICAL', type: 'cross_validated', lat: 32.3420, lng: 35.7530, msg: '🚨 تنبيه حرج — 4 مصادر مؤكدة بالقرب من غابة عجلون (0.1 كم) — ثقة: 96%', sources: 'FIRMS,COMMUNITY,WEATHER_RISK,AI_VISION', confidence: 96, days: 0, resolved: 0 },
    { level: 'HIGH', type: 'cross_validated', lat: 32.3390, lng: 35.7480, msg: '🔴 تنبيه عالي — 2 مصادر مؤكدة بالقرب من غابة عجلون (0.6 كم) — ثقة: 74%', sources: 'FIRMS,COMMUNITY', confidence: 74, days: 0, resolved: 0 },
  ];

  const insertAlert = db.prepare(`
    INSERT INTO alerts (level, type, latitude, longitude, message, sources, confidence, resolved, resolved_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  for (const a of alerts) {
    const offset = `-${a.days * 24 + Math.floor(Math.random() * 12)} hours`;
    const resolvedAt = a.resolved ? new Date(now.getTime() - (a.days - 1) * 86400000).toISOString().replace('T', ' ').slice(0, 19) : null;
    insertAlert.run(a.level, a.type, a.lat, a.lng, a.msg, a.sources, a.confidence, a.resolved, resolvedAt, offset);
  }
  console.log(`  🚨 Inserted ${alerts.length} alerts`);

  // --- 4. Fire Risk for all 8 forests (across 7 days, daily) ---
  const insertRisk = db.prepare(`
    INSERT INTO fire_risk (region, latitude, longitude, temperature, humidity, wind_speed, rain_1h, risk_score, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  let riskCount = 0;
  for (let day = 7; day >= 0; day--) {
    for (const forest of JORDAN_FORESTS) {
      // Simulate escalating risk toward day 0 with some noise
      const baseRisk = 25 + (7 - day) * 6; // rises from ~25 to ~67 over 7 days
      const noise = Math.random() * 20 - 10;
      // Ajloun gets hotter (narrative: the active fire zone)
      const boost = forest.name.includes('Ajloun') ? 15 : forest.name.includes('Mujib') ? 10 : 0;
      const risk = Math.min(100, Math.max(5, Math.round(baseRisk + noise + boost)));

      const temp = 28 + (risk / 100) * 14 + Math.random() * 3; // ~28-45°C
      const humidity = 60 - (risk / 100) * 40 + Math.random() * 5; // ~20-60%
      const windSpeed = 5 + (risk / 100) * 30 + Math.random() * 5;
      const rain = risk < 30 ? Math.random() * 3 : 0;

      const offset = `-${day * 24} hours`;
      insertRisk.run(forest.name, forest.lat, forest.lng, temp, humidity, windSpeed, rain, risk, offset);
      riskCount++;
    }
  }
  console.log(`  🌡️ Inserted ${riskCount} fire risk records`);

  // --- 5. Rangers (3 demo rangers) ---
  const insertRanger = db.prepare(`
    INSERT OR IGNORE INTO rangers (telegram_chat_id, name, region, active) VALUES (?, ?, ?, 1)
  `);
  insertRanger.run('100001', 'Ranger Ahmad', 'Ajloun');
  insertRanger.run('100002', 'Ranger Sara', 'Dana');
  insertRanger.run('100003', 'Ranger Omar', 'Mujib');
  console.log('  🛡️ Inserted 3 demo rangers');

  console.log('🌱 Seed data loaded successfully!');
}
