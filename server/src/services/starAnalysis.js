/**
 * Star Identification Service
 *
 * Uses Google Gemini Flash (free tier: 1500 req/day) to analyze a user-uploaded
 * photo of a celestial object. It first checks whether the image is a *genuine*
 * photograph of a star/celestial object (vs. a drawing, AI-generated render, or
 * an ordinary object) — the realism gate — then identifies the object and
 * returns information about it.
 *
 * realism_verdict:
 *   genuine        — a real photograph of a star / celestial object
 *   suspect        — possibly real but unclear, low quality, or edited
 *   not_celestial  — not a star/sky photo (drawing, AI render, random object)
 *
 * object_type:
 *   star | planet | constellation | galaxy | nebula | moon | other | unknown
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
 * Build a structured prompt for Gemini to verify and identify a star image.
 */
function buildStarPrompt() {
  return `You are an expert astronomer and astrophotography analyst. A user uploaded an image claiming it shows a star or celestial object.

## Your tasks
1. REALISM CHECK (most important): Decide whether this is a *genuine photograph* of the night sky / a star / a celestial object, or whether it is a drawing, illustration, AI-generated render, screenshot, or an ordinary non-celestial object. Be skeptical.
2. IDENTIFICATION: If it is (or plausibly is) a celestial object, identify the most likely object — a named star (e.g. Sirius, Vega), a planet, a constellation, a galaxy, a nebula, or the Moon. If you cannot identify a specific named object, set object_type to its general category (or "unknown") and leave the name generic.
3. INFORMATION: Provide concise factual information about the identified object.

## Rules
- If realism_verdict is "not_celestial", still fill the identification fields with your best description of what the image actually shows (e.g. object_name_en: "Hand-drawn star").
- Numbers (apparent_magnitude, distance_ly) must be numbers or null if unknown. Do not invent precise figures for unidentifiable objects.
- Keep Arabic fields in fluent Modern Standard Arabic.

Respond ONLY with a valid JSON object (no markdown, no text outside the JSON):
{
  "is_real_photo": <true|false>,
  "realism_score": <0-100>,
  "realism_verdict": "<genuine|suspect|not_celestial>",
  "realism_reason_ar": "<one short Arabic sentence explaining the realism judgment>",
  "realism_reason_en": "<one short English sentence>",
  "object_name_ar": "<Arabic name of the object>",
  "object_name_en": "<English name of the object>",
  "object_type": "<star|planet|constellation|galaxy|nebula|moon|other|unknown>",
  "constellation_ar": "<Arabic constellation name or empty string>",
  "constellation_en": "<English constellation name or empty string>",
  "apparent_magnitude": <number or null>,
  "distance_ly": <number or null>,
  "spectral_type": "<spectral type string or empty>",
  "description_ar": "<2-3 sentence Arabic description>",
  "description_en": "<2-3 sentence English description>",
  "fun_facts": ["<short fact 1>", "<short fact 2>"],
  "confidence": <0-100>
}`;
}

/**
 * Analyze and identify a star image using Gemini Flash.
 *
 * @param {Buffer} imageBuffer - uploaded image bytes
 * @param {string} mimeType - image mime type (e.g. image/jpeg)
 * @returns {Promise<object>} - structured realism + identification result
 */
export async function analyzeStarImage(imageBuffer, mimeType) {
  const genai = getGeminiClient();

  if (!genai) {
    console.log('Gemini not configured — returning demo star analysis');
    return getDemoStarAnalysis();
  }

  try {
    const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const parts = [
      { text: buildStarPrompt() },
      {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: imageBuffer.toString('base64'),
        },
      },
    ];

    const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
    const text = result.response.text().trim();

    // Strip markdown code fences if Gemini wraps the JSON
    const jsonStr = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(jsonStr);

    return {
      ...parsed,
      analyzed: true,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Gemini star analysis failed:', err.message);
    return {
      is_real_photo: false,
      realism_score: 0,
      realism_verdict: 'suspect',
      realism_reason_ar: 'تعذّر تحليل الصورة تلقائياً.',
      realism_reason_en: 'Could not analyze the image automatically.',
      object_name_ar: 'غير محدد',
      object_name_en: 'Unknown',
      object_type: 'unknown',
      constellation_ar: '',
      constellation_en: '',
      apparent_magnitude: null,
      distance_ly: null,
      spectral_type: '',
      description_ar: 'فشل التحليل التلقائي. يرجى المحاولة بصورة أوضح.',
      description_en: 'Automatic analysis failed. Please try a clearer image.',
      fun_facts: [],
      confidence: 0,
      analyzed: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/** Demo fallback when Gemini is not configured */
function getDemoStarAnalysis() {
  const samples = [
    {
      is_real_photo: true,
      realism_score: 88,
      realism_verdict: 'genuine',
      realism_reason_ar: 'تبدو صورة فلكية حقيقية بنقاط ضوئية نجمية على خلفية مظلمة.',
      realism_reason_en: 'Appears to be a genuine astrophotograph with stellar point sources on a dark sky.',
      object_name_ar: 'الشِّعْرى اليمانية',
      object_name_en: 'Sirius',
      object_type: 'star',
      constellation_ar: 'الكلب الأكبر',
      constellation_en: 'Canis Major',
      apparent_magnitude: -1.46,
      distance_ly: 8.6,
      spectral_type: 'A1V',
      description_ar: 'الشِّعْرى اليمانية ألمع نجم في سماء الليل، وتقع في كوكبة الكلب الأكبر. هي نظام ثنائي يضم قزماً أبيض مرافقاً يُعرف بالشِّعْرى B.',
      description_en: 'Sirius is the brightest star in the night sky, located in Canis Major. It is a binary system with a white-dwarf companion known as Sirius B.',
      fun_facts: [
        'اسمها مشتق من الكلمة اليونانية "Seirios" أي المتوهّج.',
        'كانت تُستخدم قديماً للتنبؤ بفيضان النيل.',
      ],
      confidence: 90,
    },
    {
      is_real_photo: true,
      realism_score: 82,
      realism_verdict: 'genuine',
      realism_reason_ar: 'نقطة ضوء ساطعة بلون مائل للحُمرة تتسق مع رصد كوكبي حقيقي.',
      realism_reason_en: 'A bright reddish point source consistent with a genuine planetary observation.',
      object_name_ar: 'المرّيخ',
      object_name_en: 'Mars',
      object_type: 'planet',
      constellation_ar: '',
      constellation_en: '',
      apparent_magnitude: -2.0,
      distance_ly: null,
      spectral_type: '',
      description_ar: 'المرّيخ هو الكوكب الرابع من الشمس ويُعرف بالكوكب الأحمر بسبب أكاسيد الحديد على سطحه. يظهر في السماء كنقطة برتقالية مائلة للحمرة.',
      description_en: 'Mars is the fourth planet from the Sun, known as the Red Planet due to iron oxides on its surface. It appears as an orange-red point in the sky.',
      fun_facts: [
        'يضم أعلى بركان في المجموعة الشمسية، أوليمبوس مونس.',
        'يومه قريب من يوم الأرض، نحو 24.6 ساعة.',
      ],
      confidence: 84,
    },
  ];

  const pick = samples[Math.floor(Math.random() * samples.length)];
  return {
    ...pick,
    analyzed: true,
    demo: true,
    timestamp: new Date().toISOString(),
  };
}
