import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function initDatabase() {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'forestguard.db');
  const db = new Database(dbPath);

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS fire_hotspots (
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

    CREATE TABLE IF NOT EXISTS reports (
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
      points_awarded INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS alerts (
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

    CREATE TABLE IF NOT EXISTS fire_risk (
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

    CREATE TABLE IF NOT EXISTS rangers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_chat_id TEXT UNIQUE,
      name TEXT,
      region TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Safe migrations for existing databases
  const migrations = [
    "ALTER TABLE alerts ADD COLUMN confidence REAL DEFAULT 0",
    "ALTER TABLE alerts ADD COLUMN resolved_at TEXT",
    "ALTER TABLE reports ADD COLUMN ai_analysis TEXT",
    "ALTER TABLE fire_risk ADD COLUMN rain_1h REAL DEFAULT 0",
    // Multi-country expansion
    "ALTER TABLE fire_hotspots ADD COLUMN country TEXT DEFAULT 'JO'",
    "ALTER TABLE reports ADD COLUMN country TEXT",
    "ALTER TABLE alerts ADD COLUMN country TEXT",
    "ALTER TABLE fire_risk ADD COLUMN country TEXT DEFAULT 'JO'",
  ];
  for (const sql of migrations) {
    try { db.exec(sql); } catch (_) { /* column already exists */ }
  }

  console.log('✅ Database initialized');
  return db;
}
