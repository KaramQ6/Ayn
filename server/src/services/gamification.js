// Gamification Service for ForestGuard AI

const POINTS = {
  submit_report: 10,
  report_with_image: 20,
  first_report_of_day: 25,
  report_verified: 50,
  report_led_to_response: 100,
};

const RANKS = [
  { min: 0,    ar: 'مراقب',        en: 'Observer' },
  { min: 100,  ar: 'مراسل ميداني', en: 'Field Reporter' },
  { min: 500,  ar: 'حارس متقدم',   en: 'Senior Guard' },
  { min: 1000, ar: 'قائد الفريق',  en: 'Team Leader' },
  { min: 5000, ar: 'حارس النخبة',  en: 'Elite Guardian' },
];

/**
 * Award points to a user based on an action
 * @param {import('better-sqlite3').Database} db
 * @param {string|number} userId
 * @param {keyof typeof POINTS} action
 * @param {Function} broadcast optional WS broadcaster
 */
export function awardPoints(db, userId, action, broadcast = null) {
  const pts = POINTS[action];
  if (!pts || !userId) return null;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return null;

  const newTotal = (user.total_points || user.points || 0) + pts;
  
  // Find the highest rank achieved
  const rank = [...RANKS].reverse().find(r => newTotal >= r.min) || RANKS[0];

  // Assuming table `users` has column `total_points` (we check both points and total_points gracefully)
  // ForestGuard SQLite schema usually uses total_points. Let's update points
  try {
    db.prepare(`
      UPDATE users 
      SET total_points = ?,
          rank = ?
      WHERE id = ?
    `).run(newTotal, rank.ar, userId);
  } catch (e) {
    console.error('Failed to update points:', e.message);
    return null;
  }

  const result = { userId, points_awarded: pts, total: newTotal, rank: rank.ar };

  if (broadcast) {
    broadcast({ type: 'POINTS_AWARDED', data: result });
  }

  return result;
}

export function getPointsForAction(action) {
  return POINTS[action] || 0;
}
