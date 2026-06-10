import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import Database from 'better-sqlite3';
import express from 'express';
import authRoutes from '../src/routes/auth.js';

function createTestDb() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      region TEXT DEFAULT 'MENA Region',
      preferences TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      report_type TEXT DEFAULT 'unknown',
      description TEXT,
      status TEXT DEFAULT 'pending',
      country TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE auth_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      jti TEXT UNIQUE NOT NULL,
      expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE revoked_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      jti TEXT UNIQUE NOT NULL,
      expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE report_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE report_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      vote INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  return db;
}

function createApp(db) {
  const app = express();
  app.use(express.json());
  app.locals.db = db;
  app.use('/api/auth', authRoutes);
  return app;
}

async function request(app, method, url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const port = server.address().port;
      const req = http.request(
        {
          hostname: 'localhost',
          port,
          path: url,
          method,
          headers: {
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...headers,
          },
        },
        (res) => {
          let raw = '';
          res.on('data', (chunk) => { raw += chunk; });
          res.on('end', () => {
            server.close();
            try {
              resolve({ status: res.statusCode, body: JSON.parse(raw) });
            } catch {
              resolve({ status: res.statusCode, body: raw });
            }
          });
        },
      );
      req.on('error', (error) => {
        server.close();
        reject(error);
      });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  });
}

describe('Auth API', () => {
  let db;
  let app;

  beforeEach(() => {
    db = createTestDb();
    app = createApp(db);
  });

  it('registers and returns token + user', async () => {
    const response = await request(app, 'POST', '/api/auth/register', {
      name: 'Ranger One',
      email: 'ranger@example.com',
      password: 'secret123',
      avatar: null,
      region: 'Jordan',
    });

    assert.strictEqual(response.status, 201);
    assert.ok(response.body.token);
    assert.strictEqual(response.body.user.email, 'ranger@example.com');
  });

  it('logs in registered user', async () => {
    await request(app, 'POST', '/api/auth/register', {
      name: 'Ranger Two',
      email: 'ranger2@example.com',
      password: 'secret123',
      avatar: null,
      region: 'Jordan',
    });

    const response = await request(app, 'POST', '/api/auth/login', {
      email: 'ranger2@example.com',
      password: 'secret123',
    });

    assert.strictEqual(response.status, 200);
    assert.ok(response.body.token);
    assert.strictEqual(response.body.user.name, 'Ranger Two');
  });

  it('rejects unauthenticated /me request with 401', async () => {
    const response = await request(app, 'GET', '/api/auth/me');
    assert.strictEqual(response.status, 401);
    assert.ok(response.body.error);
  });

  it('rejects invalid token with 401', async () => {
    const response = await request(
      app,
      'GET',
      '/api/auth/me',
      undefined,
      { Authorization: 'Bearer invalid-token' },
    );
    assert.strictEqual(response.status, 401);
    assert.ok(response.body.error);
  });

  it('updates profile and returns sanitized user', async () => {
    const registerResponse = await request(app, 'POST', '/api/auth/register', {
      name: 'Ranger Profile',
      email: 'profile@example.com',
      password: 'secret123',
      avatar: null,
      region: 'Jordan',
    });
    const token = registerResponse.body.token;

    const response = await request(
      app,
      'PATCH',
      '/api/auth/profile',
      {
        name: 'Updated Ranger',
        avatar: null,
        region: 'Lebanon',
      },
      { Authorization: `Bearer ${token}` },
    );

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.user.name, 'Updated Ranger');
    assert.strictEqual(response.body.user.region, 'Lebanon');
    assert.strictEqual(response.body.user.avatar, null);
    assert.ok(!('password_hash' in response.body.user));
  });

  it('validates profile payload', async () => {
    const registerResponse = await request(app, 'POST', '/api/auth/register', {
      name: 'Profile Validate',
      email: 'profile-validate@example.com',
      password: 'secret123',
      avatar: null,
      region: 'Jordan',
    });
    const token = registerResponse.body.token;

    const response = await request(
      app,
      'PATCH',
      '/api/auth/profile',
      {
        name: 'Profile Validate',
        avatar: null,
        region: 'Nowhere Land',
      },
      { Authorization: `Bearer ${token}` },
    );

    assert.strictEqual(response.status, 400);
    assert.ok(response.body.error);
  });

  it('updates preferences successfully', async () => {
    const registerResponse = await request(app, 'POST', '/api/auth/register', {
      name: 'Prefs User',
      email: 'prefs@example.com',
      password: 'secret123',
      avatar: null,
      region: 'Jordan',
    });
    const token = registerResponse.body.token;

    const response = await request(
      app,
      'PUT',
      '/api/auth/preferences',
      {
        notifications: {
          alerts: false,
          community: true,
          reports: true,
        },
        language: 'fr',
      },
      { Authorization: `Bearer ${token}` },
    );

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.preferences.language, 'fr');
    assert.strictEqual(response.body.preferences.notifications.alerts, false);
  });

  it('validates preferences payload', async () => {
    const registerResponse = await request(app, 'POST', '/api/auth/register', {
      name: 'Ranger Three',
      email: 'ranger3@example.com',
      password: 'secret123',
      avatar: null,
      region: 'Jordan',
    });
    const token = registerResponse.body.token;

    const response = await request(
      app,
      'PUT',
      '/api/auth/preferences',
      {
        notifications: { alerts: true, community: true },
        language: 'de',
      },
      { Authorization: `Bearer ${token}` },
    );

    assert.strictEqual(response.status, 400);
    assert.ok(response.body.error);
  });

  it('deletes account and all owned sqlite rows', async () => {
    const registerResponse = await request(app, 'POST', '/api/auth/register', {
      name: 'Delete Me',
      email: 'deleteme@example.com',
      password: 'secret123',
      avatar: null,
      region: 'Jordan',
    });
    const token = registerResponse.body.token;
    const userId = Number(registerResponse.body.user.id);

    const insertedReport = db.prepare(`
      INSERT INTO reports (user_id, report_type, description, status, country)
      VALUES (?, 'fire', 'owned report', 'pending', 'JO')
    `).run(userId);
    const reportId = Number(insertedReport.lastInsertRowid);

    db.prepare(`
      INSERT INTO report_comments (report_id, user_id, content)
      VALUES (?, ?, 'owned comment')
    `).run(reportId, userId);
    db.prepare(`
      INSERT INTO report_votes (report_id, user_id, vote)
      VALUES (?, ?, 1)
    `).run(reportId, userId);
    db.prepare(`
      INSERT INTO notifications (user_id, type, message)
      VALUES (?, 'system', 'owned notification')
    `).run(userId);
    db.prepare(`
      INSERT INTO auth_sessions (user_id, jti)
      VALUES (?, 'extra-session-jti')
    `).run(userId);

    const response = await request(
      app,
      'DELETE',
      '/api/auth/account',
      undefined,
      { Authorization: `Bearer ${token}` },
    );

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.message, 'Account deleted successfully');

    const usersCount = db.prepare('SELECT COUNT(*) AS count FROM users WHERE id = ?').get(userId).count;
    const reportsCount = db.prepare('SELECT COUNT(*) AS count FROM reports WHERE user_id = ?').get(userId).count;
    const commentsCount = db.prepare('SELECT COUNT(*) AS count FROM report_comments WHERE user_id = ?').get(userId).count;
    const votesCount = db.prepare('SELECT COUNT(*) AS count FROM report_votes WHERE user_id = ?').get(userId).count;
    const notificationsCount = db.prepare('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ?').get(userId).count;
    const sessionsCount = db.prepare('SELECT COUNT(*) AS count FROM auth_sessions WHERE user_id = ?').get(userId).count;

    assert.strictEqual(usersCount, 0);
    assert.strictEqual(reportsCount, 0);
    assert.strictEqual(commentsCount, 0);
    assert.strictEqual(votesCount, 0);
    assert.strictEqual(notificationsCount, 0);
    assert.strictEqual(sessionsCount, 0);
  });
});
