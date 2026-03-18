import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PREFERENCES = JSON.stringify({
  notifications: {
    alerts: true,
    community: true,
    reports: false,
  },
  language: 'ar',
});

function hasColumn(db, tableName, columnName) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return columns.some((column) => column.name === columnName);
}

function ensureColumn(db, tableName, columnName, columnDefinition) {
  if (!hasColumn(db, tableName, columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
  }
}

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
      user_id INTEGER,
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
      country TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      region TEXT DEFAULT 'MENA Region',
      preferences TEXT NOT NULL DEFAULT '${DEFAULT_PREFERENCES.replace(/'/g, "''")}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      jti TEXT UNIQUE NOT NULL,
      expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS revoked_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      jti TEXT UNIQUE NOT NULL,
      expires_at TEXT,
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
      rain_probability REAL,
      rain_label TEXT,
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

    CREATE TABLE IF NOT EXISTS report_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(report_id) REFERENCES reports(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS report_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      vote INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(report_id, user_id),
      FOREIGN KEY(report_id) REFERENCES reports(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
    CREATE INDEX IF NOT EXISTS idx_report_comments_user_id ON report_comments(user_id);
    CREATE INDEX IF NOT EXISTS idx_report_comments_report_id ON report_comments(report_id);
    CREATE INDEX IF NOT EXISTS idx_report_votes_user_id ON report_votes(user_id);
    CREATE INDEX IF NOT EXISTS idx_report_votes_report_id ON report_votes(report_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_revoked_tokens_jti ON revoked_tokens(jti);
  `);

  // Safe migrations for existing databases (column-by-column checks)
  ensureColumn(db, 'alerts', 'confidence', 'REAL DEFAULT 0');
  ensureColumn(db, 'alerts', 'resolved_at', 'TEXT');
  ensureColumn(db, 'alerts', 'country', 'TEXT');

  ensureColumn(db, 'reports', 'ai_analysis', 'TEXT');
  ensureColumn(db, 'reports', 'country', 'TEXT');
  ensureColumn(db, 'reports', 'user_id', 'INTEGER');

  ensureColumn(db, 'fire_risk', 'rain_1h', 'REAL DEFAULT 0');
  ensureColumn(db, 'fire_risk', 'rain_probability', 'REAL DEFAULT 0');
  ensureColumn(db, 'fire_risk', 'rain_label', 'TEXT');
  ensureColumn(db, 'fire_risk', 'country', "TEXT DEFAULT 'JO'");

  ensureColumn(db, 'fire_hotspots', 'country', "TEXT DEFAULT 'JO'");

  ensureColumn(db, 'users', 'avatar', 'TEXT');
  ensureColumn(db, 'users', 'region', "TEXT DEFAULT 'MENA Region'");
  ensureColumn(
    db,
    'users',
    'preferences',
    `TEXT NOT NULL DEFAULT '${DEFAULT_PREFERENCES.replace(/'/g, "''")}'`,
  );

  console.log('✅ Database initialized');
  return db;
}
