import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { COUNTRY_BOUNDS } from '../data/forests.js';
import { requireAuth } from '../middleware/auth.js';
import { avatarUpload } from '../middleware/upload.js';
import {
  createAccessToken,
  defaultPreferences,
  sanitizeUser,
  serializePreferences,
} from '../utils/auth.js';
import { uploadAvatarFile } from '../services/storage.js';
import { deleteCommunityDataForUser } from '../services/supabaseAdmin.js';

const router = Router();

const validRegions = new Set([
  'MENA Region',
  ...Object.keys(COUNTRY_BOUNDS),
  ...Object.values(COUNTRY_BOUNDS).map((country) => country.name),
]);

const preferencesSchema = z.object({
  notifications: z.object({
    alerts: z.boolean(),
    community: z.boolean(),
    reports: z.boolean(),
  }),
  language: z.enum(['en', 'ar', 'fr']),
});

const registerSchema = z.object({
  name: z.string().trim().min(1).max(50),
  email: z.string().email().transform((email) => email.toLowerCase()),
  password: z.string().min(6).max(100),
  avatar: z.string().url().nullable().optional(),
  region: z.string().optional().default('MENA Region'),
});

const loginSchema = z.object({
  email: z.string().email().transform((email) => email.toLowerCase()),
  password: z.string().min(1),
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(50),
  avatar: z.string().url().nullable(),
  region: z.string().min(1),
});

function isValidRegion(region) {
  return validRegions.has(region);
}

function userWithReportCountQuery(db, userId) {
  return db.prepare(`
    SELECT
      u.*,
      COALESCE(COUNT(r.id), 0) AS reports_count
    FROM users u
    LEFT JOIN reports r ON r.user_id = u.id
    WHERE u.id = ?
    GROUP BY u.id
  `).get(userId);
}

function validateRegionOrThrow(region) {
  if (!isValidRegion(region)) {
    const error = new Error('Invalid region value');
    error.statusCode = 400;
    throw error;
  }
}

function insertSession(db, userId, jti) {
  db.prepare('INSERT INTO auth_sessions (user_id, jti) VALUES (?, ?)').run(userId, jti);
}

router.post('/register', async (req, res) => {
  try {
    const parsed = registerSchema.parse(req.body);
    validateRegionOrThrow(parsed.region);

    const db = req.app.locals.db;
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(parsed.email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(parsed.password, 10);
    const preferences = serializePreferences(defaultPreferences());

    const inserted = db.prepare(`
      INSERT INTO users (email, password_hash, name, avatar, region, preferences)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      parsed.email,
      passwordHash,
      parsed.name,
      parsed.avatar ?? null,
      parsed.region,
      preferences,
    );

    const userId = Number(inserted.lastInsertRowid);
    const { token, jti } = createAccessToken(userId);
    insertSession(db, userId, jti);

    const user = userWithReportCountQuery(db, userId);
    return res.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message ?? 'Invalid request body' });
    }
    const statusCode = error?.statusCode ?? 500;
    return res.status(statusCode).json({ error: error.message ?? 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const db = req.app.locals.db;

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(parsed.email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(parsed.password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { token, jti } = createAccessToken(user.id);
    insertSession(db, user.id, jti);

    const userWithCounts = userWithReportCountQuery(db, user.id);
    return res.json({
      token,
      user: sanitizeUser(userWithCounts),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message ?? 'Invalid request body' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  const db = req.app.locals.db;
  const user = userWithReportCountQuery(db, req.auth.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json({ user: sanitizeUser(user) });
});

router.patch('/profile', requireAuth, (req, res) => {
  try {
    const parsed = updateProfileSchema.parse(req.body);
    validateRegionOrThrow(parsed.region);

    const db = req.app.locals.db;
    db.prepare(`
      UPDATE users
      SET name = ?, avatar = ?, region = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(parsed.name, parsed.avatar ?? null, parsed.region, req.auth.userId);

    const user = userWithReportCountQuery(db, req.auth.userId);
    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message ?? 'Invalid request body' });
    }
    const statusCode = error?.statusCode ?? 500;
    return res.status(statusCode).json({ error: error.message ?? 'Internal server error' });
  }
});

router.put('/preferences', requireAuth, (req, res) => {
  try {
    const parsed = preferencesSchema.parse(req.body);
    const db = req.app.locals.db;

    db.prepare(`
      UPDATE users
      SET preferences = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(serializePreferences(parsed), req.auth.userId);

    return res.json({ preferences: parsed });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message ?? 'Invalid request body' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/avatar', requireAuth, (req, res) => {
  avatarUpload.single('avatar')(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({ error: uploadError.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Avatar file is required' });
    }

    try {
      const db = req.app.locals.db;
      const avatarUrl = await uploadAvatarFile(req.file.path);
      db.prepare(`
        UPDATE users
        SET avatar = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(avatarUrl, req.auth.userId);

      return res.json({ avatarUrl });
    } catch {
      return res.status(500).json({ error: 'Avatar upload failed' });
    }
  });
});

router.post('/logout', requireAuth, (req, res) => {
  const db = req.app.locals.db;
  const currentSession = db.prepare('SELECT id FROM auth_sessions WHERE jti = ? LIMIT 1').get(req.auth.jti);
  if (currentSession) {
    db.prepare('DELETE FROM auth_sessions WHERE jti = ?').run(req.auth.jti);
  }
  db.prepare(`
    INSERT OR IGNORE INTO revoked_tokens (user_id, jti, expires_at)
    VALUES (?, ?, NULL)
  `).run(req.auth.userId, req.auth.jti);

  return res.json({ message: 'Logged out successfully' });
});

router.delete('/account', requireAuth, async (req, res) => {
  const db = req.app.locals.db;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    await deleteCommunityDataForUser(user);
  } catch (error) {
    return res.status(502).json({ error: error.message ?? 'Failed to delete community data' });
  }

  const deleteAccountTransaction = db.transaction((userId, currentJti) => {
    const sessions = db.prepare('SELECT jti, expires_at FROM auth_sessions WHERE user_id = ?').all(userId);
    const insertRevoked = db.prepare(`
      INSERT OR IGNORE INTO revoked_tokens (user_id, jti, expires_at)
      VALUES (?, ?, ?)
    `);
    for (const session of sessions) {
      insertRevoked.run(userId, session.jti, session.expires_at ?? null);
    }
    if (currentJti) {
      insertRevoked.run(userId, currentJti, null);
    }

    db.prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM report_comments WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM report_votes WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM notifications WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM reports WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  });

  try {
    deleteAccountTransaction(req.auth.userId, req.auth.jti);
    return res.json({ message: 'Account deleted successfully' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
