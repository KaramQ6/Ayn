import { Router } from 'express';
import { FORESTS, getForestsByCountry, getAllCountries, findNearestForest } from '../data/forests.js';
import { validate, reportSchema, validateId } from '../middleware/validation.js';
import { awardPoints } from '../services/gamification.js';

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

// GET /api/fires — active fire hotspots (optional ?country=JO filter)
router.get('/fires', safeRoute((req, res) => {
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
}));

// GET /api/risk — fire risk for all regions (optional ?country=JO filter)
router.get('/risk', safeRoute((req, res) => {
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
}));

// GET /api/reports — community reports (optional ?country=JO filter)
router.get('/reports', safeRoute((req, res) => {
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
}));

// GET /api/activities — lightweight merged activity feed
router.get('/activities', safeRoute((req, res) => {
  const db = req.app.locals.db;
  const { country } = req.query;

  let reportActivities;
  let alertActivities;
  if (country) {
    const c = country.toUpperCase();
    reportActivities = db.prepare(`
      SELECT
        'report-' || id AS id,
        ('New ' || COALESCE(report_type, 'unknown') || ' report submitted') AS message,
        created_at AS time,
        CASE WHEN status = 'pending' THEN 'warning' ELSE 'success' END AS type
      FROM reports
      WHERE country = ?
      ORDER BY created_at DESC
      LIMIT 8
    `).all(c);
    alertActivities = db.prepare(`
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
      WHERE country = ?
      ORDER BY created_at DESC
      LIMIT 8
    `).all(c);
  } else {
    reportActivities = db.prepare(`
      SELECT
        'report-' || id AS id,
        ('New ' || COALESCE(report_type, 'unknown') || ' report submitted') AS message,
        created_at AS time,
        CASE WHEN status = 'pending' THEN 'warning' ELSE 'success' END AS type
      FROM reports
      ORDER BY created_at DESC
      LIMIT 8
    `).all();
    alertActivities = db.prepare(`
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
      ORDER BY created_at DESC
      LIMIT 8
    `).all();
  }

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
}));

// GET /api/stats/history — historical data for charts (optional ?country=JO filter)
router.get('/stats/history', safeRoute((req, res) => {
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
      SELECT region, risk_score, rain_probability, rain_1h, updated_at
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
      SELECT region, risk_score, rain_probability, rain_1h, updated_at
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
}));

// GET /api/forests — all monitored forests (optional ?country=JO filter)
router.get('/forests', safeRoute((req, res) => {
  const { country } = req.query;
  if (country) {
    res.json(getForestsByCountry(country.toUpperCase()));
  } else {
    res.json(FORESTS);
  }
}));

// GET /api/countries — all monitored countries with forest counts
router.get('/countries', safeRoute((req, res) => {
  res.json(getAllCountries());
}));

// GET /api/leaderboard — top community reporters by points
router.get('/leaderboard', safeRoute((req, res) => {
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
}));

export default router;
