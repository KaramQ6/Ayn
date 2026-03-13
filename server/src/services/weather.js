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
      if (requestCount > 0 && requestCount % 55 === 0) {
        console.log('⏳ Pausing 60s for OpenWeatherMap rate limit...');
        await new Promise(resolve => setTimeout(resolve, 60000));
      }

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

      const region = `${forest.nameAr} - ${forest.name}`;
      const riskData = {
        region,
        latitude: forest.lat,
        longitude: forest.lng,
        temperature: data.main.temp,
        humidity: data.main.humidity,
        wind_speed: data.wind.speed * 3.6, // m/s to km/h
        rain_1h: data.rain?.['1h'] || 0,
        risk_score: fwi.score,
        risk_label: fwi.riskLabel,
        fwi_components: fwi.components,
        country: forest.country,
        forestId: forest.id,
      };

      db.prepare(`
        INSERT INTO fire_risk (region, latitude, longitude, temperature, humidity, wind_speed, rain_1h, risk_score, country, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(riskData.region, riskData.latitude, riskData.longitude, riskData.temperature, riskData.humidity, riskData.wind_speed, riskData.rain_1h, riskData.risk_score, riskData.country);

      results.push(riskData);

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

function insertDemoRiskData(db, broadcast) {
  // Demo data for a representative subset of forests (avoids 60+ dummy records)
  const demoForests = FORESTS.filter((_, i) => i % 3 === 0 || i < 8); // All Jordan + every 3rd

  const demoData = demoForests.map((forest) => {
    const riskScore = Math.floor(Math.random() * 60) + 20;
    const region = `${forest.nameAr} - ${forest.name}`;
    const data = {
      region,
      latitude: forest.lat,
      longitude: forest.lng,
      temperature: 28 + Math.random() * 12,
      humidity: 20 + Math.random() * 40,
      wind_speed: 5 + Math.random() * 25,
      rain_1h: Math.random() > 0.7 ? Math.random() * 5 : 0,
      risk_score: riskScore,
      country: forest.country,
    };

    db.prepare(`
      INSERT INTO fire_risk (region, latitude, longitude, temperature, humidity, wind_speed, rain_1h, risk_score, country, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(data.region, data.latitude, data.longitude, data.temperature, data.humidity, data.wind_speed, data.rain_1h, data.risk_score, data.country);

    return data;
  });

  broadcast({ type: 'RISK_UPDATE', data: demoData });
  console.log(`🌡️ Loaded demo risk data for ${demoData.length} forests`);
  return demoData;
}
