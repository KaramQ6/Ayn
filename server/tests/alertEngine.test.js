import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { crossValidate } from '../src/services/alertEngine.js';

// Create a fresh in-memory database for each test
function createTestDb() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE fire_hotspots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      brightness REAL,
      confidence TEXT,
      acq_date TEXT,
      acq_time TEXT,
      satellite TEXT,
      source TEXT DEFAULT 'FIRMS',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_user_id TEXT,
      username TEXT,
      latitude REAL,
      longitude REAL,
      photo_url TEXT,
      report_type TEXT DEFAULT 'unknown',
      description TEXT,
      status TEXT DEFAULT 'pending',
      ai_classification TEXT,
      ai_confidence REAL,
      ai_analysis TEXT,
      points_awarded INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL,
      type TEXT,
      latitude REAL,
      longitude REAL,
      message TEXT,
      sources TEXT,
      confidence REAL DEFAULT 0,
      resolved INTEGER DEFAULT 0,
      resolved_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE fire_risk (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      region TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      temperature REAL,
      humidity REAL,
      wind_speed REAL,
      rain_1h REAL,
      risk_score INTEGER,
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE rangers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_chat_id TEXT UNIQUE,
      name TEXT,
      region TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  return db;
}

describe('crossValidate', () => {
  let db;
  let broadcasts;
  let broadcast;

  beforeEach(() => {
    db = createTestDb();
    broadcasts = [];
    broadcast = (msg) => broadcasts.push(msg);
  });

  it('returns an alert with MEDIUM level for single FIRMS source', () => {
    const alert = crossValidate(db, broadcast, {
      type: 'FIRMS',
      latitude: 32.3326,
      longitude: 35.7516,
    });
    assert.ok(alert);
    assert.strictEqual(alert.level, 'MEDIUM');
    assert.ok(alert.sources.includes('FIRMS'));
  });

  it('produces higher confidence when multiple sources corroborate', () => {
    // Insert a nearby hotspot
    db.prepare(`
      INSERT INTO fire_hotspots (latitude, longitude, brightness, confidence, satellite, created_at)
      VALUES (32.333, 35.752, 350, '90', 'VIIRS', datetime('now'))
    `).run();

    // Insert a nearby community report
    db.prepare(`
      INSERT INTO reports (latitude, longitude, report_type, status, created_at)
      VALUES (32.334, 35.751, 'fire', 'pending', datetime('now'))
    `).run();

    // Insert weather risk for Ajloun
    db.prepare(`
      INSERT INTO fire_risk (region, latitude, longitude, risk_score, updated_at)
      VALUES ('Jordan - Ajloun Forest', 32.3326, 35.7516, 75, datetime('now'))
    `).run();

    const alert = crossValidate(db, broadcast, {
      type: 'FIRMS',
      latitude: 32.3326,
      longitude: 35.7516,
    });

    assert.ok(alert.confidence > 50, `Expected >50% confidence with 3 sources, got ${alert.confidence}%`);
    assert.ok(['HIGH', 'CRITICAL'].includes(alert.level), `Expected HIGH/CRITICAL, got ${alert.level}`);
  });

  it('includes AI_VISION source when provided', () => {
    const alert = crossValidate(db, broadcast, {
      type: 'AI_VISION',
      latitude: 32.3326,
      longitude: 35.7516,
      aiConfidence: 85,
      aiThreatType: 'fire',
    });
    assert.ok(alert.sources.includes('AI_VISION'));
  });

  it('creates database alert when threshold is met', () => {
    // Insert supporting data for multi-source scenario
    db.prepare(`
      INSERT INTO fire_hotspots (latitude, longitude, brightness, confidence, satellite, created_at)
      VALUES (32.333, 35.752, 350, '90', 'VIIRS', datetime('now'))
    `).run();

    crossValidate(db, broadcast, {
      type: 'COMMUNITY',
      latitude: 32.3326,
      longitude: 35.7516,
    });

    const alerts = db.prepare('SELECT * FROM alerts').all();
    assert.ok(alerts.length >= 1, 'Expected at least one alert in database');
  });

  it('broadcasts NEW_ALERT event', () => {
    db.prepare(`
      INSERT INTO fire_hotspots (latitude, longitude, brightness, confidence, satellite, created_at)
      VALUES (32.333, 35.752, 350, '90', 'VIIRS', datetime('now'))
    `).run();

    crossValidate(db, broadcast, {
      type: 'COMMUNITY',
      latitude: 32.3326,
      longitude: 35.7516,
    });

    const alertBroadcasts = broadcasts.filter(b => b.type === 'NEW_ALERT');
    assert.ok(alertBroadcasts.length >= 1, 'Expected at least one NEW_ALERT broadcast');
  });
});
