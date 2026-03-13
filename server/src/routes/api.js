import { Router } from 'express';
import { FORESTS, getForestsByCountry, getAllCountries, findNearestForest } from '../data/forests.js';
import { validate, reportSchema, validateId } from '../middleware/validation.js';

const router = Router();

// GET /api/fires — active fire hotspots (optional ?country=JO filter)
router.get('/fires', (req, res) => {
  const db = req.app.locals.db;
  const { country } = req.query;

  let fires;
  if (country) {
    fires = db.prepare(`
      SELECT * FROM fire_hotspots
      WHERE country = ?
      ORDER BY created_at DESC LIMIT 200
    `).all(country.toUpperCase());
  } else {
    fires = db.prepare(`
      SELECT * FROM fire_hotspots
      ORDER BY created_at DESC LIMIT 200
    `).all();
  }
  res.json(fires);
});

// GET /api/risk — fire risk for all regions (optional ?country=JO filter)
router.get('/risk', (req, res) => {
  const db = req.app.locals.db;
  const { country } = req.query;

  let risks;
  if (country) {
    risks = db.prepare(`
      SELECT * FROM fire_risk
      WHERE country = ? AND id IN (
        SELECT MAX(id) FROM fire_risk WHERE country = ? GROUP BY region
      )
      ORDER BY risk_score DESC
    `).all(country.toUpperCase(), country.toUpperCase());
  } else {
    risks = db.prepare(`
      SELECT * FROM fire_risk
      WHERE id IN (
        SELECT MAX(id) FROM fire_risk GROUP BY region
      )
      ORDER BY risk_score DESC
    `).all();
  }
  res.json(risks);
});

// GET /api/reports — community reports (optional ?country=JO filter)
router.get('/reports', (req, res) => {
  const db = req.app.locals.db;
  const { country } = req.query;

  let reports;
  if (country) {
    reports = db.prepare(`
      SELECT * FROM reports
      WHERE country = ?
      ORDER BY created_at DESC LIMIT 100
    `).all(country.toUpperCase());
  } else {
    reports = db.prepare(`
      SELECT * FROM reports
      ORDER BY created_at DESC LIMIT 100
    `).all();
  }
  res.json(reports);
});

// POST /api/reports — submit a report (from web)
router.post('/reports', validate(reportSchema), (req, res) => {
  const db = req.app.locals.db;
  const broadcast = req.app.locals.broadcast;
  const { latitude, longitude, report_type, description } = req.body;

  // Auto-detect country from coordinates
  const nearestResult = findNearestForest(latitude, longitude);
  const country = nearestResult?.forest?.country || null;

  const result = db.prepare(`
    INSERT INTO reports (latitude, longitude, country, report_type, description, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(latitude, longitude, country, report_type || 'unknown', description || '');

  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(result.lastInsertRowid);
  broadcast({ type: 'NEW_REPORT', data: report });

  res.json({ success: true, report });
});

// GET /api/alerts — alert history (optional ?country=JO filter)
router.get('/alerts', (req, res) => {
  const db = req.app.locals.db;
  const { country } = req.query;

  let alerts;
  if (country) {
    alerts = db.prepare(`
      SELECT * FROM alerts
      WHERE country = ?
      ORDER BY created_at DESC LIMIT 100
    `).all(country.toUpperCase());
  } else {
    alerts = db.prepare(`
      SELECT * FROM alerts
      ORDER BY created_at DESC LIMIT 100
    `).all();
  }
  res.json(alerts);
});

// PATCH /api/alerts/:id/resolve — resolve an alert
router.patch('/alerts/:id/resolve', validateId, (req, res) => {
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
});

// GET /api/stats — dashboard statistics (optional ?country=JO filter)
router.get('/stats', (req, res) => {
  const db = req.app.locals.db;
  const { country } = req.query;

  let totalFires, totalReports, activeAlerts, avgRisk, forestCount, forestList;

  if (country) {
    const c = country.toUpperCase();
    totalFires = db.prepare(`SELECT COUNT(*) as count FROM fire_hotspots WHERE country = ? AND created_at > datetime('now', '-24 hours')`).get(c);
    totalReports = db.prepare(`SELECT COUNT(*) as count FROM reports WHERE country = ? AND created_at > datetime('now', '-24 hours')`).get(c);
    activeAlerts = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE country = ? AND resolved = 0').get(c);
    avgRisk = db.prepare('SELECT AVG(risk_score) as avg FROM fire_risk WHERE country = ? AND id IN (SELECT MAX(id) FROM fire_risk WHERE country = ? GROUP BY region)').get(c, c);
    forestList = getForestsByCountry(c);
    forestCount = forestList.length;
  } else {
    totalFires = db.prepare(`SELECT COUNT(*) as count FROM fire_hotspots WHERE created_at > datetime('now', '-24 hours')`).get();
    totalReports = db.prepare(`SELECT COUNT(*) as count FROM reports WHERE created_at > datetime('now', '-24 hours')`).get();
    activeAlerts = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE resolved = 0').get();
    avgRisk = db.prepare('SELECT AVG(risk_score) as avg FROM fire_risk WHERE id IN (SELECT MAX(id) FROM fire_risk GROUP BY region)').get();
    forestList = FORESTS;
    forestCount = FORESTS.length;
  }

  res.json({
    fires_24h: totalFires.count,
    reports_24h: totalReports.count,
    active_alerts: activeAlerts.count,
    avg_fire_risk: Math.round(avgRisk.avg || 0),
    forests_monitored: forestCount,
    forests: forestList,
  });
});

// GET /api/stats/history — historical data for charts (optional ?country=JO filter)
router.get('/stats/history', (req, res) => {
  const db = req.app.locals.db;
  const days = parseInt(req.query.days) || 7;
  const { country } = req.query;
  const daysParam = `-${days} days`;

  let fireTrend, alertTrend, riskDistribution, reportsByType, riskTrend;

  if (country) {
    const c = country.toUpperCase();

    fireTrend = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM fire_hotspots
      WHERE country = ? AND created_at > datetime('now', ?)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all(c, daysParam);

    alertTrend = db.prepare(`
      SELECT DATE(created_at) as date, level, COUNT(*) as count
      FROM alerts
      WHERE country = ? AND created_at > datetime('now', ?)
      GROUP BY DATE(created_at), level
      ORDER BY date ASC
    `).all(c, daysParam);

    riskDistribution = db.prepare(`
      SELECT region, risk_score
      FROM fire_risk
      WHERE country = ? AND id IN (SELECT MAX(id) FROM fire_risk WHERE country = ? GROUP BY region)
      ORDER BY risk_score DESC
    `).all(c, c);

    reportsByType = db.prepare(`
      SELECT report_type, COUNT(*) as count
      FROM reports
      WHERE country = ? AND created_at > datetime('now', ?)
      GROUP BY report_type
      ORDER BY count DESC
    `).all(c, daysParam);

    riskTrend = db.prepare(`
      SELECT region, risk_score, updated_at
      FROM fire_risk
      WHERE country = ? AND updated_at > datetime('now', '-48 hours')
      ORDER BY updated_at ASC
    `).all(c);
  } else {
    fireTrend = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM fire_hotspots
      WHERE created_at > datetime('now', ?)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all(daysParam);

    alertTrend = db.prepare(`
      SELECT DATE(created_at) as date, level, COUNT(*) as count
      FROM alerts
      WHERE created_at > datetime('now', ?)
      GROUP BY DATE(created_at), level
      ORDER BY date ASC
    `).all(daysParam);

    riskDistribution = db.prepare(`
      SELECT region, risk_score
      FROM fire_risk
      WHERE id IN (SELECT MAX(id) FROM fire_risk GROUP BY region)
      ORDER BY risk_score DESC
    `).all();

    reportsByType = db.prepare(`
      SELECT report_type, COUNT(*) as count
      FROM reports
      WHERE created_at > datetime('now', ?)
      GROUP BY report_type
      ORDER BY count DESC
    `).all(daysParam);

    riskTrend = db.prepare(`
      SELECT region, risk_score, updated_at
      FROM fire_risk
      WHERE updated_at > datetime('now', '-48 hours')
      ORDER BY updated_at ASC
    `).all();
  }

  res.json({
    fireTrend,
    alertTrend,
    riskDistribution,
    reportsByType,
    riskTrend,
  });
});

// GET /api/forests — all monitored forests (optional ?country=JO filter)
router.get('/forests', (req, res) => {
  const { country } = req.query;
  if (country) {
    res.json(getForestsByCountry(country.toUpperCase()));
  } else {
    res.json(FORESTS);
  }
});

// GET /api/countries — all monitored countries with forest counts
router.get('/countries', (req, res) => {
  res.json(getAllCountries());
});

// GET /api/leaderboard — top community reporters by points
router.get('/leaderboard', (req, res) => {
  const db = req.app.locals.db;
  const leaderboard = db.prepare(`
    SELECT
      COALESCE(username, 'Anonymous') as username,
      COUNT(*) as report_count,
      SUM(points_awarded) as total_points
    FROM reports
    WHERE points_awarded > 0
    GROUP BY COALESCE(username, telegram_user_id, 'anonymous_' || id)
    ORDER BY total_points DESC
    LIMIT 10
  `).all();
  res.json(leaderboard);
});

export default router;
