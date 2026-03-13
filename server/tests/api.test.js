import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import Database from 'better-sqlite3';
import express from 'express';
import apiRoutes from '../src/routes/api.js';

function createTestDb() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE fire_hotspots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      latitude REAL NOT NULL, longitude REAL NOT NULL,
      brightness REAL, confidence TEXT, acq_date TEXT, acq_time TEXT,
      satellite TEXT, source TEXT DEFAULT 'FIRMS',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_user_id TEXT, username TEXT,
      latitude REAL, longitude REAL, photo_url TEXT,
      report_type TEXT DEFAULT 'unknown', description TEXT,
      status TEXT DEFAULT 'pending',
      ai_classification TEXT, ai_confidence REAL, ai_analysis TEXT,
      points_awarded INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL, type TEXT,
      latitude REAL, longitude REAL, message TEXT,
      sources TEXT, confidence REAL DEFAULT 0,
      resolved INTEGER DEFAULT 0, resolved_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE fire_risk (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      region TEXT NOT NULL, latitude REAL, longitude REAL,
      temperature REAL, humidity REAL, wind_speed REAL, rain_1h REAL,
      risk_score INTEGER,
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE rangers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_chat_id TEXT UNIQUE, name TEXT, region TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  return db;
}

function createApp(db) {
  const app = express();
  app.use(express.json());
  app.locals.db = db;
  app.locals.broadcast = () => {};
  app.use('/api', apiRoutes);
  return app;
}

// Simple test request helper using Node http
async function request(app, method, url, body) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const port = server.address().port;
      const options = {
        hostname: 'localhost',
        port,
        path: url,
        method: method.toUpperCase(),
        headers: body ? { 'Content-Type': 'application/json' } : {},
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          server.close();
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });
      req.on('error', (err) => { server.close(); reject(err); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  });
}

describe('API Routes', () => {
  let db;
  let app;

  beforeEach(() => {
    db = createTestDb();
    app = createApp(db);
  });

  it('GET /api/fires returns array', async () => {
    const res = await request(app, 'GET', '/api/fires');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });

  it('GET /api/stats returns expected shape', async () => {
    const res = await request(app, 'GET', '/api/stats');
    assert.strictEqual(res.status, 200);
    assert.ok('fires_24h' in res.body);
    assert.ok('reports_24h' in res.body);
    assert.ok('active_alerts' in res.body);
    assert.ok('avg_fire_risk' in res.body);
    assert.ok('forests_monitored' in res.body);
  });

  it('GET /api/alerts returns array', async () => {
    const res = await request(app, 'GET', '/api/alerts');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });

  it('GET /api/risk returns array', async () => {
    const res = await request(app, 'GET', '/api/risk');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });

  it('GET /api/forests returns Jordan forests', async () => {
    const res = await request(app, 'GET', '/api/forests');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length > 0);
    assert.ok(res.body[0].name);
    assert.ok(res.body[0].lat);
  });

  it('POST /api/reports creates a report', async () => {
    const res = await request(app, 'POST', '/api/reports', {
      latitude: 32.3,
      longitude: 35.7,
      report_type: 'fire',
      description: 'Test fire report',
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.success);
    assert.ok(res.body.report);
    assert.strictEqual(res.body.report.report_type, 'fire');
  });

  it('POST /api/reports rejects invalid coordinates', async () => {
    const res = await request(app, 'POST', '/api/reports', {
      latitude: 0,
      longitude: 0,
      report_type: 'fire',
    });
    assert.strictEqual(res.status, 400);
  });

  it('PATCH /api/alerts/:id/resolve resolves an alert', async () => {
    db.prepare(`
      INSERT INTO alerts (level, type, latitude, longitude, message, sources, confidence)
      VALUES ('HIGH', 'cross_validated', 32.3, 35.7, 'Test alert', 'FIRMS', 80)
    `).run();

    const res = await request(app, 'PATCH', '/api/alerts/1/resolve');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.success);
    assert.strictEqual(res.body.alert.resolved, 1);
  });

  it('PATCH /api/alerts/:id/resolve returns 404 for missing alert', async () => {
    const res = await request(app, 'PATCH', '/api/alerts/999/resolve');
    assert.strictEqual(res.status, 404);
  });

  it('GET /api/stats/history returns chart data', async () => {
    const res = await request(app, 'GET', '/api/stats/history?days=7');
    assert.strictEqual(res.status, 200);
    assert.ok('fireTrend' in res.body);
    assert.ok('alertTrend' in res.body);
    assert.ok('riskDistribution' in res.body);
    assert.ok('reportsByType' in res.body);
    assert.ok('riskTrend' in res.body);
  });
});
