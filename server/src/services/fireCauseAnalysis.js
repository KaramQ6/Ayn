/**
 * Fire Cause Analysis Service
 *
 * Uses Google Gemini Flash (free tier: 1500 req/day) to analyze
 * satellite imagery and contextual data to determine probable fire cause.
 *
 * Cause categories:
 *   natural_lightning    — storm-triggered ignition in remote/elevated areas
 *   natural_spontaneous  — extreme heat/drought causing spontaneous combustion
 *   human_arson          — deliberate setting (multiple ignition points, linear patterns)
 *   human_accident       — campfire, cigarette, agricultural burn gone wrong
 *   human_land_clearing  — deliberate clearing for agriculture/development
 *   infrastructure       — power lines, road sparks, industrial accident
 *   unknown              — insufficient data to determine
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

let _genai = null;

function getGeminiClient() {
  if (_genai) return _genai;
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  _genai = new GoogleGenerativeAI(key);
  return _genai;
}

/**
 * Build a structured prompt for Gemini to analyze fire cause.
 */
function buildAnalysisPrompt(context) {
  const {
    lat, lng, brightness, confidence, satellite,
    weather, nearestForest, distanceToRoad, distanceToSettlement,
    imageSource, acq_date, acq_time,
  } = context;

  const hour = acq_time ? parseInt(acq_time.slice(0, 2)) : null;
  const timeLabel = hour !== null
    ? (hour < 6 ? 'night (00-06)' : hour < 12 ? 'morning (06-12)' : hour < 18 ? 'afternoon (12-18)' : 'evening (18-24)')
    : 'unknown';

  return `You are an expert wildfire forensics analyst. Analyze this satellite image and the contextual data below to determine the most probable cause of this fire.

## Satellite Image
Source: ${imageSource || 'Satellite imagery'}
${imageSource?.includes('Sentinel-2') ? 'Image type: SWIR false-color (B12/B8A/B4)\n- Bright orange/yellow = active fire or very hot surface\n- Dark red/maroon = burn scar\n- Green = healthy vegetation\n- Brown/tan = drought-stressed or bare land' : 'Image type: True color (RGB)'}

## Fire Detection Data
- Coordinates: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E
- Detection time: ${acq_date || 'unknown'} ${timeLabel}
- Thermal brightness: ${brightness} K (VIIRS Ti4 band)
- Detection confidence: ${confidence}
- Satellite sensor: ${satellite}

## Environmental Context
${weather ? `- Temperature: ${weather.temp ?? 'N/A'}°C
- Humidity: ${weather.humidity ?? 'N/A'}%
- Wind speed: ${weather.windSpeed ?? 'N/A'} m/s, direction: ${weather.windDir ?? 'N/A'}°
- Recent rainfall: ${weather.rain1h ?? 0} mm/h
- Weather condition: ${weather.description ?? 'N/A'}` : '- Weather data: unavailable'}
${nearestForest ? `- Nearest monitored forest: ${nearestForest.name} (${nearestForest.distance?.toFixed(1)} km away)` : ''}
${distanceToRoad != null ? `- Distance to nearest road: ~${distanceToRoad} km` : ''}
${distanceToSettlement != null ? `- Distance to nearest settlement: ~${distanceToSettlement} km` : ''}

## Analysis Instructions
1. Examine the burn pattern in the image:
   - Circular/radial pattern → likely single ignition point (campfire, arson, lightning strike)
   - Linear/elongated pattern → wind-driven spread from one edge
   - Multiple separate patches → multiple ignition points (arson, embers, lightning storm)
   - Gradual gradient from one side → agricultural/land clearing
2. Consider time of day: lightning fires typically start afternoon/evening during storms; arson often late night/early morning
3. Consider proximity to human infrastructure
4. Consider weather: low humidity + high wind + drought = extreme natural risk; lightning storms = natural cause

Respond ONLY with a valid JSON object (no markdown, no explanation outside the JSON):
{
  "cause": "<one of: natural_lightning|natural_spontaneous|human_arson|human_accident|human_land_clearing|infrastructure|unknown>",
  "confidence": <0-100>,
  "cause_label_ar": "<Arabic label for the cause>",
  "cause_label_en": "<English label>",
  "evidence": ["<observation 1>", "<observation 2>", "<observation 3>"],
  "burn_pattern": "<description of the burn pattern seen>",
  "risk_factors": ["<environmental/contextual risk factor>"],
  "recommendations": ["<action recommendation>"],
  "summary_ar": "<2-3 sentence Arabic summary of findings>"
}`;
}

/**
 * Analyze fire cause using Gemini Flash + satellite image.
 *
 * @param {object} context - fire hotspot + weather + geographic context
 * @param {Buffer|null} imageBuffer - satellite image bytes (JPEG)
 * @param {string} imageSource - description of image source
 * @returns {Promise<object>} - structured cause analysis
 */
export async function analyzeFireCause(context, imageBuffer, imageSource) {
  const genai = getGeminiClient();

  if (!genai) {
    console.log('Gemini not configured — returning demo fire cause analysis');
    return getDemoCauseAnalysis(context);
  }

  try {
    const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const parts = [{ text: buildAnalysisPrompt({ ...context, imageSource }) }];

    if (imageBuffer) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBuffer.toString('base64'),
        },
      });
    }

    const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
    const text = result.response.text().trim();

    // Strip markdown code fences if Gemini wraps the JSON
    const jsonStr = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(jsonStr);

    return {
      ...parsed,
      imageSource,
      analyzed: true,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Gemini fire cause analysis failed:', err.message);
    return {
      cause: 'unknown',
      confidence: 0,
      cause_label_ar: 'غير محدد',
      cause_label_en: 'Unknown',
      evidence: [],
      burn_pattern: 'Could not analyze',
      risk_factors: [],
      recommendations: ['Manual investigation required'],
      summary_ar: 'فشل التحليل التلقائي. يرجى التحقيق اليدوي.',
      imageSource,
      analyzed: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/** Demo fallback when Gemini is not configured */
function getDemoCauseAnalysis(context) {
  const causes = [
    {
      cause: 'human_land_clearing',
      confidence: 82,
      cause_label_ar: 'تحضير أراضٍ زراعية',
      cause_label_en: 'Agricultural land clearing',
      evidence: [
        'Linear burn pattern suggesting controlled clearing',
        'Fire detected in early afternoon hours',
        'Proximity to cultivated land edges',
      ],
      burn_pattern: 'Linear pattern along field boundaries, consistent with deliberate clearing',
      risk_factors: ['Low humidity', 'Moderate wind speed', 'Dry vegetation'],
      recommendations: [
        'Alert local agricultural authority',
        'Monitor for spread into nearby forest',
        'Dispatch inspection team to confirm controlled burn permits',
      ],
      summary_ar: 'يُشير نمط الحرق الخطي وتوقيت الاكتشاف إلى احتمال قيام أحد المزارعين بحرق الأراضي الزراعية. يُنصح بالتحقق من تصاريح الحرق الزراعي والمراقبة المستمرة لمنع الانتشار.',
    },
    {
      cause: 'natural_lightning',
      confidence: 74,
      cause_label_ar: 'صاعقة برق طبيعية',
      cause_label_en: 'Natural lightning strike',
      evidence: [
        'Circular ignition pattern suggesting single-point origin',
        'Fire detected following afternoon storm activity',
        'Remote location far from human settlements',
      ],
      burn_pattern: 'Radial spread from central point, typical of lightning-initiated fire',
      risk_factors: ['Recent storm system', 'Dry forest floor', 'High winds post-storm'],
      recommendations: [
        'Deploy aerial firefighting resources immediately',
        'Monitor wind direction for spread trajectory',
        'Alert nearby forest communities',
      ],
      summary_ar: 'نمط الانتشار الدائري ومكان الاشتعال في منطقة نائية يشيران إلى حريق مُسبَّب بصاعقة برق. توصي الأنظمة بالتدخل الفوري نظراً للجفاف وسرعة الرياح.',
    },
  ];

  const pick = causes[Math.floor(Math.random() * causes.length)];
  return {
    ...pick,
    imageSource: 'Demo mode — no satellite image fetched',
    analyzed: true,
    demo: true,
    timestamp: new Date().toISOString(),
  };
}
