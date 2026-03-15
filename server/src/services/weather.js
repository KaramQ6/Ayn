// Weather Service - Fire Risk Score Calculator
// Uses OpenWeatherMap API — Pan-Arab & Middle East coverage

import { FORESTS } from '../data/forests.js';

// Climate zone adjustments for FWI risk thresholds
// Arid regions naturally have higher baseline temperatures, so thresholds are adjusted
const CLIMATE_ADJUSTMENTS = {
  'Mediterranean':        { extremeThreshold: 85, highThreshold: 65 },
  'Cedar montane':        { extremeThreshold: 80, highThreshold: 60 },
  'Cedar-oak mixed':      { extremeThreshold: 80, highThreshold: 60 },
  'Cedar-fir mixed':      { extremeThreshold: 80, highThreshold: 60 },
  'Atlas cedar':          { extremeThreshold: 82, highThreshold: 62 },
  'Atlas cedar-pine':     { extremeThreshold: 82, highThreshold: 62 },
  'Mountain oak':         { extremeThreshold: 80, highThreshold: 60 },
  'Oak woodland':         { extremeThreshold: 82, highThreshold: 62 },
  'Cork oak':             { extremeThreshold: 82, highThreshold: 62 },
  'Cork oak wetland':     { extremeThreshold: 80, highThreshold: 60 },
  'Mediterranean oak':    { extremeThreshold: 82, highThreshold: 62 },
  'Mediterranean maquis': { extremeThreshold: 82, highThreshold: 62 },
  'Juniper woodland':     { extremeThreshold: 88, highThreshold: 70 },
  'Juniper highland':     { extremeThreshold: 88, highThreshold: 70 },
  'Juniper-acacia':       { extremeThreshold: 88, highThreshold: 70 },
  'Juniper relict':       { extremeThreshold: 85, highThreshold: 68 },
  'Juniper-boxwood':      { extremeThreshold: 85, highThreshold: 68 },
  'Fir-cedar mixed':      { extremeThreshold: 80, highThreshold: 60 },
  'High Atlas juniper':   { extremeThreshold: 88, highThreshold: 70 },
  'Argan woodland':       { extremeThreshold: 90, highThreshold: 72 },
  'Acacia savanna':       { extremeThreshold: 90, highThreshold: 72 },
  'Mangrove':             { extremeThreshold: 92, highThreshold: 75 },
  'Mangrove coastal':     { extremeThreshold: 92, highThreshold: 75 },
  'Wetland':              { extremeThreshold: 90, highThreshold: 72 },
  'Wetland marsh':        { extremeThreshold: 90, highThreshold: 72 },
  'Wetland savanna':      { extremeThreshold: 90, highThreshold: 72 },
  'Coastal wetland':      { extremeThreshold: 90, highThreshold: 72 },
  'Palm oasis':           { extremeThreshold: 92, highThreshold: 75 },
  'Desert oasis':         { extremeThreshold: 92, highThreshold: 75 },
  'Mountain desert':      { extremeThreshold: 92, highThreshold: 75 },
  'Semi-arid scrub':      { extremeThreshold: 90, highThreshold: 72 },
  'Rift valley':          { extremeThreshold: 88, highThreshold: 68 },
  'Mixed arid':           { extremeThreshold: 88, highThreshold: 68 },
  'Terraced olive':       { extremeThreshold: 85, highThreshold: 65 },
  'Terraced highland':    { extremeThreshold: 85, highThreshold: 65 },
  'Mountain terrace':     { extremeThreshold: 85, highThreshold: 65 },
  'Savanna woodland':     { extremeThreshold: 88, highThreshold: 68 },
  'Volcanic highland':    { extremeThreshold: 85, highThreshold: 65 },
  'Tropical cloud':       { extremeThreshold: 78, highThreshold: 58 },
  'Dragon blood endemic': { extremeThreshold: 85, highThreshold: 65 },
  'Riverine forest':      { extremeThreshold: 85, highThreshold: 65 },
};

const DEFAULT_CLIMATE = { extremeThreshold: 85, highThreshold: 65 };

/**
 * Fetch real precipitation probability from OpenWeatherMap 5-day/3h Forecast API.
 * The free tier returns a `pop` field (0.0–1.0) representing real meteorological
 * probability of precipitation — much more accurate than guessing from clouds.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {string} apiKey
 * @returns {Promise<{ pop: number, rain3h: number } | null>}
 */
async function fetchRainForecast(lat, lng, apiKey) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&cnt=1&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.cod != '200' || !Array.isArray(data.list) || data.list.length === 0) {
      return null;
    }

    const entry = data.list[0];
    return {
      pop: typeof entry.pop === 'number' ? Math.round(entry.pop * 100) : null,
      rain3h: entry.rain?.['3h'] || 0,
    };
  } catch {
    return null;
  }
}

export async function updateFireRisk(db, broadcast) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey || apiKey === 'your_openweather_key_here') {
    console.log('⚠️ OpenWeatherMap API key not set - using demo risk data');
    return insertDemoRiskData(db, broadcast);
  }

  const results = [];
  let requestCount = 0;

  for (const forest of FORESTS) {
    try {
      // Rate limit: OpenWeatherMap free tier = 60 calls/min
      // We make 2 calls per forest (current + forecast), so pause every 27 forests
      if (requestCount > 0 && requestCount % 54 === 0) {
        console.log('⏳ Pausing 65s for OpenWeatherMap rate limit...');
        await new Promise(resolve => setTimeout(resolve, 65000));
      }

      // --- 1. Current Weather (for temperature, humidity, wind, FWI) ---
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${forest.lat}&lon=${forest.lng}&appid=${apiKey}&units=metric`;
      const response = await fetch(url);
      requestCount++;

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error(`Weather API returned invalid JSON for ${forest.name}:`, parseErr.message);
        continue;
      }

      if (data.cod != 200) { console.error(`Weather API error for ${forest.name}:`, data.message || data.cod); continue; }

      const climate = CLIMATE_ADJUSTMENTS[forest.forestType] || DEFAULT_CLIMATE;
      const fwi = calculateFireRisk(data, climate);

      const rainAmount = data.rain?.['1h'] || 0;

      // --- 2. Forecast API (for real precipitation probability) ---
      const forecast = await fetchRainForecast(forest.lat, forest.lng, apiKey);
      requestCount++;

      let rainProbability;
      if (forecast && typeof forecast.pop === 'number') {
        // Use real meteorological precipitation probability
        rainProbability = forecast.pop;
      } else {
        // Fallback: estimate from current weather data (less accurate)
        const clouds = typeof data.clouds?.all === 'number' ? data.clouds.all : 0;
        const weatherCode = Array.isArray(data.weather) && data.weather[0]?.id ? data.weather[0].id : null;
        rainProbability = estimateRainProbability({ rainAmount, clouds, weatherCode });
      }

      const rainLabel = classifyRain({ rainAmount, rainProbability });

      const region = `${forest.nameAr} - ${forest.name}`;
      const riskData = {
        region,
        latitude: forest.lat,
        longitude: forest.lng,
        temperature: data.main.temp,
        humidity: data.main.humidity,
        wind_speed: data.wind.speed * 3.6, // m/s to km/h
        rain_1h: rainAmount,
        risk_score: fwi.score,
        rain_probability: rainProbability,
        rain_label: rainLabel,
        risk_label: fwi.riskLabel,
        fwi_components: fwi.components,
        country: forest.country,
        forestId: forest.id,
      };

      db.prepare(`
        INSERT INTO fire_risk (region, latitude, longitude, temperature, humidity, wind_speed, rain_1h, risk_score, rain_probability, rain_label, country, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        riskData.region,
        riskData.latitude,
        riskData.longitude,
        riskData.temperature,
        riskData.humidity,
        riskData.wind_speed,
        riskData.rain_1h,
        riskData.risk_score,
        riskData.rain_probability,
        riskData.rain_label,
        riskData.country
      );

      results.push(riskData);

      // Progress log every 10 forests
      if (results.length % 10 === 0) {
        console.log(`  🌡️ Progress: ${results.length}/${FORESTS.length} forests updated...`);
      }

      // Create alert if risk is HIGH or above
      if (riskData.risk_score >= climate.highThreshold) {
        const alert = {
          level: riskData.risk_score >= climate.extremeThreshold ? 'CRITICAL' : 'HIGH',
          type: 'fire_risk',
          latitude: forest.lat,
          longitude: forest.lng,
          message: `🌡️ خطر حريق ${riskData.risk_label === 'EXTREME' ? 'بالغ' : 'عالي'} في ${forest.nameAr} / ${forest.name} — مؤشر FWI: ${riskData.risk_score}/100 [${riskData.risk_label}]`,
          sources: 'WEATHER',
          confidence: riskData.risk_score,
          country: forest.country,
        };

        db.prepare(`
          INSERT INTO alerts (level, type, latitude, longitude, message, sources, confidence, country)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(alert.level, alert.type, alert.latitude, alert.longitude, alert.message, alert.sources, alert.confidence, alert.country);

        broadcast({ type: 'NEW_ALERT', data: alert });
      }
    } catch (err) {
      console.error(`Weather error for ${forest.name}:`, err.message);
    }
  }

  broadcast({ type: 'RISK_UPDATE', data: results });
  console.log(`🌡️ Updated fire risk for ${results.length}/${FORESTS.length} regions`);
  return results;
}

/**
 * Canadian Fire Weather Index (FWI) — simplified implementation
 * Based on Van Wagner (1987) equations adapted for real-time weather data.
 * Climate-zone adjusted thresholds for MENA region.
 */
function calculateFireRisk(weatherData, climate = DEFAULT_CLIMATE) {
  const temp   = weatherData.main.temp;           // °C
  const rh     = weatherData.main.humidity;        // %
  const wind   = weatherData.wind.speed * 3.6;     // km/h
  const rain   = weatherData.rain?.['1h'] || 0;    // mm in last hour

  // --- Fine Fuel Moisture Code (FFMC) ---
  const FFMCo  = 85;
  const mo     = 147.2 * (101 - FFMCo) / (59.5 + FFMCo);

  let m;
  if (rain > 0.5) {
    const rf = rain - 0.5;
    let mr;
    if (mo <= 150) {
      mr = mo + 42.5 * rf * Math.exp(-100 / (251 - mo)) * (1 - Math.exp(-6.93 / rf));
    } else {
      mr = mo + 42.5 * rf * Math.exp(-100 / (251 - mo)) * (1 - Math.exp(-6.93 / rf))
           + 0.0015 * Math.pow(mo - 150, 2) * Math.sqrt(rf);
    }
    m = Math.min(mr, 250);
  } else {
    m = mo;
  }

  const Ed = 0.942 * Math.pow(rh, 0.679)
           + 11 * Math.exp((rh - 100) / 10)
           + 0.18 * (21.1 - temp) * (1 - Math.exp(-0.115 * rh));

  if (m > Ed) {
    const ko = 0.424 * (1 - Math.pow(rh / 100, 1.7))
             + 0.0694 * Math.sqrt(wind) * (1 - Math.pow(rh / 100, 8));
    const kd = ko * 0.581 * Math.exp(0.0365 * temp);
    m = Ed + (m - Ed) * Math.pow(10, -kd);
  } else {
    const Ew = 0.618 * Math.pow(rh, 0.753)
             + 10 * Math.exp((rh - 100) / 10)
             + 0.18 * (21.1 - temp) * (1 - Math.exp(-0.115 * rh));
    if (m < Ew) {
      const k1 = 0.424 * (1 - Math.pow((100 - rh) / 100, 1.7))
               + 0.0694 * Math.sqrt(wind) * (1 - Math.pow((100 - rh) / 100, 8));
      const kw = k1 * 0.581 * Math.exp(0.0365 * temp);
      m = Ew - (Ew - m) * Math.pow(10, -kw);
    }
  }

  const FFMC = 59.5 * (250 - m) / (147.2 + m);

  // --- Duff Moisture Code (DMC) ---
  const DMCo = 6;
  const effectiveTemp = Math.max(-1.1, temp);
  const re = rain > 1.5 ? 0.92 * rain - 1.27 : 0;
  const Mo  = 20 + Math.exp(5.6348 - DMCo / 43.43);
  const b   = DMCo <= 33 ? 100 / (0.5 + 0.3 * DMCo) :
              DMCo <= 65 ? 14 - 1.3 * Math.log(DMCo) : 6.2 * Math.log(DMCo) - 17.2;
  const Mr  = re > 0 ? Mo + 1000 * re / (48.77 + b * re) : Mo;
  const Pr  = re > 0 ? 244.72 - 43.43 * Math.log(Mr - 20) : DMCo;
  const K   = 1.894 * (effectiveTemp + 1.1) * (100 - rh) * 0.0001;
  const DMC = Math.max(0, Pr + K);

  // --- Build Up Index (BUI) ---
  let BUI;
  if (DMC <= 0.4 * 15) {
    BUI = 0.8 * DMC * 15 / (DMC + 0.4 * 15);
  } else {
    BUI = DMC - (1 - 0.8 * 15 / (DMC + 0.4 * 15))
        * (0.92 + Math.pow(0.0114 * DMC, 1.7));
  }
  BUI = Math.max(0, BUI);

  // --- Initial Spread Index (ISI) ---
  const fWind = Math.exp(0.05039 * wind);
  const mFFMC = 147.2 * (101 - FFMC) / (59.5 + FFMC);
  const fF    = 91.9 * Math.exp(-0.1386 * mFFMC) * (1 + Math.pow(mFFMC, 5.31) / 4.93e7);
  const ISI   = 0.208 * fWind * fF;

  // --- Fire Weather Index (FWI) ---
  let fD;
  if (BUI <= 80) {
    fD = 0.626 * Math.pow(BUI, 0.809) + 2;
  } else {
    fD = 1000 / (25 + 108.64 * Math.exp(-0.023 * BUI));
  }
  const B   = 0.1 * ISI * fD;
  const rawFWI = B > 1 ? Math.exp(2.72 * Math.pow(0.434 * Math.log(B), 0.647)) : B;

  // --- Normalize to 0-100 and classify with climate-adjusted thresholds ---
  const normalized = Math.min(100, Math.round(rawFWI * 100 / 80));

  let riskLabel;
  if (normalized >= climate.extremeThreshold)      riskLabel = 'EXTREME';
  else if (normalized >= climate.highThreshold)     riskLabel = 'VERY_HIGH';
  else if (normalized >= 45) riskLabel = 'HIGH';
  else if (normalized >= 25) riskLabel = 'MODERATE';
  else                       riskLabel = 'LOW';

  return { score: normalized, riskLabel, components: { FFMC: Math.round(FFMC * 10) / 10, DMC: Math.round(DMC * 10) / 10, BUI: Math.round(BUI * 10) / 10, ISI: Math.round(ISI * 10) / 10, rawFWI: Math.round(rawFWI * 10) / 10 } };
}

/**
 * Fallback rain probability estimator — used ONLY when the Forecast API is unavailable.
 * Deterministic (no random jitter) — uses current weather signals to approximate POP.
 */
function estimateRainProbability({ rainAmount, clouds, weatherCode }) {
  let base = 0;

  if (typeof clouds === 'number') {
    base += clouds * 0.6;
  }

  if (typeof weatherCode === 'number') {
    if (weatherCode >= 200 && weatherCode < 300) {
      base += 40; // Thunderstorm group
    } else if (weatherCode >= 300 && weatherCode < 600) {
      base += 25; // Drizzle / Rain group
    } else if (weatherCode >= 600 && weatherCode < 700) {
      base += 10; // Snow group
    }
  }

  if (rainAmount > 0) {
    base = Math.max(base, 70 + Math.min(30, rainAmount * 5));
  }

  return Math.max(0, Math.min(100, Math.round(base)));
}

function classifyRain({ rainAmount, rainProbability }) {
  if (rainAmount === 0 && rainProbability < 25) return 'NONE';
  if (rainAmount < 1 && rainProbability < 40) return 'LIGHT';
  if (rainAmount < 3 || rainProbability < 70) return 'MODERATE';
  return 'HEAVY';
}

// Climate-realistic rain probability ranges by forest biome.
// These reflect typical March precipitation patterns in the MENA region.
const BIOME_RAIN_RANGES = {
  'Mediterranean':        { minPop: 25, maxPop: 55, rainChance: 0.4 },
  'Cedar montane':        { minPop: 30, maxPop: 60, rainChance: 0.45 },
  'Cedar-oak mixed':      { minPop: 30, maxPop: 60, rainChance: 0.45 },
  'Cedar-fir mixed':      { minPop: 30, maxPop: 60, rainChance: 0.45 },
  'Atlas cedar':          { minPop: 25, maxPop: 55, rainChance: 0.40 },
  'Atlas cedar-pine':     { minPop: 25, maxPop: 55, rainChance: 0.40 },
  'Mountain oak':         { minPop: 20, maxPop: 50, rainChance: 0.35 },
  'Oak woodland':         { minPop: 20, maxPop: 45, rainChance: 0.30 },
  'Cork oak':             { minPop: 25, maxPop: 55, rainChance: 0.40 },
  'Cork oak wetland':     { minPop: 35, maxPop: 65, rainChance: 0.50 },
  'Mediterranean oak':    { minPop: 25, maxPop: 50, rainChance: 0.35 },
  'Mediterranean maquis': { minPop: 20, maxPop: 45, rainChance: 0.30 },
  'Juniper woodland':     { minPop: 10, maxPop: 30, rainChance: 0.20 },
  'Juniper highland':     { minPop: 10, maxPop: 30, rainChance: 0.20 },
  'Juniper-acacia':       { minPop: 8,  maxPop: 25, rainChance: 0.15 },
  'Juniper relict':       { minPop: 10, maxPop: 30, rainChance: 0.20 },
  'Juniper-boxwood':      { minPop: 12, maxPop: 35, rainChance: 0.25 },
  'Fir-cedar mixed':      { minPop: 30, maxPop: 60, rainChance: 0.45 },
  'High Atlas juniper':   { minPop: 10, maxPop: 30, rainChance: 0.20 },
  'Argan woodland':       { minPop: 8,  maxPop: 25, rainChance: 0.15 },
  'Acacia savanna':       { minPop: 5,  maxPop: 20, rainChance: 0.10 },
  'Mangrove':             { minPop: 15, maxPop: 40, rainChance: 0.25 },
  'Mangrove coastal':     { minPop: 10, maxPop: 35, rainChance: 0.20 },
  'Wetland':              { minPop: 35, maxPop: 65, rainChance: 0.50 },
  'Wetland marsh':        { minPop: 30, maxPop: 60, rainChance: 0.45 },
  'Wetland savanna':      { minPop: 25, maxPop: 55, rainChance: 0.40 },
  'Coastal wetland':      { minPop: 25, maxPop: 55, rainChance: 0.40 },
  'Palm oasis':           { minPop: 3,  maxPop: 15, rainChance: 0.08 },
  'Desert oasis':         { minPop: 2,  maxPop: 12, rainChance: 0.05 },
  'Mountain desert':      { minPop: 5,  maxPop: 20, rainChance: 0.10 },
  'Semi-arid scrub':      { minPop: 5,  maxPop: 20, rainChance: 0.10 },
  'Rift valley':          { minPop: 15, maxPop: 40, rainChance: 0.25 },
  'Mixed arid':           { minPop: 10, maxPop: 30, rainChance: 0.15 },
  'Terraced olive':       { minPop: 25, maxPop: 50, rainChance: 0.35 },
  'Terraced highland':    { minPop: 20, maxPop: 45, rainChance: 0.30 },
  'Mountain terrace':     { minPop: 15, maxPop: 40, rainChance: 0.25 },
  'Savanna woodland':     { minPop: 10, maxPop: 35, rainChance: 0.20 },
  'Volcanic highland':    { minPop: 15, maxPop: 40, rainChance: 0.25 },
  'Tropical cloud':       { minPop: 40, maxPop: 70, rainChance: 0.55 },
  'Dragon blood endemic': { minPop: 10, maxPop: 30, rainChance: 0.15 },
  'Riverine forest':      { minPop: 20, maxPop: 45, rainChance: 0.30 },
};
const DEFAULT_BIOME_RAIN = { minPop: 15, maxPop: 40, rainChance: 0.25 };

/**
 * Deterministic hash-based pseudo-random — gives consistent per-forest values
 * across restarts (not truly random, but realistic and reproducible).
 */
function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  h = (h ^ (h >>> 16)) * 0x45d9f3b;
  h = (h ^ (h >>> 16)) * 0x45d9f3b;
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967295; // 0.0 – 1.0
}

function insertDemoRiskData(db, broadcast) {
  // Demo data for a representative subset of forests (avoids 60+ dummy records)
  const demoForests = FORESTS.filter((_, i) => i % 3 === 0 || i < 8); // All Jordan + every 3rd

  const demoData = demoForests.map((forest) => {
    const riskScore = Math.floor(Math.random() * 60) + 20;
    const region = `${forest.nameAr} - ${forest.name}`;

    // Climate-realistic rain probability based on biome
    const biomeRain = BIOME_RAIN_RANGES[forest.forestType] || DEFAULT_BIOME_RAIN;
    const r = seededRandom(forest.id + '-rain');
    const hasRain = r < biomeRain.rainChance;
    const rainPop = Math.round(biomeRain.minPop + r * (biomeRain.maxPop - biomeRain.minPop));
    const rainAmount = hasRain ? +(r * 4).toFixed(1) : 0;

    const data = {
      region,
      latitude: forest.lat,
      longitude: forest.lng,
      temperature: 28 + Math.random() * 12,
      humidity: 20 + Math.random() * 40,
      wind_speed: 5 + Math.random() * 25,
      rain_1h: rainAmount,
      risk_score: riskScore,
      rain_probability: rainPop,
      rain_label: classifyRain({ rainAmount, rainProbability: rainPop }),
      country: forest.country,
    };

    db.prepare(`
      INSERT INTO fire_risk (region, latitude, longitude, temperature, humidity, wind_speed, rain_1h, risk_score, rain_probability, rain_label, country, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      data.region,
      data.latitude,
      data.longitude,
      data.temperature,
      data.humidity,
      data.wind_speed,
      data.rain_1h,
      data.risk_score,
      data.rain_probability,
      data.rain_label,
      data.country
    );

    return data;
  });

  broadcast({ type: 'RISK_UPDATE', data: demoData });
  console.log(`🌡️ Loaded demo risk data for ${demoData.length} forests (climate-realistic rain)`);
  return demoData;
}
