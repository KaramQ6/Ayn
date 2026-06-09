// Baydar (Agriculture) Engine — Open-Meteo free API
// Soil moisture, temperature, ET₀ → NDVI proxy + crop stress index

const BAYDAR_SITES = [
  { id: 'ajloun_agri',    name: 'Ajloun Agricultural Zone', nameAr: 'المنطقة الزراعية — عجلون',  lat: 32.33, lng: 35.75, country: 'JO' },
  { id: 'jordan_valley',  name: 'Jordan Valley Farms',      nameAr: 'مزارع غور الأردن',           lat: 32.15, lng: 35.62, country: 'JO' },
  { id: 'mafraq_fields',  name: 'Mafraq Agricultural Fields',nameAr: 'حقول المفرق الزراعية',       lat: 32.35, lng: 36.21, country: 'JO' },
  { id: 'baqoura_fields', name: 'Al-Baqoura Fields',         nameAr: 'حقول الباقورة',              lat: 32.62, lng: 35.61, country: 'JO' },
  { id: 'azraq_oasis',    name: 'Azraq Oasis Farms',         nameAr: 'مزارع واحة الأزرق',          lat: 31.83, lng: 36.82, country: 'JO' },
];

/**
 * NDVI proxy from shortwave radiation + soil moisture + temperature.
 * Range 0.0 – 0.95 (higher = healthier vegetation).
 */
function computeNdviProxy(shortwave_rad, soil_moisture, temperature) {
  const radFactor   = Math.min(1, (shortwave_rad ?? 400) / 800);
  const moistFactor = Math.min(1, (soil_moisture ?? 0.2) * 4);
  const tempFactor  = (temperature >= 5 && temperature <= 35) ? 1 : 0.55;
  return Math.min(0.95, Math.max(0.05, radFactor * 0.35 + moistFactor * 0.55 + tempFactor * 0.10));
}

/**
 * Crop stress index 0-100 (0=no stress, 100=severe).
 * High ET + low moisture + high temp → high stress.
 */
function computeCropStress(et0, soil_moisture, temperature) {
  const waterDeficit = Math.max(0, (et0 ?? 0.3) - (soil_moisture ?? 0.2) * 10);
  const heatStress   = Math.max(0, (temperature ?? 25) - 36) * 6;
  return Math.min(100, Math.round(waterDeficit * 18 + heatStress));
}

function healthLabel(ndvi, cropStress) {
  if (ndvi >= 0.65 && cropStress < 30) return 'Healthy';
  if (ndvi >= 0.45 || cropStress < 55) return 'Moderate';
  return 'Dry Stress';
}

function getCurrentHourIndex(times) {
  const now     = new Date();
  const padded  = (n) => String(n).padStart(2, '0');
  const hourStr = `${now.getFullYear()}-${padded(now.getMonth() + 1)}-${padded(now.getDate())}T${padded(now.getHours())}:00`;
  const idx     = times.indexOf(hourStr);
  return idx !== -1 ? idx : Math.min(now.getHours(), times.length - 1);
}

export async function updateBaydarData(db, broadcast) {
  console.log('🌾 Running Baydar (Agriculture) Engine...');
  const results = [];

  for (const site of BAYDAR_SITES) {
    try {
      const params = new URLSearchParams({
        latitude:  site.lat,
        longitude: site.lng,
        hourly:    'soil_moisture_0_to_1cm,soil_temperature_0cm,et0_fao_evapotranspiration,shortwave_radiation',
        timezone:  'Asia/Amman',
        forecast_days: 1,
      });

      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
      const data   = await res.json();
      const hourly = data.hourly;
      const idx    = getCurrentHourIndex(hourly.time ?? []);

      const soil_moisture = hourly.soil_moisture_0_to_1cm?.[idx]         ?? 0.20;
      const temperature   = hourly.soil_temperature_0cm?.[idx]            ?? 25;
      const et0           = hourly.et0_fao_evapotranspiration?.[idx]      ?? 0.30;
      const shortwave     = hourly.shortwave_radiation?.[idx]              ?? 400;

      const ndvi_proxy = parseFloat(computeNdviProxy(shortwave, soil_moisture, temperature).toFixed(3));
      const crop_stress = computeCropStress(et0, soil_moisture, temperature);
      const health = healthLabel(ndvi_proxy, crop_stress);

      db.prepare(`
        INSERT INTO baydar_data (site_id, site_name, latitude, longitude, soil_moisture, temperature, et0, ndvi_proxy, crop_stress, health_label, country)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(site.id, site.name, site.lat, site.lng, soil_moisture, temperature, et0, ndvi_proxy, crop_stress, health, site.country);

      const row = { site_id: site.id, site_name: site.name, latitude: site.lat, longitude: site.lng, soil_moisture, temperature, et0, ndvi_proxy, crop_stress, health_label: health, country: site.country };
      results.push(row);
      console.log(`  [Baydar] ${site.name}: NDVI≈${ndvi_proxy} | Stress=${crop_stress} | ${health}`);

      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`  [Baydar] ❌ ${site.id}:`, err.message);
    }
  }

  if (results.length > 0) broadcast({ type: 'BAYDAR_UPDATE', data: results });
  console.log(`✅ Baydar engine complete (${results.length}/${BAYDAR_SITES.length} sites)`);
  return results;
}

export { BAYDAR_SITES };
