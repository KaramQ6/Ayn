// Shu'aa (شعاع) — Solar Irradiance Monitoring Engine
// Fetches real-time solar radiation data from Open-Meteo (free, no API key required)
// and scores each Jordan site for solar energy potential.
import { SOLAR_SITES } from '../data/solarSites.js';

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function calcPotentialScore(ghi_w_m2, cloud_cover_pct, uv_index, elevation_m) {
  // GHI normalized: full sun ~1000 W/m², typical clear-sky peak ~600–800 W/m²
  const ghiNorm    = clamp(ghi_w_m2 / 10, 0, 60);
  const cloudBonus = (100 - clamp(cloud_cover_pct, 0, 100)) * 0.30;
  // Higher elevation → thinner atmosphere → slightly more irradiance
  const elevBonus  = clamp(elevation_m / 1000, 0, 1) * 5;
  const uvBonus    = clamp((uv_index ?? 0) / 11, 0, 1) * 5;
  return Math.round(clamp(ghiNorm + cloudBonus + elevBonus + uvBonus, 0, 100));
}

function scoreToLabel(score) {
  if (score >= 80) return 'EXCELLENT';
  if (score >= 60) return 'GOOD';
  if (score >= 40) return 'MODERATE';
  return 'LOW';
}

async function fetchSolarData(lat, lng) {
  const params = new URLSearchParams({
    latitude:     lat,
    longitude:    lng,
    current:      'shortwave_radiation,direct_radiation,diffuse_radiation,direct_normal_irradiance,cloud_cover,uv_index',
    daily:        'sunshine_duration,shortwave_radiation_sum',
    timezone:     'Asia/Amman',
    forecast_days: '1',
  });

  const url = `${OPEN_METEO_BASE}?${params}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);

  const json = await res.json();
  const c = json.current ?? {};
  const d = json.daily ?? {};

  return {
    ghi_w_m2:        c.shortwave_radiation         ?? 0,
    dni_w_m2:        c.direct_normal_irradiance    ?? 0,
    dhi_w_m2:        c.diffuse_radiation           ?? 0,
    cloud_cover_pct: c.cloud_cover                 ?? 0,
    uv_index:        c.uv_index                    ?? 0,
    // sunshine_duration is in seconds — convert to hours, take today's value
    sunshine_hours:  ((d.sunshine_duration?.[0] ?? 0) / 3600),
  };
}

export async function updateSolarIrradiance(db, broadcast) {
  const results = [];
  const insert = db.prepare(`
    INSERT INTO solar_irradiance
      (site_id, latitude, longitude, ghi_w_m2, dni_w_m2, dhi_w_m2,
       cloud_cover_pct, uv_index, sunshine_hours, potential_score, potential_label, country)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const site of SOLAR_SITES) {
    try {
      const data = await fetchSolarData(site.lat, site.lng);
      const score = calcPotentialScore(
        data.ghi_w_m2,
        data.cloud_cover_pct,
        data.uv_index,
        site.elevation_m,
      );
      const label = scoreToLabel(score);

      insert.run(
        site.id,
        site.lat,
        site.lng,
        data.ghi_w_m2,
        data.dni_w_m2,
        data.dhi_w_m2,
        data.cloud_cover_pct,
        data.uv_index,
        Math.round(data.sunshine_hours * 10) / 10,
        score,
        label,
        site.country,
      );

      results.push({ site_id: site.id, ...data, potential_score: score, potential_label: label });
    } catch (err) {
      console.error(`[shuaa] Failed to fetch ${site.id}: ${err.message}`);
    }

    // Rate-limit: 500 ms between requests
    await new Promise(r => setTimeout(r, 500));
  }

  if (results.length > 0) {
    broadcast({ type: 'SOLAR_UPDATE', data: results });
  }

  return results;
}
