import { Router } from 'express';
import { JORDAN_FORESTS } from '../services/firms.js';
import { validate, reportSchema, validateId } from '../middleware/validation.js';

const router = Router();

// GET /api/fires — active fire hotspots
router.get('/fires', (req, res) => {
  const db = req.app.locals.db;
  const fires = db.prepare(`
    SELECT * FROM fire_hotspots
    ORDER BY created_at DESC LIMIT 100
  `).all();
  res.json(fires);
});

// GET /api/risk — fire risk for all regions
router.get('/risk', (req, res) => {
  const db = req.app.locals.db;
  // Get latest risk per region
  const risks = db.prepare(`
    SELECT * FROM fire_risk
    WHERE id IN (
      SELECT MAX(id) FROM fire_risk GROUP BY region
    )
    ORDER BY risk_score DESC
  `).all();
  res.json(risks);
});

// GET /api/reports — community reports
router.get('/reports', (req, res) => {
  const db = req.app.locals.db;
  const reports = db.prepare(`
    SELECT * FROM reports
    ORDER BY created_at DESC LIMIT 50
  `).all();
  res.json(reports);
});

// POST /api/reports — submit a report (from web)
router.post('/reports', validate(reportSchema), (req, res) => {
  const db = req.app.locals.db;
  const broadcast = req.app.locals.broadcast;
  const { latitude, longitude, report_type, description } = req.body;

  const result = db.prepare(`
    INSERT INTO reports (latitude, longitude, report_type, description, status)
    VALUES (?, ?, ?, ?, 'pending')
  `).run(latitude, longitude, report_type || 'unknown', description || '');

  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(result.lastInsertRowid);
  broadcast({ type: 'NEW_REPORT', data: report });

  res.json({ success: true, report });
});

// GET /api/alerts — alert history
router.get('/alerts', (req, res) => {
  const db = req.app.locals.db;
  const alerts = db.prepare(`
    SELECT * FROM alerts
    ORDER BY created_at DESC LIMIT 50
  `).all();
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

// GET /api/stats — dashboard statistics
router.get('/stats', (req, res) => {
  const db = req.app.locals.db;

  const totalFires = db.prepare(`SELECT COUNT(*) as count FROM fire_hotspots WHERE created_at > datetime('now', '-24 hours')`).get();
  const totalReports = db.prepare(`SELECT COUNT(*) as count FROM reports WHERE created_at > datetime('now', '-24 hours')`).get();
  const activeAlerts = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE resolved = 0').get();
  const avgRisk = db.prepare('SELECT AVG(risk_score) as avg FROM fire_risk WHERE id IN (SELECT MAX(id) FROM fire_risk GROUP BY region)').get();

  res.json({
    fires_24h: totalFires.count,
    reports_24h: totalReports.count,
    active_alerts: activeAlerts.count,
    avg_fire_risk: Math.round(avgRisk.avg || 0),
    forests_monitored: JORDAN_FORESTS.length,
    forests: JORDAN_FORESTS,
  });
});

// GET /api/stats/history — historical data for charts
router.get('/stats/history', (req, res) => {
  const db = req.app.locals.db;
  const days = parseInt(req.query.days) || 7;

  const daysParam = `-${days} days`;

  // Daily fire hotspot counts
  const fireTrend = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM fire_hotspots
    WHERE created_at > datetime('now', ?)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all(daysParam);

  // Daily alert counts by level
  const alertTrend = db.prepare(`
    SELECT DATE(created_at) as date, level, COUNT(*) as count
    FROM alerts
    WHERE created_at > datetime('now', ?)
    GROUP BY DATE(created_at), level
    ORDER BY date ASC
  `).all(daysParam);

  // Risk distribution (latest per region)
  const riskDistribution = db.prepare(`
    SELECT region, risk_score
    FROM fire_risk
    WHERE id IN (SELECT MAX(id) FROM fire_risk GROUP BY region)
    ORDER BY risk_score DESC
  `).all();

  // Reports by type
  const reportsByType = db.prepare(`
    SELECT report_type, COUNT(*) as count
    FROM reports
    WHERE created_at > datetime('now', ?)
    GROUP BY report_type
    ORDER BY count DESC
  `).all(daysParam);

  // Hourly risk trend for top 3 at-risk regions
  const riskTrend = db.prepare(`
    SELECT region, risk_score, updated_at
    FROM fire_risk
    WHERE updated_at > datetime('now', '-48 hours')
    ORDER BY updated_at ASC
  `).all();

  res.json({
    fireTrend,
    alertTrend,
    riskDistribution,
    reportsByType,
    riskTrend,
  });
});

// GET /api/forests — Jordanian forest data
router.get('/forests', (req, res) => {
  res.json(JORDAN_FORESTS);
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
