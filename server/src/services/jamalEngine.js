// Jamal (Endangered Wildlife) Engine
// Uses GBIF (Global Biodiversity Information Facility) API — free, no auth required.
// Aggregates museum records + field surveys for endangered species in Jordan.

const GBIF_API = 'https://api.gbif.org/v1';

const JAMAL_SITES = [
  { id: 'oryx-rum',      name: 'Arabian Oryx Sanctuary',     lat: 29.58, lng: 35.42, taxonName: 'Oryx leucoryx',        country: 'JO' },
  { id: 'bear-ajloun',   name: 'Syrian Brown Bear Zone',      lat: 32.33, lng: 35.75, taxonName: 'Ursus arctos',         country: 'JO' },
  { id: 'leopard-dana',  name: 'Arabian Leopard Territory',   lat: 30.69, lng: 35.62, taxonName: 'Panthera pardus',      country: 'JO' },
  { id: 'deer-shaumari', name: 'Shaumari Wildlife Reserve',   lat: 31.68, lng: 36.95, taxonName: 'Dama mesopotamica',    country: 'JO' },
  { id: 'houbara-badia', name: 'Houbara Bustard Zone',        lat: 32.10, lng: 37.80, taxonName: 'Chlamydotis undulata', country: 'JO' },
  { id: 'hyena-mujib',   name: 'Striped Hyena Territory',     lat: 31.47, lng: 35.63, taxonName: 'Hyaena hyaena',        country: 'JO' },
  { id: 'ibex-petra',    name: 'Nubian Ibex Zone',            lat: 30.32, lng: 35.44, taxonName: 'Capra nubiana',        country: 'JO' },
  { id: 'wolf-badia',    name: 'Arabian Wolf Corridor',       lat: 31.50, lng: 38.00, taxonName: 'Canis lupus',          country: 'JO' },
];

// Activity score: log-scale of occurrence count
function computeActivityScore(count) {
  return Math.min(100, Math.round(Math.log1p(count) * 18));
}

export async function updateJamalData(db, broadcast) {
  console.log('[Jamal] Running Endangered Wildlife Engine (GBIF)...');
  const results = [];

  for (const site of JAMAL_SITES) {
    try {
      // Get total occurrence count for the species in Jordan
      const countParams = new URLSearchParams({
        scientificName: site.taxonName,
        country:        site.country,
        limit:          '1',
      });

      const countRes = await fetch(`${GBIF_API}/occurrence/search?${countParams}`, {
        headers: { 'User-Agent': 'ForestGuard-AI/1.0 (jordan endangered wildlife monitoring)' },
        signal: AbortSignal.timeout(10000),
      });

      if (!countRes.ok) throw new Error(`GBIF ${countRes.status}`);
      const countData = await countRes.json();
      const obsCount  = countData.count ?? 0;

      // Get the most recent observation
      let latestDate = null;
      let latestLat  = null;
      let latestLng  = null;

      if (obsCount > 0) {
        // GBIF sorts by modified desc by default — first result is often the freshest
        const first = countData.results?.[0];
        if (first) {
          latestDate = first.eventDate ?? first.year?.toString() ?? null;
          latestLat  = first.decimalLatitude  ?? null;
          latestLng  = first.decimalLongitude ?? null;
        }
      }

      const activityScore = computeActivityScore(obsCount);

      db.prepare(`
        INSERT INTO jamal_data
          (site_id, site_name, latitude, longitude, taxon_name, obs_count_year,
           latest_obs_date, latest_lat, latest_lng, activity_score, country, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        site.id, site.name, site.lat, site.lng,
        site.taxonName, obsCount,
        latestDate,
        latestLat  !== null ? parseFloat(latestLat)  : null,
        latestLng  !== null ? parseFloat(latestLng)  : null,
        activityScore, site.country,
      );

      results.push({
        site_id: site.id, site_name: site.name, latitude: site.lat, longitude: site.lng,
        taxon_name: site.taxonName, obs_count_year: obsCount, latest_obs_date: latestDate,
        latest_lat: latestLat, latest_lng: latestLng, activity_score: activityScore, country: site.country,
      });
      console.log(`  [Jamal] ${site.name} (${site.taxonName}): ${obsCount} GBIF records`);

      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.warn(`  [Jamal] ${site.name} failed:`, err.message);
    }
  }

  if (results.length > 0) broadcast({ type: 'JAMAL_UPDATE', data: results });
  console.log(`[Jamal] Done — ${results.length}/${JAMAL_SITES.length} sites updated`);
  return results;
}
