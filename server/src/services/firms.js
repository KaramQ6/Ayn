import { getDistanceKm } from '../utils/geo.js';

// Jordan bounding box
const JORDAN_BOUNDS = {
  west: 34.8,
  south: 29.0,
  east: 39.3,
  north: 33.5,
};

// Jordanian forest regions for monitoring
export const JORDAN_FORESTS = [
  { name: 'غابة عجلون - Ajloun Forest', lat: 32.3333, lng: 35.7500, radius: 15 },
  { name: 'غابة دبين - Dibeen Forest', lat: 32.2833, lng: 35.8167, radius: 10 },
  { name: 'محمية دانا - Dana Reserve', lat: 30.6500, lng: 35.6167, radius: 20 },
  { name: 'غابة الزي - Al-Zai Forest', lat: 32.1000, lng: 35.8000, radius: 5 },
  { name: 'غابة برقش - Barqash Forest', lat: 32.4667, lng: 35.7333, radius: 8 },
  { name: 'غابة اشتفينا - Ishtafina Forest', lat: 32.3500, lng: 35.7167, radius: 6 },
  { name: 'محمية الأزرق - Azraq Reserve', lat: 31.8333, lng: 36.8167, radius: 10 },
  { name: 'محمية الموجب - Mujib Reserve', lat: 31.4667, lng: 35.6333, radius: 15 },
];

export async function fetchFIRMSData(db, broadcast) {
  const apiKey = process.env.NASA_FIRMS_API_KEY;

  if (!apiKey || apiKey === 'your_nasa_firms_key_here') {
    console.log('⚠️ NASA FIRMS API key not set - using demo data');
    return insertDemoFireData(db, broadcast);
  }

  try {
    // Fetch VIIRS data for Jordan area (last 24 hours)
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/VIIRS_SNPP_NRT/${JORDAN_BOUNDS.west},${JORDAN_BOUNDS.south},${JORDAN_BOUNDS.east},${JORDAN_BOUNDS.north}/1`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`FIRMS API error: ${response.status}`);
    }

    const csvText = await response.text();
    const lines = csvText.trim().split('\n');

    if (lines.length <= 1) {
      console.log('📡 No active fires detected in Jordan');
      return [];
    }

    const headers = lines[0].split(',');
    const hotspots = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row = {};
      headers.forEach((h, idx) => (row[h.trim()] = values[idx]?.trim()));

      const hotspot = {
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        brightness: parseFloat(row.bright_ti4 || row.brightness || 0),
        confidence: row.confidence || 'nominal',
        acq_date: row.acq_date,
        acq_time: row.acq_time,
        satellite: row.satellite || 'VIIRS',
      };

      // Insert into database
      db.prepare(`
        INSERT INTO fire_hotspots (latitude, longitude, brightness, confidence, acq_date, acq_time, satellite)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(hotspot.latitude, hotspot.longitude, hotspot.brightness, hotspot.confidence, hotspot.acq_date, hotspot.acq_time, hotspot.satellite);

      hotspots.push(hotspot);
    }

    console.log(`🔥 Found ${hotspots.length} fire hotspots in Jordan`);

    // Broadcast to dashboard
    broadcast({ type: 'FIRE_UPDATE', data: hotspots });

    // Check if any hotspot is near a forest
    for (const hotspot of hotspots) {
      checkForestProximity(hotspot, db, broadcast);
    }

    return hotspots;
  } catch (err) {
    console.error('FIRMS fetch error:', err.message);
    return insertDemoFireData(db, broadcast);
  }
}

function checkForestProximity(hotspot, db, broadcast) {
  for (const forest of JORDAN_FORESTS) {
    const distance = getDistanceKm(hotspot.latitude, hotspot.longitude, forest.lat, forest.lng);
    if (distance <= forest.radius) {
      // Fire near a forest! Create alert
      const alert = {
        level: hotspot.confidence === 'high' ? 'CRITICAL' : 'HIGH',
        type: 'fire',
        latitude: hotspot.latitude,
        longitude: hotspot.longitude,
        message: `🔥 حريق مكتشف بالقرب من ${forest.name} (${distance.toFixed(1)} كم)`,
        sources: 'FIRMS',
      };

      db.prepare(`
        INSERT INTO alerts (level, type, latitude, longitude, message, sources)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(alert.level, alert.type, alert.latitude, alert.longitude, alert.message, alert.sources);

      broadcast({ type: 'NEW_ALERT', data: alert });
      console.log(`🚨 ALERT: ${alert.message}`);
    }
  }
}

function insertDemoFireData(db, broadcast) {
  // Demo data for testing without API key
  const demoHotspots = [
    { latitude: 32.34, longitude: 35.75, brightness: 330, confidence: 'nominal', acq_date: new Date().toISOString().split('T')[0], acq_time: '1200', satellite: 'DEMO' },
    { latitude: 30.65, longitude: 35.62, brightness: 310, confidence: 'low', acq_date: new Date().toISOString().split('T')[0], acq_time: '1200', satellite: 'DEMO' },
  ];

  for (const h of demoHotspots) {
    db.prepare(`
      INSERT INTO fire_hotspots (latitude, longitude, brightness, confidence, acq_date, acq_time, satellite, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'DEMO')
    `).run(h.latitude, h.longitude, h.brightness, h.confidence, h.acq_date, h.acq_time, h.satellite);
  }

  broadcast({ type: 'FIRE_UPDATE', data: demoHotspots });
  console.log('📡 Loaded demo fire data');
  return demoHotspots;
}


