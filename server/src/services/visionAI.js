// Google Cloud Vision AI - Photo Analysis Service
// Analyzes photos from Telegram reports for fire/smoke detection

import vision from '@google-cloud/vision';

let client = null;

function getClient() {
  if (!client) {
    const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credentials) {
      return null;
    }
    try {
      client = new vision.ImageAnnotatorClient();
    } catch (err) {
      console.error('Failed to initialize Vision AI client:', err.message);
      return null;
    }
  }
  return client;
}

/**
 * Analyze an image buffer for fire/smoke/environmental threats
 * @param {Buffer|string} imageSource - Image buffer or URL
 * @returns {Promise<object>} Analysis result
 */
export async function analyzePhoto(imageSource) {
  const visionClient = getClient();

  if (!visionClient) {
    console.log('Vision AI not configured - returning demo analysis');
    return getDemoAnalysis();
  }

  try {
    const request = typeof imageSource === 'string'
      ? { image: { source: { imageUri: imageSource } } }
      : { image: { content: imageSource } };

    // Run label detection and safe search in parallel
    const [labelResult, safeResult] = await Promise.all([
      visionClient.labelDetection(request),
      visionClient.safeSearchDetection(request),
    ]);

    const labels = labelResult[0].labelAnnotations || [];
    const safeSearch = safeResult[0].safeSearchAnnotation || {};

    // Fire/smoke detection keywords
    const fireKeywords = ['fire', 'flame', 'wildfire', 'blaze', 'burning', 'combustion', 'inferno'];
    const smokeKeywords = ['smoke', 'smog', 'haze', 'fumes', 'ash'];
    const loggingKeywords = ['logging', 'deforestation', 'chainsaw', 'lumber', 'tree stump', 'wood cutting'];
    const natureKeywords = ['forest', 'tree', 'vegetation', 'nature', 'landscape', 'woodland'];

    const labelNames = labels.map(l => l.description.toLowerCase());
    const labelScores = labels.reduce((acc, l) => {
      acc[l.description.toLowerCase()] = l.score;
      return acc;
    }, {});

    const hasFire = fireKeywords.some(kw => labelNames.some(ln => ln.includes(kw)));
    const hasSmoke = smokeKeywords.some(kw => labelNames.some(ln => ln.includes(kw)));
    const hasLogging = loggingKeywords.some(kw => labelNames.some(ln => ln.includes(kw)));
    const hasNature = natureKeywords.some(kw => labelNames.some(ln => ln.includes(kw)));

    // Calculate threat confidence
    let threatConfidence = 0;
    let threatType = 'none';

    if (hasFire) {
      const fireScore = Math.max(...fireKeywords.map(kw => {
        const match = labelNames.find(ln => ln.includes(kw));
        return match ? (labelScores[match] || 0) : 0;
      }));
      threatConfidence = Math.max(threatConfidence, fireScore);
      threatType = 'fire';
    }

    if (hasSmoke) {
      const smokeScore = Math.max(...smokeKeywords.map(kw => {
        const match = labelNames.find(ln => ln.includes(kw));
        return match ? (labelScores[match] || 0) : 0;
      }));
      if (smokeScore > threatConfidence) {
        threatConfidence = smokeScore;
        threatType = threatType === 'fire' ? 'fire' : 'smoke';
      } else if (threatType === 'fire') {
        threatConfidence = Math.min(1, threatConfidence + smokeScore * 0.2);
      }
    }

    if (hasLogging && !hasFire && !hasSmoke) {
      const loggingScore = Math.max(...loggingKeywords.map(kw => {
        const match = labelNames.find(ln => ln.includes(kw));
        return match ? (labelScores[match] || 0) : 0;
      }));
      threatConfidence = loggingScore;
      threatType = 'logging';
    }

    return {
      labels: labels.slice(0, 10).map(l => ({ name: l.description, score: Math.round(l.score * 100) })),
      hasFire,
      hasSmoke,
      hasLogging,
      hasNature,
      threatType,
      threatConfidence: Math.round(threatConfidence * 100),
      safeSearch: {
        violence: safeSearch.violence || 'UNKNOWN',
      },
      analyzed: true,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Vision AI analysis failed:', err.message);
    return {
      labels: [],
      hasFire: false,
      hasSmoke: false,
      hasLogging: false,
      hasNature: false,
      threatType: 'unknown',
      threatConfidence: 0,
      error: err.message,
      analyzed: false,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Demo analysis for when Vision AI is not configured
 */
function getDemoAnalysis() {
  const threats = [
    { hasFire: true, hasSmoke: true, threatType: 'fire', threatConfidence: 87 },
    { hasFire: false, hasSmoke: true, threatType: 'smoke', threatConfidence: 72 },
    { hasFire: false, hasSmoke: false, threatType: 'none', threatConfidence: 15 },
    { hasFire: false, hasSmoke: false, hasLogging: true, threatType: 'logging', threatConfidence: 68 },
  ];
  const pick = threats[Math.floor(Math.random() * threats.length)];

  return {
    labels: [
      { name: 'Forest', score: 92 },
      { name: 'Nature', score: 88 },
      ...(pick.hasFire ? [{ name: 'Fire', score: pick.threatConfidence }] : []),
      ...(pick.hasSmoke ? [{ name: 'Smoke', score: pick.threatConfidence }] : []),
    ],
    hasFire: pick.hasFire || false,
    hasSmoke: pick.hasSmoke || false,
    hasLogging: pick.hasLogging || false,
    hasNature: true,
    threatType: pick.threatType,
    threatConfidence: pick.threatConfidence,
    safeSearch: { violence: 'UNLIKELY' },
    analyzed: true,
    demo: true,
    timestamp: new Date().toISOString(),
  };
}
