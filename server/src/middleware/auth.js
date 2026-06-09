import { getBearerToken, verifyAccessToken } from '../utils/auth.js';

export function requireAuth(req, res, next) {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const db = req.app.locals.db;
  const revoked = db.prepare('SELECT id FROM revoked_tokens WHERE jti = ? LIMIT 1').get(payload.jti);
  if (revoked) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(payload.sub));
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.auth = {
    userId: Number(payload.sub),
    jti: payload.jti,
    exp: payload.exp,
  };
  req.user = user;

  next();
}
