import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const DEFAULT_PREFERENCES = {
  notifications: {
    alerts: true,
    community: true,
    reports: false,
  },
  language: 'ar',
};

const jwtSecret = process.env.JWT_SECRET || 'dev-only-jwt-secret-change-me';
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

export function createAccessToken(userId) {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ sub: String(userId), jti }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });
  return { token, jti };
}

export function verifyAccessToken(token) {
  return jwt.verify(token, jwtSecret);
}

export function getBearerToken(authorizationHeader) {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

export function parsePreferences(value) {
  if (!value || typeof value !== 'string') {
    return DEFAULT_PREFERENCES;
  }

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') {
      return DEFAULT_PREFERENCES;
    }
    return parsed;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function serializePreferences(preferences) {
  return JSON.stringify(preferences ?? DEFAULT_PREFERENCES);
}

export function sanitizeUser(userRow) {
  if (!userRow) return null;

  return {
    id: String(userRow.id),
    name: userRow.name,
    email: userRow.email,
    avatar: userRow.avatar ?? null,
    region: userRow.region ?? 'MENA Region',
    preferences: parsePreferences(userRow.preferences),
    createdAt: userRow.created_at,
    reportsCount: typeof userRow.reports_count === 'number' ? userRow.reports_count : 0,
  };
}

export function defaultPreferences() {
  return { ...DEFAULT_PREFERENCES };
}
