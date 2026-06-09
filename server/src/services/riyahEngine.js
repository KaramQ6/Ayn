// Riyah (Wind & Dust) Engine — OpenWeatherMap Air Quality + Weather APIs
// 6 monitoring stations across Jordan

const RIYAH_STATIONS = [
  { id: 'amman_center',      name: 'Amman City Center',        nameAr: 'وسط عمان',                lat: 31.9539, lng: 35.9106, country: 'JO' },
  { id: 'zarqa_industrial',  name: 'Zarqa Industrial Zone',    nameAr: 'منطقة الزرقاء الصناعية', lat: 32.0728, lng: 36.0880, country: 'JO' },
  { id: 'aqaba_port',        name: 'Aqaba Port Area',          nameAr: 'منطقة ميناء العقبة',      lat: 29.5266, lng: 35.0078, country: 'JO' },
  { id: 'irbid_north',       name: 'Irbid North Station',      nameAr: 'محطة إربد الشمالية',      lat: 32.5556, lng: 35.8500, country: 'JO' },
  { id: 'ruwaished_desert',  name: 'Ruwaished Eastern Desert', nameAr: 'الرويشد — الصحراء الشرقية', lat: 32.5000, lng: 38.2000, country: 'JO' },
  { id: 'mafraq_highway',    name: 'Mafraq Desert Highway',    nameAr: 'طريق المفرق الصحراوي',    lat: 32.3439, lng: 36.2069, country: 'JO' },
];

function computeCondition(pm10) {
  if (pm10 >= 150) return 'Hazardous';
  if (pm10 >= 100) return 'High Dust';
  if (pm10 >= 55)  return 'Moderate Dust';
  return 'Clear';
}

// Simplified US EPA linear interpolation for PM10 → AQI
function pm10ToAqi(pm10) {
  if (pm10 <= 54)  return Math.round((50 / 54) * pm10);
  if (pm10 <= 154) return Math.round(51 + ((99 / 100) * (pm10 - 55)));
  if (pm10 <= 254) return Math.round(151 + ((99 / 100) * (pm10 - 155)));
  return Math.min(500, Math.round(251 + pm10 - 255));
}

export async function updateRiyahData(db, broadcast) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.warn('[Riyah] OPENWEATHER_API_KEY not set — skipping');
    return [];
  }

  console.log('🌪️ Running Riyah (Air Quality & Wind) Engine...');
  const results = [];

  for (const station of RIYAH_STATIONS) {
    try {
      const [aqRes, wRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${station.lat}&lon=${station.lng}&appid=${apiKey}`),
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${station.lat}&lon=${station.lng}&appid=${apiKey}&units=metric`),
      ]);

      if (!aqRes.ok) throw new Error(`AQ API ${aqRes.status}`);
      if (!wRes.ok)  throw new Error(`Weather API ${wRes.status}`);

      const aqData  = await aqRes.json();
      const wData   = await wRes.json();

      const comp       = aqData.list?.[0]?.components ?? {};
      const pm10       = Math.round((comp.pm10  ?? 0) * 10) / 10;
      const pm2_5      = Math.round((comp.pm2_5 ?? 0) * 10) / 10;
      const wind_speed = Math.round((wData.wind?.speed ?? 0) * 10) / 10; // m/s
      const wind_deg   = wData.wind?.deg ?? 0;
      const condition  = computeCondition(pm10);
      const aqi        = pm10ToAqi(pm10);

      db.prepare(`
        INSERT INTO riyah_data (site_id, site_name, latitude, longitude, pm10, pm2_5, wind_speed, wind_deg, aqi, condition, country)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(station.id, station.name, station.lat, station.lng, pm10, pm2_5, wind_speed, wind_deg, aqi, condition, station.country);

      const row = { site_id: station.id, site_name: station.name, latitude: station.lat, longitude: station.lng, pm10, pm2_5, wind_speed, wind_deg, aqi, condition, country: station.country };
      results.push(row);
      console.log(`  [Riyah] ${station.name}: PM10=${pm10} µg/m³ | Wind=${wind_speed} m/s | ${condition}`);

      // Respect OWM free-tier rate limit (~1 req/sec)
      await new Promise(r => setTimeout(r, 220));
    } catch (err) {
      console.error(`  [Riyah] ❌ ${station.id}:`, err.message);
    }
  }

  if (results.length > 0) broadcast({ type: 'RIYAH_UPDATE', data: results });
  console.log(`✅ Riyah engine complete (${results.length}/${RIYAH_STATIONS.length} stations)`);
  return results;
}

export { RIYAH_STATIONS };
