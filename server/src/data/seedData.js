// Seed Data — 7 days of realistic historical data for ForestGuard AI
// Multi-region: Jordan, Lebanon, Morocco, Iraq, Tunisia, Algeria, Egypt
// Pre-loads the database with believable fire activity to impress judges

import { getActiveForests, getAllCountries, isCountryActive } from './forests.js';

export function seedDatabase(db) {
  const now = new Date();
  const activeForests = getActiveForests();
  const activeCountries = getAllCountries().map(country => country.code);
  const scopeLabel = activeCountries.join(', ');

  console.log(`🌱 Seeding database with 7 days of historical data for active scope: ${scopeLabel}`);

  // Clear existing data to prevent duplicates on re-seed
  db.exec(`
    DELETE FROM fire_hotspots;
    DELETE FROM reports;
    DELETE FROM alerts;
    DELETE FROM fire_risk;
    DELETE FROM rangers;
    DELETE FROM solar_irradiance;
  `);

  // --- 1. Fire Hotspots (40+ hotspots over 7 days, multi-region) ---
  const hotspots = [
    // Jordan — Ajloun cluster (escalating toward day 0)
    { lat: 32.3380, lng: 35.7520, brightness: 312, confidence: 78, satellite: 'VIIRS', daysAgo: 7, country: 'JO' },
    { lat: 32.3410, lng: 35.7490, brightness: 298, confidence: 65, satellite: 'VIIRS', daysAgo: 7, country: 'JO' },
    { lat: 30.6550, lng: 35.6200, brightness: 335, confidence: 85, satellite: 'MODIS', daysAgo: 6, country: 'JO' },
    { lat: 30.6480, lng: 35.6150, brightness: 322, confidence: 72, satellite: 'VIIRS', daysAgo: 6, country: 'JO' },
    { lat: 31.4700, lng: 35.6380, brightness: 355, confidence: 92, satellite: 'VIIRS', daysAgo: 4, country: 'JO' },
    { lat: 31.4720, lng: 35.6350, brightness: 348, confidence: 89, satellite: 'VIIRS', daysAgo: 4, country: 'JO' },
    { lat: 32.3400, lng: 35.7510, brightness: 365, confidence: 95, satellite: 'VIIRS', daysAgo: 1, country: 'JO' },
    { lat: 32.3420, lng: 35.7530, brightness: 370, confidence: 96, satellite: 'MODIS', daysAgo: 1, country: 'JO' },
    { lat: 32.3415, lng: 35.7505, brightness: 375, confidence: 97, satellite: 'VIIRS', daysAgo: 0, country: 'JO' },
    // Lebanon — Shouf Biosphere & Cedars of God
    { lat: 33.6700, lng: 35.6850, brightness: 318, confidence: 80, satellite: 'VIIRS', daysAgo: 5, country: 'LB' },
    { lat: 33.6680, lng: 35.6820, brightness: 326, confidence: 83, satellite: 'MODIS', daysAgo: 5, country: 'LB' },
    { lat: 34.2470, lng: 36.0640, brightness: 305, confidence: 71, satellite: 'VIIRS', daysAgo: 3, country: 'LB' },
    { lat: 33.6720, lng: 35.6870, brightness: 342, confidence: 88, satellite: 'VIIRS', daysAgo: 2, country: 'LB' },
    { lat: 34.2480, lng: 36.0650, brightness: 350, confidence: 91, satellite: 'MODIS', daysAgo: 1, country: 'LB' },
    // Morocco — Ifrane & Rif
    { lat: 33.5300, lng: -5.1100, brightness: 310, confidence: 76, satellite: 'VIIRS', daysAgo: 6, country: 'MA' },
    { lat: 35.0400, lng: -4.5500, brightness: 328, confidence: 82, satellite: 'MODIS', daysAgo: 4, country: 'MA' },
    { lat: 33.5350, lng: -5.1050, brightness: 345, confidence: 90, satellite: 'VIIRS', daysAgo: 3, country: 'MA' },
    { lat: 33.5320, lng: -5.1080, brightness: 358, confidence: 93, satellite: 'VIIRS', daysAgo: 1, country: 'MA' },
    { lat: 35.0420, lng: -4.5520, brightness: 340, confidence: 87, satellite: 'MODIS', daysAgo: 0, country: 'MA' },
    // Iraq — Kurdistan Halgurd-Sakran
    { lat: 36.7350, lng: 44.8750, brightness: 320, confidence: 79, satellite: 'VIIRS', daysAgo: 5, country: 'IQ' },
    { lat: 36.7380, lng: 44.8770, brightness: 338, confidence: 86, satellite: 'MODIS', daysAgo: 3, country: 'IQ' },
    { lat: 36.7400, lng: 44.8800, brightness: 355, confidence: 92, satellite: 'VIIRS', daysAgo: 1, country: 'IQ' },
    { lat: 36.7370, lng: 44.8760, brightness: 362, confidence: 94, satellite: 'VIIRS', daysAgo: 0, country: 'IQ' },
    // Tunisia — Kroumirie
    { lat: 36.7800, lng: 8.6500, brightness: 302, confidence: 68, satellite: 'VIIRS', daysAgo: 6, country: 'TN' },
    { lat: 36.7820, lng: 8.6520, brightness: 315, confidence: 74, satellite: 'MODIS', daysAgo: 4, country: 'TN' },
    { lat: 36.7850, lng: 8.6550, brightness: 332, confidence: 84, satellite: 'VIIRS', daysAgo: 2, country: 'TN' },
    // Algeria — Djurdjura
    { lat: 36.4500, lng: 4.0800, brightness: 308, confidence: 73, satellite: 'VIIRS', daysAgo: 5, country: 'DZ' },
    { lat: 36.4520, lng: 4.0830, brightness: 325, confidence: 81, satellite: 'MODIS', daysAgo: 3, country: 'DZ' },
    { lat: 36.4540, lng: 4.0850, brightness: 348, confidence: 90, satellite: 'VIIRS', daysAgo: 1, country: 'DZ' },
    // Egypt — Sinai
    { lat: 28.5500, lng: 33.9700, brightness: 295, confidence: 62, satellite: 'VIIRS', daysAgo: 4, country: 'EG' },
    { lat: 28.5520, lng: 33.9720, brightness: 310, confidence: 70, satellite: 'MODIS', daysAgo: 2, country: 'EG' },
    // Saudi Arabia — Asir
    { lat: 18.2500, lng: 42.5000, brightness: 305, confidence: 69, satellite: 'VIIRS', daysAgo: 3, country: 'SA' },
    { lat: 18.2520, lng: 42.5020, brightness: 320, confidence: 78, satellite: 'MODIS', daysAgo: 1, country: 'SA' },
  ];

  const insertHotspot = db.prepare(`
    INSERT INTO fire_hotspots (latitude, longitude, brightness, confidence, satellite, source, country, created_at)
    VALUES (?, ?, ?, ?, ?, 'FIRMS', ?, datetime('now', ?))
  `);

  const activeHotspots = hotspots.filter(h => isCountryActive(h.country));
  for (const h of activeHotspots) {
    const offset = `-${h.daysAgo * 24 + Math.floor(Math.random() * 12)} hours`;
    insertHotspot.run(h.lat, h.lng, h.brightness, h.confidence, h.satellite, h.country, offset);
  }
  console.log(`  🔥 Inserted ${activeHotspots.length} fire hotspots (${scopeLabel})`);

  // --- 2. Community Reports (25 reports from diverse reporters) ---
  const reports = [
    // Jordan
    { user: 'Ahmad',    type: 'fire',   lat: 32.3370, lng: 35.7510, days: 7, aiClass: 'fire',    aiConf: 87, country: 'JO' },
    { user: 'Sara',     type: 'smoke',  lat: 30.6540, lng: 35.6190, days: 6, aiClass: 'smoke',   aiConf: 72, country: 'JO' },
    { user: 'Layla',    type: 'fire',   lat: 31.4710, lng: 35.6360, days: 4, aiClass: 'fire',    aiConf: 91, country: 'JO' },
    { user: 'Tariq',    type: 'fire',   lat: 32.3410, lng: 35.7500, days: 2, aiClass: 'fire',    aiConf: 93, country: 'JO' },
    { user: 'Ahmad',    type: 'fire',   lat: 32.3395, lng: 35.7490, days: 1, aiClass: 'fire',    aiConf: 95, country: 'JO' },
    { user: 'Khaled',   type: 'fire',   lat: 32.3425, lng: 35.7540, days: 0, aiClass: 'fire',    aiConf: 94, country: 'JO' },
    // Lebanon
    { user: 'Charbel',  type: 'fire',   lat: 33.6690, lng: 35.6840, days: 5, aiClass: 'fire',    aiConf: 82, country: 'LB' },
    { user: 'Nadia',    type: 'smoke',  lat: 34.2475, lng: 36.0645, days: 3, aiClass: 'smoke',   aiConf: 76, country: 'LB' },
    { user: 'Hassan',   type: 'fire',   lat: 33.6710, lng: 35.6860, days: 2, aiClass: 'fire',    aiConf: 88, country: 'LB' },
    { user: 'Reem',     type: 'fire',   lat: 34.2485, lng: 36.0655, days: 1, aiClass: 'fire',    aiConf: 90, country: 'LB' },
    // Morocco
    { user: 'Youssef',  type: 'fire',   lat: 33.5310, lng: -5.1090, days: 6, aiClass: 'fire',    aiConf: 79, country: 'MA' },
    { user: 'Fatima',   type: 'smoke',  lat: 35.0410, lng: -4.5510, days: 4, aiClass: 'smoke',   aiConf: 71, country: 'MA' },
    { user: 'Amine',    type: 'fire',   lat: 33.5340, lng: -5.1060, days: 1, aiClass: 'fire',    aiConf: 92, country: 'MA' },
    // Iraq
    { user: 'Dilshad',  type: 'fire',   lat: 36.7360, lng: 44.8760, days: 5, aiClass: 'fire',    aiConf: 80, country: 'IQ' },
    { user: 'Shilan',   type: 'smoke',  lat: 36.7390, lng: 44.8780, days: 3, aiClass: 'smoke',   aiConf: 74, country: 'IQ' },
    { user: 'Karwan',   type: 'fire',   lat: 36.7405, lng: 44.8805, days: 0, aiClass: 'fire',    aiConf: 93, country: 'IQ' },
    // Tunisia
    { user: 'Anis',     type: 'fire',   lat: 36.7810, lng: 8.6510, days: 6, aiClass: 'fire',    aiConf: 70, country: 'TN' },
    { user: 'Meriem',   type: 'smoke',  lat: 36.7830, lng: 8.6530, days: 2, aiClass: 'smoke',   aiConf: 77, country: 'TN' },
    // Algeria
    { user: 'Karim',    type: 'fire',   lat: 36.4510, lng: 4.0820, days: 5, aiClass: 'fire',    aiConf: 75, country: 'DZ' },
    { user: 'Amira',    type: 'fire',   lat: 36.4530, lng: 4.0840, days: 1, aiClass: 'fire',    aiConf: 89, country: 'DZ' },
    // Egypt
    { user: 'Mostafa',  type: 'smoke',  lat: 28.5510, lng: 33.9710, days: 4, aiClass: 'smoke',   aiConf: 65, country: 'EG' },
    // Saudi Arabia
    { user: 'Abdullah', type: 'fire',   lat: 18.2510, lng: 42.5010, days: 3, aiClass: 'fire',    aiConf: 73, country: 'SA' },
    // Wildlife & other
    { user: 'Omar',     type: 'logging', lat: 32.4690, lng: 35.7340, days: 5, aiClass: 'logging', aiConf: 68, country: 'JO' },
    { user: 'Faisal',   type: 'pollution', lat: 31.8340, lng: 36.8190, days: 3, aiClass: 'none', aiConf: 12, country: 'JO' },
    { user: 'Dina',     type: 'wildlife', lat: 30.6530, lng: 35.6200, days: 2, aiClass: 'none',  aiConf: 8,  country: 'JO' },
  ];

  const insertReport = db.prepare(`
    INSERT INTO reports (telegram_user_id, username, latitude, longitude, country, report_type, status, ai_classification, ai_confidence, points_awarded, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'verified', ?, ?, 10, datetime('now', ?))
  `);

  const activeReports = reports.filter(r => isCountryActive(r.country));
  for (const r of activeReports) {
    const offset = `-${r.days * 24 + Math.floor(Math.random() * 18)} hours`;
    insertReport.run(String(Math.floor(Math.random() * 900000 + 100000)), r.user, r.lat, r.lng, r.country, r.type, r.aiClass, r.aiConf, offset);
  }
  console.log(`  📝 Inserted ${activeReports.length} community reports (${scopeLabel})`);

  // --- 3. Alerts (15 alerts with varying levels, multi-region) ---
  const alerts = [
    // Jordan
    { level: 'MEDIUM',   type: 'cross_validated', lat: 32.3380, lng: 35.7520, msg: '🟠 تنبيه متوسط — 2 مصادر مؤكدة بالقرب من غابة عجلون / Ajloun Forest (0.5 كم) — ثقة: 55%', sources: 'FIRMS,COMMUNITY', confidence: 55, days: 7, resolved: 1, country: 'JO' },
    { level: 'CRITICAL', type: 'cross_validated', lat: 31.4700, lng: 35.6380, msg: '🚨 تنبيه حرج — 4 مصادر مؤكدة بالقرب من محمية الموجب / Mujib Reserve (0.3 كم) — ثقة: 95%', sources: 'FIRMS,COMMUNITY,WEATHER_RISK,AI_VISION', confidence: 95, days: 4, resolved: 1, country: 'JO' },
    { level: 'CRITICAL', type: 'cross_validated', lat: 32.3420, lng: 35.7530, msg: '🚨 تنبيه حرج — 4 مصادر مؤكدة بالقرب من غابة عجلون / Ajloun Forest (0.1 كم) — ثقة: 96%', sources: 'FIRMS,COMMUNITY,WEATHER_RISK,AI_VISION', confidence: 96, days: 0, resolved: 0, country: 'JO' },
    { level: 'HIGH',     type: 'cross_validated', lat: 32.3390, lng: 35.7480, msg: '🔴 تنبيه عالي — 2 مصادر مؤكدة بالقرب من غابة عجلون / Ajloun Forest (0.6 كم) — ثقة: 74%', sources: 'FIRMS,COMMUNITY', confidence: 74, days: 0, resolved: 0, country: 'JO' },
    // Lebanon
    { level: 'HIGH',     type: 'cross_validated', lat: 33.6700, lng: 35.6850, msg: '🔴 تنبيه عالي — 3 مصادر مؤكدة بالقرب من محمية أرز الشوف / Shouf Biosphere (0.4 كم) — ثقة: 79%', sources: 'FIRMS,COMMUNITY,WEATHER_RISK', confidence: 79, days: 5, resolved: 1, country: 'LB' },
    { level: 'CRITICAL', type: 'cross_validated', lat: 34.2480, lng: 36.0650, msg: '🚨 تنبيه حرج — 3 مصادر مؤكدة بالقرب من أرز الرب / Cedars of God (0.2 كم) — ثقة: 88%', sources: 'FIRMS,COMMUNITY,AI_VISION', confidence: 88, days: 1, resolved: 0, country: 'LB' },
    // Morocco
    { level: 'HIGH',     type: 'cross_validated', lat: 33.5350, lng: -5.1050, msg: '🔴 تنبيه عالي — 3 مصادر مؤكدة بالقرب من غابة إفران / Ifrane Forest (0.3 كم) — ثقة: 81%', sources: 'FIRMS,COMMUNITY,WEATHER_RISK', confidence: 81, days: 3, resolved: 1, country: 'MA' },
    { level: 'HIGH',     type: 'cross_validated', lat: 33.5320, lng: -5.1080, msg: '🔴 تنبيه عالي — 2 مصادر مؤكدة بالقرب من غابة إفران / Ifrane Forest (0.5 كم) — ثقة: 72%', sources: 'FIRMS,COMMUNITY', confidence: 72, days: 1, resolved: 0, country: 'MA' },
    // Iraq
    { level: 'MEDIUM',   type: 'cross_validated', lat: 36.7350, lng: 44.8750, msg: '🟠 تنبيه متوسط — 2 مصادر مؤكدة بالقرب من جبل هلكورد / Halgurd-Sakran (0.8 كم) — ثقة: 58%', sources: 'FIRMS,COMMUNITY', confidence: 58, days: 5, resolved: 1, country: 'IQ' },
    { level: 'CRITICAL', type: 'cross_validated', lat: 36.7400, lng: 44.8800, msg: '🚨 تنبيه حرج — 3 مصادر مؤكدة بالقرب من جبل هلكورد / Halgurd-Sakran (0.2 كم) — ثقة: 90%', sources: 'FIRMS,COMMUNITY,WEATHER_RISK', confidence: 90, days: 0, resolved: 0, country: 'IQ' },
    // Tunisia
    { level: 'MEDIUM',   type: 'cross_validated', lat: 36.7820, lng: 8.6520, msg: '🟠 تنبيه متوسط — 2 مصادر مؤكدة بالقرب من غابات خمير / Kroumirie Forests (0.6 كم) — ثقة: 55%', sources: 'FIRMS,COMMUNITY', confidence: 55, days: 4, resolved: 1, country: 'TN' },
    // Algeria
    { level: 'HIGH',     type: 'cross_validated', lat: 36.4540, lng: 4.0850, msg: '🔴 تنبيه عالي — 3 مصادر مؤكدة بالقرب من حظيرة جرجرة / Djurdjura NP (0.3 كم) — ثقة: 78%', sources: 'FIRMS,COMMUNITY,AI_VISION', confidence: 78, days: 1, resolved: 0, country: 'DZ' },
    // Weather-based
    { level: 'MEDIUM',   type: 'fire_risk', lat: 32.2850, lng: 35.8200, msg: '🌡️ خطر حريق عالي في غابة دبين — مؤشر FWI: 65/100 [VERY_HIGH]', sources: 'WEATHER', confidence: 65, days: 2, resolved: 0, country: 'JO' },
    { level: 'MEDIUM',   type: 'fire_risk', lat: 33.5300, lng: -5.1100, msg: '🌡️ خطر حريق عالي في غابة إفران — مؤشر FWI: 70/100 [VERY_HIGH]', sources: 'WEATHER', confidence: 70, days: 2, resolved: 0, country: 'MA' },
    { level: 'HIGH',     type: 'fire_risk', lat: 36.4500, lng: 4.0800, msg: '🌡️ خطر حريق شديد في جرجرة — مؤشر FWI: 82/100 [EXTREME]', sources: 'WEATHER', confidence: 82, days: 1, resolved: 0, country: 'DZ' },
  ];

  const insertAlert = db.prepare(`
    INSERT INTO alerts (level, type, latitude, longitude, country, message, sources, confidence, resolved, resolved_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const activeAlerts = alerts.filter(a => isCountryActive(a.country));
  for (const a of activeAlerts) {
    const offset = `-${a.days * 24 + Math.floor(Math.random() * 12)} hours`;
    const resolvedAt = a.resolved ? new Date(now.getTime() - (a.days - 1) * 86400000).toISOString().replace('T', ' ').slice(0, 19) : null;
    insertAlert.run(a.level, a.type, a.lat, a.lng, a.country, a.msg, a.sources, a.confidence, a.resolved, resolvedAt, offset);
  }
  console.log(`  🚨 Inserted ${activeAlerts.length} alerts (${scopeLabel})`);

  // --- 4. Fire Risk for all forests (across 7 days, daily) ---
  // We insert data for ALL 60 forests so the dashboard has rich data
  // Climate-realistic rain probability ranges by forest biome (March, MENA region)
  const BIOME_RAIN = {
    'Mediterranean':        { minPop: 25, maxPop: 55, rainChance: 0.40 },
    'Cedar montane':        { minPop: 30, maxPop: 60, rainChance: 0.45 },
    'Cedar-oak mixed':      { minPop: 30, maxPop: 60, rainChance: 0.45 },
    'Cedar-fir mixed':      { minPop: 30, maxPop: 60, rainChance: 0.45 },
    'Atlas cedar':          { minPop: 25, maxPop: 55, rainChance: 0.40 },
    'Atlas cedar-pine':     { minPop: 25, maxPop: 55, rainChance: 0.40 },
    'Mountain oak':         { minPop: 20, maxPop: 50, rainChance: 0.35 },
    'Oak woodland':         { minPop: 20, maxPop: 45, rainChance: 0.30 },
    'Cork oak':             { minPop: 25, maxPop: 55, rainChance: 0.40 },
    'Cork oak wetland':     { minPop: 35, maxPop: 65, rainChance: 0.50 },
    'Mediterranean oak':    { minPop: 25, maxPop: 50, rainChance: 0.35 },
    'Mediterranean maquis': { minPop: 20, maxPop: 45, rainChance: 0.30 },
    'Juniper woodland':     { minPop: 10, maxPop: 30, rainChance: 0.20 },
    'Juniper highland':     { minPop: 10, maxPop: 30, rainChance: 0.20 },
    'Juniper-acacia':       { minPop: 8,  maxPop: 25, rainChance: 0.15 },
    'Juniper relict':       { minPop: 10, maxPop: 30, rainChance: 0.20 },
    'Juniper-boxwood':      { minPop: 12, maxPop: 35, rainChance: 0.25 },
    'Fir-cedar mixed':      { minPop: 30, maxPop: 60, rainChance: 0.45 },
    'High Atlas juniper':   { minPop: 10, maxPop: 30, rainChance: 0.20 },
    'Argan woodland':       { minPop: 8,  maxPop: 25, rainChance: 0.15 },
    'Acacia savanna':       { minPop: 5,  maxPop: 20, rainChance: 0.10 },
    'Mangrove':             { minPop: 15, maxPop: 40, rainChance: 0.25 },
    'Mangrove coastal':     { minPop: 10, maxPop: 35, rainChance: 0.20 },
    'Wetland':              { minPop: 35, maxPop: 65, rainChance: 0.50 },
    'Wetland marsh':        { minPop: 30, maxPop: 60, rainChance: 0.45 },
    'Wetland savanna':      { minPop: 25, maxPop: 55, rainChance: 0.40 },
    'Coastal wetland':      { minPop: 25, maxPop: 55, rainChance: 0.40 },
    'Palm oasis':           { minPop: 3,  maxPop: 15, rainChance: 0.08 },
    'Desert oasis':         { minPop: 2,  maxPop: 12, rainChance: 0.05 },
    'Mountain desert':      { minPop: 5,  maxPop: 20, rainChance: 0.10 },
    'Semi-arid scrub':      { minPop: 5,  maxPop: 20, rainChance: 0.10 },
    'Rift valley':          { minPop: 15, maxPop: 40, rainChance: 0.25 },
    'Mixed arid':           { minPop: 10, maxPop: 30, rainChance: 0.15 },
    'Terraced olive':       { minPop: 25, maxPop: 50, rainChance: 0.35 },
    'Terraced highland':    { minPop: 20, maxPop: 45, rainChance: 0.30 },
    'Mountain terrace':     { minPop: 15, maxPop: 40, rainChance: 0.25 },
    'Savanna woodland':     { minPop: 10, maxPop: 35, rainChance: 0.20 },
    'Volcanic highland':    { minPop: 15, maxPop: 40, rainChance: 0.25 },
    'Tropical cloud':       { minPop: 40, maxPop: 70, rainChance: 0.55 },
    'Dragon blood endemic': { minPop: 10, maxPop: 30, rainChance: 0.15 },
    'Riverine forest':      { minPop: 20, maxPop: 45, rainChance: 0.30 },
  };
  const DEFAULT_BIOME = { minPop: 15, maxPop: 40, rainChance: 0.25 };

  function classifyRainSeed(rainAmount, pop) {
    if (rainAmount === 0 && pop < 25) return 'NONE';
    if (rainAmount < 1 && pop < 40) return 'LIGHT';
    if (rainAmount < 3 || pop < 70) return 'MODERATE';
    return 'HEAVY';
  }

  const insertRisk = db.prepare(`
    INSERT INTO fire_risk (region, latitude, longitude, country, temperature, humidity, wind_speed, rain_1h, risk_score, rain_probability, rain_label, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  let riskCount = 0;
  for (let day = 7; day >= 0; day--) {
    for (const forest of activeForests) {
      // Simulate escalating risk toward day 0 with some noise
      const baseRisk = 25 + (7 - day) * 6;
      const noise = Math.random() * 20 - 10;

      // Narrative boost: active fire zones get higher risk
      let boost = 0;
      if (forest.id === 'jo-ajloun') boost = 15;
      else if (forest.id === 'jo-mujib') boost = 10;
      else if (forest.id === 'lb-cedars') boost = 12;
      else if (forest.id === 'ma-ifrane') boost = 10;
      else if (forest.id === 'iq-halgurd') boost = 11;
      else if (forest.id === 'dz-djurdjura') boost = 10;
      else if (forest.id === 'tn-kroumirie') boost = 8;

      // Climate adjustment: arid zones have naturally lower baseline
      if (forest.forestType === 'Wetland' || forest.forestType === 'Mangrove') boost -= 15;
      if (forest.forestType === 'Desert oasis') boost -= 10;

      const risk = Math.min(100, Math.max(5, Math.round(baseRisk + noise + boost)));
      const temp = 28 + (risk / 100) * 14 + Math.random() * 3;
      const humidity = 60 - (risk / 100) * 40 + Math.random() * 5;
      const windSpeed = 5 + (risk / 100) * 30 + Math.random() * 5;

      // Climate-realistic rain probability based on biome
      const biome = BIOME_RAIN[forest.forestType] || DEFAULT_BIOME;
      // Higher risk → less rain (inverse relationship, realistic)
      const riskFactor = 1 - (risk / 100) * 0.6; // 0.4–1.0
      const pop = Math.round((biome.minPop + Math.random() * (biome.maxPop - biome.minPop)) * riskFactor);
      const hasRain = Math.random() < biome.rainChance * riskFactor;
      const rain = hasRain ? +(Math.random() * 3).toFixed(1) : 0;
      const rainLabel = classifyRainSeed(rain, pop);

      const regionName = `${forest.nameAr} - ${forest.name}`;
      const offset = `-${day * 24} hours`;
      insertRisk.run(regionName, forest.lat, forest.lng, forest.country, temp, humidity, windSpeed, rain, risk, pop, rainLabel, offset);
      riskCount++;
    }
  }
  console.log(`  🌡️ Inserted ${riskCount} fire risk records (${activeForests.length} forests × 8 days) with climate-realistic rain`);

  // --- 5. Rangers (6 demo rangers across regions) ---
  const insertRanger = db.prepare(`
    INSERT OR IGNORE INTO rangers (telegram_chat_id, name, region, active) VALUES (?, ?, ?, 1)
  `);
  const rangers = [
    { chatId: '100001', name: 'Ranger Ahmad', region: 'Ajloun', country: 'JO' },
    { chatId: '100002', name: 'Ranger Sara', region: 'Dana', country: 'JO' },
    { chatId: '100003', name: 'Ranger Omar', region: 'Mujib', country: 'JO' },
    { chatId: '100004', name: 'Ranger Charbel', region: 'Shouf', country: 'LB' },
    { chatId: '100005', name: 'Ranger Youssef', region: 'Ifrane', country: 'MA' },
    { chatId: '100006', name: 'Ranger Dilshad', region: 'Halgurd', country: 'IQ' },
  ].filter(ranger => isCountryActive(ranger.country));

  for (const ranger of rangers) {
    insertRanger.run(ranger.chatId, ranger.name, ranger.region);
  }
  console.log(`  🛡️ Inserted ${rangers.length} demo rangers (${scopeLabel})`);

  // --- 6. Solar irradiance — demo readings for 8 Jordan sites ---
  const insertSolar = db.prepare(`
    INSERT INTO solar_irradiance
      (site_id, latitude, longitude, ghi_w_m2, dni_w_m2, dhi_w_m2,
       cloud_cover_pct, uv_index, sunshine_hours, potential_score, potential_label, country)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'JO')
  `);

  const solarSeeds = [
    // site_id, lat, lng, ghi, dni, dhi, cloud%, uv, sun_hrs, score, label
    ['wadi_rum',      29.5758, 35.4197, 780, 820, 120, 5,  9.2, 10.1, 94, 'EXCELLENT'],
    ['aqaba',         29.5321, 35.0063, 720, 760, 130, 8,  8.5,  9.8, 88, 'EXCELLENT'],
    ['maan',          30.1927, 35.7340, 700, 740, 140, 10, 8.0,  9.5, 87, 'EXCELLENT'],
    ['azraq',         31.8290, 36.8123, 640, 670, 150, 15, 7.5,  9.0, 76, 'GOOD'],
    ['amman',         31.9454, 35.9284, 580, 610, 160, 22, 6.8,  8.2, 68, 'GOOD'],
    ['jordan_valley', 32.0500, 35.5500, 610, 640, 145, 18, 7.1,  8.6, 65, 'GOOD'],
    ['irbid',         32.5567, 35.8500, 520, 540, 170, 30, 6.0,  7.5, 55, 'MODERATE'],
    ['ajloun',        32.3333, 35.7500, 490, 510, 175, 35, 5.5,  7.0, 50, 'MODERATE'],
  ];

  for (const row of solarSeeds) {
    insertSolar.run(...row);
  }
  console.log(`  ☀️ Inserted ${solarSeeds.length} solar irradiance readings (Shu'aa module)`);

  console.log('🌱 Seed data loaded successfully!');
}
