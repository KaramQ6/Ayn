import { JORDAN_FORESTS } from './firms.js';
import { getDistanceKm } from '../utils/geo.js';
import { notifyRangers } from '../bot/telegramBot.js';

// Cross-validation alert engine
// Combines: NASA FIRMS + Community Reports + Weather Risk + AI Vision
// Weighted confidence: FIRMS 35% + WEATHER 25% + COMMUNITY 20% + AI_VISION 20%

const SOURCE_WEIGHTS = {
  FIRMS: 0.35,
  WEATHER_RISK: 0.25,
  COMMUNITY: 0.20,
  AI_VISION: 0.20,
};

export function crossValidate(db, broadcast, newData) {
  const { type, latitude, longitude, aiConfidence = 0, aiThreatType = 'none' } = newData;
  const radius = 5; // km radius for cross-validation

  // Collect evidence from each source with individual confidence scores
  const evidence = {};

  // --- 1. NASA FIRMS hotspots nearby (last 24 hours) ---
  const hotspots = db.prepare(`
    SELECT * FROM fire_hotspots
    WHERE created_at > datetime('now', '-24 hours')
  `).all();

  for (const h of hotspots) {
    if (getDistanceKm(latitude, longitude, h.latitude, h.longitude) <= radius) {
      const dist = getDistanceKm(latitude, longitude, h.latitude, h.longitude);
      // Closer hotspots = higher confidence; satellite confidence as baseline
      const proxScore = Math.max(0, 1 - dist / radius);
      evidence.FIRMS = Math.max(evidence.FIRMS || 0, proxScore * 100);
      break;
    }
  }
  // If the trigger itself is FIRMS, always include it
  if (type === 'FIRMS') {
    evidence.FIRMS = evidence.FIRMS || 90;
  }

  // --- 2. Community reports nearby (last 24 hours) ---
  const reports = db.prepare(`
    SELECT * FROM reports
    WHERE created_at > datetime('now', '-24 hours')
    AND status != 'rejected'
    AND latitude IS NOT NULL
  `).all();

  for (const r of reports) {
    if (getDistanceKm(latitude, longitude, r.latitude, r.longitude) <= radius) {
      evidence.COMMUNITY = Math.max(evidence.COMMUNITY || 0, 80);
      break;
    }
  }
  if (type === 'COMMUNITY') {
    evidence.COMMUNITY = evidence.COMMUNITY || 70;
  }

  // --- 3. Weather risk for nearest region ---
  let nearestForest = null;
  let minDistance = Infinity;
  for (const forest of JORDAN_FORESTS) {
    const dist = getDistanceKm(latitude, longitude, forest.lat, forest.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestForest = forest;
    }
  }

  if (nearestForest) {
    const latestRisk = db.prepare(`
      SELECT * FROM fire_risk
      WHERE region = ?
      ORDER BY updated_at DESC LIMIT 1
    `).get(nearestForest.name);

    if (latestRisk && latestRisk.risk_score >= 40) {
      evidence.WEATHER_RISK = latestRisk.risk_score;
    }
  }

  // --- 4. AI Vision analysis ---
  if (type === 'AI_VISION' && aiConfidence > 0) {
    evidence.AI_VISION = aiConfidence;
  } else {
    // Check if any nearby reports have AI analysis with threats
    for (const r of reports) {
      if (r.ai_analysis && r.latitude && getDistanceKm(latitude, longitude, r.latitude, r.longitude) <= radius) {
        try {
          const analysis = JSON.parse(r.ai_analysis);
          if ((analysis.hasFire || analysis.hasSmoke) && analysis.threatConfidence > 50) {
            evidence.AI_VISION = Math.max(evidence.AI_VISION || 0, analysis.threatConfidence);
          }
        } catch (_) { /* ignore parse errors */ }
      }
    }
  }

  // --- Compute weighted confidence ---
  const uniqueSources = Object.keys(evidence);
  let weightedConfidence = 0;
  let totalWeight = 0;

  for (const [source, score] of Object.entries(evidence)) {
    const weight = SOURCE_WEIGHTS[source] || 0.15;
    weightedConfidence += (score / 100) * weight;
    totalWeight += weight;
  }

  // Normalize: scale up if we have fewer sources (partial information)
  // But cap the max confidence based on number of sources
  const sourceCount = uniqueSources.length;
  const normalizedConfidence = totalWeight > 0 ? (weightedConfidence / totalWeight) * 100 : 0;

  // Apply source-count multiplier for final confidence
  let finalConfidence;
  let level;
  if (sourceCount >= 4) {
    finalConfidence = Math.min(99, normalizedConfidence * 1.0);
    level = 'CRITICAL';
  } else if (sourceCount === 3) {
    finalConfidence = Math.min(95, normalizedConfidence * 0.95);
    level = finalConfidence >= 75 ? 'CRITICAL' : 'HIGH';
  } else if (sourceCount === 2) {
    finalConfidence = Math.min(80, normalizedConfidence * 0.85);
    level = finalConfidence >= 65 ? 'HIGH' : 'MEDIUM';
  } else {
    finalConfidence = Math.min(50, normalizedConfidence * 0.6);
    level = 'MEDIUM';
  }

  finalConfidence = Math.round(finalConfidence);

  const alert = {
    level,
    type: 'cross_validated',
    latitude,
    longitude,
    message: `${levelEmoji(level)} تنبيه ${levelArabic(level)} — ${sourceCount} مصادر مؤكدة بالقرب من ${nearestForest?.name || 'منطقة غير محددة'} (${minDistance.toFixed(1)} كم) — ثقة: ${finalConfidence}%`,
    sources: uniqueSources.join(','),
    confidence: finalConfidence,
  };

  // Only create alert if we have 2+ sources OR a single source with high confidence
  if (sourceCount >= 2 || (sourceCount === 1 && finalConfidence >= 40)) {
    db.prepare(`
      INSERT INTO alerts (level, type, latitude, longitude, message, sources, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(alert.level, alert.type, alert.latitude, alert.longitude, alert.message, alert.sources, alert.confidence);

    broadcast({ type: 'NEW_ALERT', data: alert });
    console.log(`🚨 Cross-validated alert [${sourceCount} sources, ${finalConfidence}% confidence]: ${alert.level}`);

    // Notify registered rangers via Telegram for HIGH/CRITICAL alerts
    if (level === 'HIGH' || level === 'CRITICAL') {
      try {
        notifyRangers(db, alert);
      } catch (err) {
        console.error('Failed to notify rangers:', err.message);
      }
    }
  }

  return alert;
}

function levelEmoji(level) {
  const map = { LOW: '🟡', MEDIUM: '🟠', HIGH: '🔴', CRITICAL: '🚨' };
  return map[level] || '⚪';
}

function levelArabic(level) {
  const map = { LOW: 'منخفض', MEDIUM: 'متوسط', HIGH: 'عالي', CRITICAL: 'حرج' };
  return map[level] || level;
}


