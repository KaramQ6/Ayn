import { Router } from 'express';
import {
  findNearestForest,
  getActiveForests,
  getAllCountries,
  getForestsByCountry,
  isCountryActive,
} from '../data/forests.js';
import { WADIS } from '../data/wadis.js';
import { validate, reportSchema, validateId } from '../middleware/validation.js';
import { awardPoints } from '../services/gamification.js';
import { getBestSatelliteImage } from '../services/satelliteImagery.js';
import { analyzeFireCause } from '../services/fireCauseAnalysis.js';

const router = Router();

function safeRoute(handler) {
  return (req, res) => {
    try {
      handler(req, res);
    } catch (error) {
      console.error('[API route error]', error?.message || error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

function getScopedCountries(country) {
  if (country) {
    const countryCode = String(country).toUpperCase();
    return isCountryActive(countryCode) ? [countryCode] : [];
  }
  return getAllCountries().map(c => c.code);
}

function scopedCountryWhere(countries, columnName = 'country') {
  if (countries.length === 0) {
    return { clause: '1 = 0', params: [] };
  }
  const placeholders = countries.map(() => '?').join(', ');
  return {
    clause: `${columnName} IN (${placeholders})`,
    params: countries,
  };
}

// GET /api/fires — active fire hotspots (optional ?country=JO filter)
router.get('/fires', safeRoute((req, res) => {
  const db = req.app.locals.db;
  const countries = getScopedCountries(req.query.country);
  const scope = scopedCountryWhere(countries);
  const fires = db.prepare(`
    SELECT * FROM fire_hotspots
    WHERE ${scope.clause}
    ORDER BY created_at DESC LIMIT 200
  `).all(...scope.params);
  res.json(fires);
}));

// GET /api/risk — fire risk for all regions (optional ?country=JO filter)
router.get('/risk', safeRoute((req, res) => {
  const db = req.app.locals.db;
  const countries = getScopedCountries(req.query.country);
  const scope = scopedCountryWhere(countries);
  const risks = db.prepare(`
    SELECT * FROM fire_risk
    WHERE ${scope.clause} AND id IN (
      SELECT MAX(id) FROM fire_risk WHERE ${scope.clause} GROUP BY region
    )
    ORDER BY risk_score DESC
  `).all(...scope.params, ...scope.params);
  res.json(risks);
}));

// GET /api/reports — community reports (optional ?country=JO filter)
router.get('/reports', safeRoute((req, res) => {
  const db = req.app.locals.db;
  const countries = getScopedCountries(req.query.country);
  const scope = scopedCountryWhere(countries);
  const reports = db.prepare(`
    SELECT * FROM reports
    WHERE ${scope.clause}
    ORDER BY created_at DESC LIMIT 100
  `).all(...scope.params);
  res.json(reports);
}));

// GET /api/activities — lightweight merged activity feed
router.get('/activities', safeRoute((req, res) => {
  const db = req.app.locals.db;
  const countries = getScopedCountries(req.query.country);
  const scope = scopedCountryWhere(countries);

  const reportActivities = db.prepare(`
    SELECT
      'report-' || id AS id,
      ('New ' || COALESCE(report_type, 'unknown') || ' report submitted') AS message,
      created_at AS time,
      CASE WHEN status = 'pending' THEN 'warning' ELSE 'success' END AS type
    FROM reports
    WHERE ${scope.clause}
    ORDER BY created_at DESC
    LIMIT 8
  `).all(...scope.params);
  const alertActivities = db.prepare(`
    SELECT
      'alert-' || id AS id,
      message,
      created_at AS time,
      CASE
        WHEN level = 'CRITICAL' THEN 'warning'
        WHEN level = 'HIGH' THEN 'warning'
        ELSE 'info'
      END AS type
    FROM alerts
    WHERE ${scope.clause}
    ORDER BY created_at DESC
    LIMIT 8
  `).all(...scope.params);

  const feed = [...reportActivities, ...alertActivities]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 12);

  res.json(feed);
}));

// POST /api/reports — submit a report (from web/mobile)
router.post('/reports', validate(reportSchema), safeRoute((req, res) => {
  const db = req.app.locals.db;
  const broadcast = req.app.locals.broadcast;
  const { latitude, longitude, report_type, description, user_id } = req.body;

  // Auto-detect country from coordinates
  const nearestResult = findNearestForest(latitude, longitude);
  const country = nearestResult?.forest?.country || null;

  // Award points based on whether there's an image (for now assume basic text report is 10)
  // The gamification logic awards 10 for submit_report
  let pointsAwarded = 10;
  if (user_id) {
    const awardResult = awardPoints(db, user_id, 'submit_report', broadcast);
    if (awardResult) pointsAwarded = awardResult.points_awarded;
  }

  const result = db.prepare(`
    INSERT INTO reports (latitude, longitude, country, report_type, description, status, user_id, points_awarded)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
  `).run(latitude, longitude, country, report_type || 'unknown', description || '', user_id || null, pointsAwarded);

  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(result.lastInsertRowid);
  broadcast({ type: 'NEW_REPORT', data: report });

  res.json({ success: true, report });
}));

// GET /api/alerts — alert history (optional ?country=JO filter)
router.get('/alerts', safeRoute((req, res) => {
  const db = req.app.locals.db;
  const countries = getScopedCountries(req.query.country);
  const scope = scopedCountryWhere(countries);
  const alerts = db.prepare(`
    SELECT * FROM alerts
    WHERE ${scope.clause}
    ORDER BY created_at DESC LIMIT 100
  `).all(...scope.params);
  res.json(alerts);
}));

// PATCH /api/alerts/:id/resolve — resolve an alert
router.patch('/alerts/:id/resolve', validateId, safeRoute((req, res) => {
  const db = req.app.locals.db;
  const broadcast = req.app.locals.broadcast;
  const { id } = req.params;

  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }
  if (alert.resolved) {
    return res.status(400).json({ error: 'Alert already resolved' });
  }

  db.prepare(`UPDATE alerts SET resolved = 1, resolved_at = datetime('now') WHERE id = ?`).run(id);
  const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);

  broadcast({ type: 'ALERT_RESOLVED', data: updated });
  res.json({ success: true, alert: updated });
}));

// GET /api/stats — dashboard statistics (optional ?country=JO filter)
router.get('/stats', safeRoute((req, res) => {
  const db = req.app.locals.db;
  const countries = getScopedCountries(req.query.country);
  const scope = scopedCountryWhere(countries);
  const forestList = req.query.country
    ? getForestsByCountry(String(req.query.country).toUpperCase())
    : getActiveForests();

  const totalFires = db.prepare(`
    SELECT COUNT(*) as count FROM fire_hotspots
    WHERE ${scope.clause} AND created_at > datetime('now', '-24 hours')
  `).get(...scope.params);
  const totalReports = db.prepare(`
    SELECT COUNT(*) as count FROM reports
    WHERE ${scope.clause} AND created_at > datetime('now', '-24 hours')
  `).get(...scope.params);
  const activeAlerts = db.prepare(`
    SELECT COUNT(*) as count FROM alerts
    WHERE ${scope.clause} AND resolved = 0
  `).get(...scope.params);
  const avgRisk = db.prepare(`
    SELECT AVG(risk_score) as avg FROM fire_risk
    WHERE ${scope.clause} AND id IN (
      SELECT MAX(id) FROM fire_risk WHERE ${scope.clause} GROUP BY region
    )
  `).get(...scope.params, ...scope.params);

  res.json({
    fires_24h: totalFires.count,
    reports_24h: totalReports.count,
    active_alerts: activeAlerts.count,
    avg_fire_risk: Math.round(avgRisk.avg || 0),
    forests_monitored: forestList.length,
    forests: forestList,
  });
}));

// GET /api/stats/history — historical data for charts (optional ?country=JO filter)
router.get('/stats/history', safeRoute((req, res) => {
  const db = req.app.locals.db;
  const days = parseInt(req.query.days) || 7;
  const daysParam = `-${days} days`;
  const countries = getScopedCountries(req.query.country);
  const scope = scopedCountryWhere(countries);

  const fireTrend = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM fire_hotspots
    WHERE ${scope.clause} AND created_at > datetime('now', ?)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all(...scope.params, daysParam);

  const alertTrend = db.prepare(`
    SELECT DATE(created_at) as date, level, COUNT(*) as count
    FROM alerts
    WHERE ${scope.clause} AND created_at > datetime('now', ?)
    GROUP BY DATE(created_at), level
    ORDER BY date ASC
  `).all(...scope.params, daysParam);

  const riskDistribution = db.prepare(`
    SELECT region, risk_score
    FROM fire_risk
    WHERE ${scope.clause} AND id IN (
      SELECT MAX(id) FROM fire_risk WHERE ${scope.clause} GROUP BY region
    )
    ORDER BY risk_score DESC
  `).all(...scope.params, ...scope.params);

  const reportsByType = db.prepare(`
    SELECT report_type, COUNT(*) as count
    FROM reports
    WHERE ${scope.clause} AND created_at > datetime('now', ?)
    GROUP BY report_type
    ORDER BY count DESC
  `).all(...scope.params, daysParam);

  const riskTrend = db.prepare(`
    SELECT region, risk_score, rain_probability, rain_1h, updated_at
    FROM fire_risk
    WHERE ${scope.clause} AND updated_at > datetime('now', '-48 hours')
    ORDER BY updated_at ASC
  `).all(...scope.params);

  res.json({
    fireTrend,
    alertTrend,
    riskDistribution,
    reportsByType,
    riskTrend,
  });
}));

// GET /api/forests — all monitored forests (optional ?country=JO filter)
router.get('/forests', safeRoute((req, res) => {
  const { country } = req.query;
  if (country) {
    res.json(getForestsByCountry(String(country).toUpperCase()));
  } else {
    res.json(getActiveForests());
  }
}));

// GET /api/countries — all monitored countries with forest counts
router.get('/countries', safeRoute((req, res) => {
  res.json(getAllCountries());
}));

// POST /api/satellite-analysis — fetch satellite image + analyze fire cause with Gemini
// Body: { latitude, longitude, brightness?, confidence?, satellite?, acq_date?, acq_time?, radius_km? }
router.post('/satellite-analysis', async (req, res) => {
  const { latitude, longitude, brightness, confidence, satellite, acq_date, acq_time, radius_km } = req.body;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ error: 'latitude and longitude are required numbers' });
  }

  const db = req.app.locals.db;
  const radiusKm = typeof radius_km === 'number' ? Math.min(radius_km, 50) : 5;

  // Fetch weather data for this location if available in DB
  let weather = null;
  try {
    const nearbyRisk = db.prepare(`
      SELECT * FROM fire_risk ORDER BY (ABS(? - latitude) + ABS(? - longitude)) LIMIT 1
    `).get(latitude, longitude);
    if (nearbyRisk) {
      weather = {
        temp: nearbyRisk.temperature,
        humidity: nearbyRisk.humidity,
        windSpeed: nearbyRisk.wind_speed,
        windDir: nearbyRisk.wind_direction,
        rain1h: nearbyRisk.rain_1h,
        description: nearbyRisk.weather_desc,
      };
    }
  } catch (_) {}

  // Find nearest monitored forest
  let nearestForest = null;
  try {
    const result = findNearestForest(latitude, longitude);
    if (result?.forest) nearestForest = { name: result.forest.name, distance: result.distance };
  } catch (_) {}

  // Step 1: Fetch satellite image
  let imageResult = null;
  try {
    imageResult = await getBestSatelliteImage(latitude, longitude, radiusKm);
  } catch (err) {
    console.error('Satellite image fetch error:', err.message);
  }

  // Step 2: Analyze fire cause with Gemini
  const context = {
    lat: latitude,
    lng: longitude,
    brightness: brightness || null,
    confidence: confidence || 'nominal',
    satellite: satellite || 'VIIRS',
    acq_date,
    acq_time,
    weather,
    nearestForest,
    distanceToRoad: null,
    distanceToSettlement: null,
  };

  const analysis = await analyzeFireCause(
    context,
    imageResult?.buffer || null,
    imageResult?.source || null,
  );

  res.json({
    coordinates: { latitude, longitude },
    radiusKm,
    imageSource: imageResult?.source || null,
    hasImage: !!imageResult,
    analysis,
  });
});

// GET /api/solar — latest solar irradiance reading per site
router.get('/solar', safeRoute((req, res) => {
  const db = req.app.locals.db;
  const countries = getScopedCountries(req.query.country);
  const scope = scopedCountryWhere(countries);
  const results = db.prepare(`
    SELECT s1.* FROM solar_irradiance s1
    INNER JOIN (
      SELECT site_id, MAX(id) as max_id FROM solar_irradiance
      WHERE ${scope.clause} GROUP BY site_id
    ) s2 ON s1.id = s2.max_id
    ORDER BY potential_score DESC
  `).all(...scope.params);
  res.json(results);
}));

// GET /api/solar/history/:siteId — last 24 readings for a specific site (chart data)
router.get('/solar/history/:siteId', safeRoute((req, res) => {
  const db = req.app.locals.db;
  const siteId = String(req.params.siteId).replace(/[^a-z0-9_]/gi, '');
  const results = db.prepare(`
    SELECT * FROM solar_irradiance
    WHERE site_id = ?
    ORDER BY id DESC LIMIT 24
  `).all(siteId);
  res.json(results.reverse());
}));

// ─── Najji Stats ──────────────────────────────────────────────────────────────

// GET /api/najji/stats — computed flood statistics from live najji readings
router.get('/najji/stats', safeRoute((req, res) => {
  const db = req.app.locals.db;

  const floodAlerts24h = db.prepare(`
    SELECT COUNT(*) as c FROM alerts
    WHERE type = 'flood' AND created_at > datetime('now', '-24 hours')
  `).get().c;

  // Latest reading per wadi (most recent run)
  const latestReadings = db.prepare(`
    SELECT n1.* FROM najji_readings n1
    INNER JOIN (SELECT wadi_id, MAX(id) as max_id FROM najji_readings GROUP BY wadi_id) n2
    ON n1.id = n2.max_id
  `).all();

  const avgRainMm = latestReadings.length
    ? parseFloat((latestReadings.reduce((s, r) => s + (r.rain_mm ?? 0), 0) / latestReadings.length).toFixed(1))
    : 0;

  const maxFlow = latestReadings.length
    ? latestReadings.reduce((best, r) => (r.flow_m3s ?? 0) > (best.flow_m3s ?? 0) ? r : best, latestReadings[0])
    : null;

  const criticalWadis = latestReadings.filter(r => r.risk_level === 'CRITICAL' || r.risk_level === 'WARNING').length;

  res.json({
    flood_alerts_24h:  floodAlerts24h,
    avg_rain_mm:       avgRainMm,
    latest_flow_m3s:   maxFlow ? maxFlow.flow_m3s.toFixed(1) : '0.0',
    critical_wadis:    criticalWadis,
    wadis_monitored:   WADIS.length,
    readings:          latestReadings,
  });
}));

// ─── Riyah (Air Quality & Wind) ──────────────────────────────────────────────

// GET /api/riyah — latest air quality reading per station
router.get('/riyah', safeRoute((req, res) => {
  const db = req.app.locals.db;
  const results = db.prepare(`
    SELECT r1.* FROM riyah_data r1
    INNER JOIN (SELECT site_id, MAX(id) as max_id FROM riyah_data GROUP BY site_id) r2
    ON r1.id = r2.max_id
    ORDER BY pm10 DESC
  `).all();
  res.json(results);
}));

// ─── Baydar (Agriculture / NDVI) ─────────────────────────────────────────────

// GET /api/baydar — latest agricultural health reading per site
router.get('/baydar', safeRoute((req, res) => {
  const db = req.app.locals.db;
  const results = db.prepare(`
    SELECT b1.* FROM baydar_data b1
    INNER JOIN (SELECT site_id, MAX(id) as max_id FROM baydar_data GROUP BY site_id) b2
    ON b1.id = b2.max_id
    ORDER BY ndvi_proxy DESC
  `).all();
  res.json(results);
}));

// ─── Niza (Conflict Intelligence) ────────────────────────────────────────────

// GET /api/niza — latest conflict/encroachment intelligence events for Jordan
router.get('/niza', safeRoute((req, res) => {
  const db = req.app.locals.db;
  const events = db.prepare(`
    SELECT * FROM niza_events ORDER BY created_at DESC LIMIT 20
  `).all();
  res.json(events);
}));

// GET /api/najm — latest stargazing conditions per site (seeing score, cloud cover, moon)
router.get('/najm', safeRoute((req, res) => {
  const db = req.app.locals.db;
  const sites = db.prepare(`
    SELECT n1.* FROM najm_data n1
    INNER JOIN (SELECT site_id, MAX(id) as max_id FROM najm_data GROUP BY site_id) n2
      ON n1.site_id = n2.site_id AND n1.id = n2.max_id
    ORDER BY n1.seeing_score DESC
  `).all();
  res.json(sites);
}));

// GET /api/jamal — latest wildlife observation data per site
router.get('/jamal', safeRoute((req, res) => {
  const db = req.app.locals.db;
  const sites = db.prepare(`
    SELECT j1.* FROM jamal_data j1
    INNER JOIN (SELECT site_id, MAX(id) as max_id FROM jamal_data GROUP BY site_id) j2
      ON j1.site_id = j2.site_id AND j1.id = j2.max_id
    ORDER BY j1.activity_score DESC
  `).all();
  res.json(sites);
}));

export default router;
