import { getDistanceKm } from '../utils/geo.js';
import {
  COUNTRY_BOUNDS,
  getActiveFirmsRegions,
  getActiveForests,
  isCountryActive,
} from '../data/forests.js';

// Convert FIRMS text confidence to numeric (0-100)
function firmsConfidenceToNumber(conf) {
  if (conf === 'high' || conf === 'h') return 90;
  if (conf === 'nominal' || conf === 'n') return 70;
  if (conf === 'low' || conf === 'l') return 40;
  const num = parseInt(conf);
  return isNaN(num) ? 70 : num;
}

// Legacy alias — keeps old imports working during transition
export const JORDAN_FORESTS = getActiveForests().filter(f => f.country === 'JO').map(f => ({
  name: `${f.nameAr} - ${f.name}`,
  lat: f.lat,
  lng: f.lng,
  radius: f.radius,
}));

export async function fetchFIRMSData(db, broadcast) {
  const apiKey = process.env.NASA_FIRMS_API_KEY;

  if (!apiKey || apiKey === 'your_nasa_firms_key_here') {
    console.log('⚠️ NASA FIRMS API key not set - using demo data');
    return insertDemoFireData(db, broadcast);
  }

  const allHotspots = [];
  const activeFirmsRegions = getActiveFirmsRegions();

  // Query FIRMS per regional group to respect rate limits
  for (const [regionName, region] of Object.entries(activeFirmsRegions)) {
    try {
      const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/VIIRS_SNPP_NRT/${region.west},${region.south},${region.east},${region.north}/1`;

      const response = await fetch(url);

      if (!response.ok) {
        console.error(`FIRMS API error for ${regionName}: ${response.status}`);
        continue;
      }

      const csvText = await response.text();
      const lines = csvText.trim().split('\n');

      if (lines.length <= 1) {
        console.log(`📡 No active fires detected in ${regionName}`);
        continue;
      }

      const headers = lines[0].split(',');

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {};
        headers.forEach((h, idx) => (row[h.trim()] = values[idx]?.trim()));

        const lat = parseFloat(row.latitude);
        const lng = parseFloat(row.longitude);

        // Determine which country this hotspot belongs to
        let country = null;
        for (const cc of region.countries) {
          const b = COUNTRY_BOUNDS[cc];
          if (b && lat >= b.south && lat <= b.north && lng >= b.west && lng <= b.east) {
            country = cc;
            break;
          }
        }

        // Deduplicate: skip if near-identical coordinates exist within 24h
        const existingHotspot = db.prepare(`
          SELECT id FROM fire_hotspots
          WHERE ABS(latitude - ?) < 0.001 AND ABS(longitude - ?) < 0.001
          AND created_at > datetime('now', '-24 hours')
        `).get(lat, lng);
        if (existingHotspot) continue;

        const hotspot = {
          latitude: lat,
          longitude: lng,
          brightness: parseFloat(row.bright_ti4 || row.brightness || 0),
          confidence: row.confidence || 'nominal',
          confidenceNum: firmsConfidenceToNumber(row.confidence),
          acq_date: row.acq_date,
          acq_time: row.acq_time,
          satellite: row.satellite || 'VIIRS',
          country,
        };

        db.prepare(`
          INSERT INTO fire_hotspots (latitude, longitude, brightness, confidence, acq_date, acq_time, satellite, country)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(hotspot.latitude, hotspot.longitude, hotspot.brightness, hotspot.confidence, hotspot.acq_date, hotspot.acq_time, hotspot.satellite, hotspot.country);

        allHotspots.push(hotspot);
      }

      console.log(`🔥 Found ${lines.length - 1} fire hotspots in ${regionName}`);

      // Rate limit: 1 second pause between region queries
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      console.error(`FIRMS fetch error for ${regionName}:`, err.message);
    }
  }

  if (allHotspots.length === 0) {
    console.log('📡 ✅ No active fires detected across all monitored regions — forests are safe!');
    broadcast({ type: 'FIRE_UPDATE', data: [] });
    return [];
  }

  // Broadcast to dashboard
  broadcast({ type: 'FIRE_UPDATE', data: allHotspots });

  // Check if any hotspot is near a monitored forest
  for (const hotspot of allHotspots) {
    checkForestProximity(hotspot, db, broadcast);
  }

  console.log(`🔥 Total: ${allHotspots.length} fire hotspots across ${Object.keys(activeFirmsRegions).length} regions`);
  return allHotspots;
}

function checkForestProximity(hotspot, db, broadcast) {
  for (const forest of getActiveForests()) {
    const distance = getDistanceKm(hotspot.latitude, hotspot.longitude, forest.lat, forest.lng);
    if (distance <= forest.radius) {
      // Dedup: skip if an alert for this forest already exists within 6 hours
      const existingAlert = db.prepare(`
        SELECT id FROM alerts
        WHERE type = 'fire' AND country = ?
        AND message LIKE ? AND created_at > datetime('now', '-6 hours')
      `).get(forest.country, `%${forest.name}%`);
      if (existingAlert) continue;

      const confNum = hotspot.confidenceNum || firmsConfidenceToNumber(hotspot.confidence);
      const alert = {
        level: confNum >= 85 ? 'CRITICAL' : 'HIGH',
        type: 'fire',
        latitude: hotspot.latitude,
        longitude: hotspot.longitude,
        message: `🔥 حريق مكتشف بالقرب من ${forest.nameAr} / ${forest.name} (${distance.toFixed(1)} كم)`,
        sources: 'FIRMS',
        confidence: confNum,
        country: forest.country,
      };

      db.prepare(`
        INSERT INTO alerts (level, type, latitude, longitude, message, sources, confidence, country)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(alert.level, alert.type, alert.latitude, alert.longitude, alert.message, alert.sources, alert.confidence, alert.country);

      broadcast({ type: 'NEW_ALERT', data: alert });
      console.log(`🚨 ALERT: ${alert.message}`);
    }
  }
}

function insertDemoFireData(db, broadcast) {
  // Demo data — sample hotspots from multiple regions
  const demoHotspots = [
    { latitude: 32.34,   longitude: 35.75,   brightness: 330, confidence: 'nominal', country: 'JO', acq_date: new Date().toISOString().split('T')[0], acq_time: '1200', satellite: 'DEMO' },
    { latitude: 30.65,   longitude: 35.62,   brightness: 310, confidence: 'low',     country: 'JO', acq_date: new Date().toISOString().split('T')[0], acq_time: '1200', satellite: 'DEMO' },
    { latitude: 34.25,   longitude: 36.06,   brightness: 322, confidence: 'nominal', country: 'LB', acq_date: new Date().toISOString().split('T')[0], acq_time: '1200', satellite: 'DEMO' },
    { latitude: 33.53,   longitude: -5.12,   brightness: 315, confidence: 'nominal', country: 'MA', acq_date: new Date().toISOString().split('T')[0], acq_time: '1200', satellite: 'DEMO' },
    { latitude: 36.73,   longitude: 44.88,   brightness: 340, confidence: 'high',    country: 'IQ', acq_date: new Date().toISOString().split('T')[0], acq_time: '1200', satellite: 'DEMO' },
  ];
  const activeDemoHotspots = demoHotspots.filter(hotspot => isCountryActive(hotspot.country));

  for (const h of activeDemoHotspots) {
    db.prepare(`
      INSERT INTO fire_hotspots (latitude, longitude, brightness, confidence, acq_date, acq_time, satellite, source, country)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'DEMO', ?)
    `).run(h.latitude, h.longitude, h.brightness, h.confidence, h.acq_date, h.acq_time, h.satellite, h.country);
  }

  broadcast({ type: 'FIRE_UPDATE', data: activeDemoHotspots });
  console.log(`📡 Loaded demo fire data (${activeDemoHotspots.length} active hotspots)`);
  return activeDemoHotspots;
}
