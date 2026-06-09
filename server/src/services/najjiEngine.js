import { WADIS } from '../data/wadis.js';

const OPEN_METEO_HISTORICAL = 'https://archive-api.open-meteo.com/v1/archive';
const OPEN_METEO_FORECAST   = 'https://api.open-meteo.com/v1/forecast';

/**
 * Fetch precipitation data from Open-Meteo API
 * This is used as the primary fast API for hackathons (no auth needed).
 */
export async function fetchPrecipitation(lat, lng, isHistorical = false, date = null) {
  try {
    const base = isHistorical ? OPEN_METEO_HISTORICAL : OPEN_METEO_FORECAST;
    const params = new URLSearchParams({
      latitude:  lat,
      longitude: lng,
      hourly:    'precipitation',
      timezone:  'Asia/Amman',
      ...(isHistorical
        ? { start_date: date, end_date: date }
        : { forecast_days: 1 })
    });
    
    const url = `${base}?${params}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
    const data = await response.json();
    return data.hourly; // { time: [...], precipitation: [...] }
  } catch (err) {
    console.error(`Error fetching precipitation for ${lat},${lng}:`, err.message);
    return null;
  }
}

/**
 * The Rational Method for Peak Discharge
 * Q (m³/s) = C × i (mm/hr) × A (km²) / 3.6
 */
export function calculateFloodRisk(wadi, rainIntensity_mm_hr) {
  const Q = (wadi.C * rainIntensity_mm_hr * wadi.A) / 3.6;
  return {
    Q_m3_per_sec: Q,
    isCritical:   Q >= wadi.threshold_m3s,
    riskLevel:    Q >= wadi.threshold_m3s ? 'CRITICAL' :
                  Q >= wadi.threshold_m3s * 0.6 ? 'WARNING' : 'NORMAL'
  };
}

export async function checkFloodRisks(db, broadcast) {
  console.log('🌊 Running Najji (Flash Flood) Engine...');
  const activeAlerts = [];

  for (const wadi of WADIS) {
    const hourlyData = await fetchPrecipitation(wadi.lat, wadi.lng, false);
    if (!hourlyData) continue;
    
    // Get the current hour's precipitation — Open-Meteo returns Asia/Amman time (+3h)
    const ammanNow = new Date(new Date().getTime() + 3 * 60 * 60 * 1000);
    const currentHourStr = ammanNow.toISOString().substring(0, 14) + '00';
    const index = hourlyData.time.findIndex(t => t.includes(currentHourStr));
    const rainIntensity = index !== -1 ? hourlyData.precipitation[index] : hourlyData.precipitation[0];

    const result = calculateFloodRisk(wadi, rainIntensity);

    // Persist reading for /api/najji/stats
    db.prepare(`
      INSERT INTO najji_readings (wadi_id, wadi_name, rain_mm, flow_m3s, risk_level, country)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(wadi.id, wadi.nameAr, rainIntensity, parseFloat(result.Q_m3_per_sec.toFixed(2)), result.riskLevel, wadi.country);

    console.log(`[Najji] ${wadi.nameEn || wadi.name}: Rain=${rainIntensity}mm/h -> Q=${result.Q_m3_per_sec.toFixed(2)} m³/s (Threshold=${wadi.threshold_m3s})`);

    if (result.riskLevel !== 'NORMAL') {
      // Dedup: Check if alert already exists recently
      const existingAlert = db.prepare(`
        SELECT id FROM alerts
        WHERE type = 'flood' AND country = ?
        AND message LIKE ? AND created_at > datetime('now', '-2 hours')
      `).get(wadi.country, `%${wadi.nameAr}%`);

      if (existingAlert) continue;

      const alert = {
        level: result.isCritical ? 'CRITICAL' : 'HIGH',
        type: 'flood',
        latitude: wadi.lat,
        longitude: wadi.lng,
        message: `🌊 ${result.isCritical ? 'تحذير حرج' : 'تنبيه عالي'} — سيول في ${wadi.nameAr} (تدفق متوقع: ${result.Q_m3_per_sec.toFixed(0)} m³/s)`,
        sources: 'OPEN_METEO, HYDRO_LOGIC',
        confidence: 95,
        country: wadi.country
      };

      db.prepare(`
        INSERT INTO alerts (level, type, latitude, longitude, message, sources, confidence, country)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(alert.level, alert.type, alert.latitude, alert.longitude, alert.message, alert.sources, alert.confidence, alert.country);

      activeAlerts.push(alert);
      broadcast({ type: 'NEW_ALERT', data: alert });
      console.log(`🚨 FLOOD ALERT: ${alert.message}`);
    }

    // Respect API rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (activeAlerts.length > 0) {
    broadcast({ type: 'FLOOD_UPDATE', data: activeAlerts });
  }

  return activeAlerts;
}
