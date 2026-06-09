// Najm (Stargazing Conditions) Engine
// Uses Open-Meteo free API (no key required) for real-time sky quality data
// at Jordan's 7 best stargazing sites.

const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast';

const NAJM_SITES = [
  { id: 'wadi-rum',  name: 'Wadi Rum Dark Sky Reserve', lat: 29.57, lng: 35.42, country: 'JO', darkSkyRating: 95 },
  { id: 'dana',      name: 'Dana Biosphere Reserve',     lat: 30.69, lng: 35.62, country: 'JO', darkSkyRating: 88 },
  { id: 'badia',     name: 'Northern Badia Desert',      lat: 32.00, lng: 37.50, country: 'JO', darkSkyRating: 85 },
  { id: 'shoubak',   name: 'Shoubak Highlands',          lat: 30.53, lng: 35.56, country: 'JO', darkSkyRating: 82 },
  { id: 'azraq',     name: 'Azraq Desert Reserve',       lat: 31.83, lng: 36.82, country: 'JO', darkSkyRating: 75 },
  { id: 'dibeen',    name: 'Dibeen Forest Observatory',  lat: 32.25, lng: 35.84, country: 'JO', darkSkyRating: 65 },
  { id: 'aqaba',     name: 'Aqaba Desert Coast',         lat: 29.50, lng: 35.01, country: 'JO', darkSkyRating: 70 },
];

// Computes moon phase (0 = new moon, 0.5 = full moon) using synodic cycle
function getMoonPhase() {
  const knownNewMoon = new Date('2000-01-06T18:14:00Z');
  const synodicPeriod = 29.53058867; // days
  const daysSince = (Date.now() - knownNewMoon.getTime()) / 86400000;
  return parseFloat(((daysSince % synodicPeriod) / synodicPeriod).toFixed(3));
}

// Approximates moon illumination from phase (0=new=0%, 0.5=full=100%)
function getMoonIllumination(phase) {
  return Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);
}

function computeSeeingScore(cloudCover, visibilityKm, windSpeed, precipitation, moonIllumination, darkSkyRating) {
  const cloudFactor = (100 - cloudCover) / 100;
  const visFactor   = Math.min(1, visibilityKm / 20);
  const windFactor  = Math.max(0, 1 - windSpeed / 30);
  const rainFactor  = precipitation < 0.1 ? 1 : 0.3;
  const moonFactor  = 1 - (moonIllumination / 100) * 0.6;
  const darkFactor  = darkSkyRating / 100;

  const raw = cloudFactor * 0.35 + visFactor * 0.15 + windFactor * 0.10
            + rainFactor * 0.15 + moonFactor * 0.15 + darkFactor * 0.10;
  return Math.round(Math.min(100, Math.max(0, raw * 100)));
}

function getSeeingLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}

export async function updateNajmData(db, broadcast) {
  console.log('[Najm] Running Stargazing Conditions Engine (Open-Meteo)...');
  const moonPhase        = getMoonPhase();
  const moonIllumination = getMoonIllumination(moonPhase);
  const results = [];

  for (const site of NAJM_SITES) {
    try {
      const params = new URLSearchParams({
        latitude:        site.lat.toString(),
        longitude:       site.lng.toString(),
        current:         'cloud_cover,visibility,wind_speed_10m,precipitation',
        wind_speed_unit: 'ms',
        timezone:        'Asia/Amman',
      });

      const res = await fetch(`${OPEN_METEO}?${params}`, {
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
      const data = await res.json();
      const cur  = data.current ?? {};

      const cloudCover    = cur.cloud_cover    ?? 50;
      const visibilityKm  = (cur.visibility    ?? 10000) / 1000;
      const windSpeed     = cur.wind_speed_10m ?? 5;
      const precipitation = cur.precipitation  ?? 0;

      const seeingScore = computeSeeingScore(cloudCover, visibilityKm, windSpeed, precipitation, moonIllumination, site.darkSkyRating);
      const seeingLabel = getSeeingLabel(seeingScore);

      db.prepare(`
        INSERT INTO najm_data
          (site_id, site_name, latitude, longitude, cloud_cover, visibility_km, wind_speed,
           precipitation, moon_phase, moon_illumination, seeing_score, seeing_label, country, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        site.id, site.name, site.lat, site.lng,
        cloudCover, parseFloat(visibilityKm.toFixed(1)), parseFloat(windSpeed.toFixed(1)),
        parseFloat(precipitation.toFixed(2)),
        moonPhase, moonIllumination,
        seeingScore, seeingLabel, site.country,
      );

      results.push({ site_id: site.id, site_name: site.name, latitude: site.lat, longitude: site.lng,
        cloud_cover: cloudCover, visibility_km: parseFloat(visibilityKm.toFixed(1)),
        wind_speed: windSpeed, precipitation, moon_phase: moonPhase, moon_illumination: moonIllumination,
        seeing_score: seeingScore, seeing_label: seeingLabel, country: site.country });
      console.log(`  [Najm] ${site.name}: score=${seeingScore} (${seeingLabel}), cloud=${cloudCover}%`);

      await new Promise(r => setTimeout(r, 150));
    } catch (err) {
      console.warn(`  [Najm] ${site.name} failed:`, err.message);
    }
  }

  if (results.length > 0) broadcast({ type: 'NAJM_UPDATE', data: results });
  console.log(`[Najm] Done — ${results.length}/${NAJM_SITES.length} sites updated`);
  return results;
}
