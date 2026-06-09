/**
 * Satellite Imagery Service
 *
 * Primary:  Sentinel-2 via SentinelHub Process API (free tier: 30,000 PU/month)
 *           Resolution: 10m visible, 20m SWIR — best free option for fire analysis
 *           SWIR false-color (B12/B8A/B4) reveals:
 *             - Active fire: bright yellow/orange
 *             - Burn scars:  dark red/maroon
 *             - Healthy veg: green
 *             - Drought/stress: brown
 *
 * Fallback: NASA GIBS WMS (no API key) — MODIS True Color at 250m
 */

// ── SentinelHub helpers ────────────────────────────────────────────────────

let _shToken = null;
let _shTokenExpiry = 0;

async function getSentinelHubToken() {
  if (_shToken && Date.now() < _shTokenExpiry - 30_000) return _shToken;

  const clientId = process.env.SENTINELHUB_CLIENT_ID;
  const secret = process.env.SENTINELHUB_CLIENT_SECRET;
  if (!clientId || !secret) return null;

  const resp = await fetch('https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: secret,
    }),
  });

  if (!resp.ok) return null;
  const data = await resp.json();
  _shToken = data.access_token;
  _shTokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;
  return _shToken;
}

/**
 * Fetch a Sentinel-2 SWIR false-color image via SentinelHub Process API.
 * SWIR combo (B12, B8A, B4) is ideal for fire/burn-scar detection.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {number} radiusKm - area radius in km (default 5)
 * @returns {Promise<Buffer|null>}
 */
export async function fetchSentinel2Image(lat, lng, radiusKm = 5) {
  const token = await getSentinelHubToken();
  if (!token) return null;

  // Build bounding box from lat/lng + radius
  const deg = radiusKm / 111; // ~111 km per degree
  const bbox = [lng - deg, lat - deg, lng + deg, lat + deg];

  const evalscript = `
    //VERSION=3
    function setup() {
      return { input: ["B04","B8A","B12","dataMask"], output: { bands: 4 } };
    }
    function evaluatePixel(s) {
      // SWIR false-color: fire = bright orange/yellow, burn = dark red, veg = green
      return [s.B12 * 2.5, s.B8A * 2.5, s.B04 * 2.5, s.dataMask];
    }
  `;

  const body = {
    input: {
      bounds: { bbox, properties: { crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' } },
      data: [{
        type: 'sentinel-2-l2a',
        dataFilter: {
          timeRange: {
            from: new Date(Date.now() - 30 * 86400_000).toISOString(),
            to: new Date().toISOString(),
          },
          maxCloudCoverage: 30,
        },
      }],
    },
    output: {
      width: 512,
      height: 512,
      responses: [{ identifier: 'default', format: { type: 'image/jpeg', quality: 90 } }],
    },
    evalscript,
  };

  try {
    const resp = await fetch('https://sh.dataspace.copernicus.eu/api/v1/process', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      console.warn(`SentinelHub error: ${resp.status} ${await resp.text()}`);
      return null;
    }

    return Buffer.from(await resp.arrayBuffer());
  } catch (err) {
    console.error('SentinelHub fetch failed:', err.message);
    return null;
  }
}

/**
 * Fallback: NASA GIBS WMS — MODIS Terra True Color (250m, no API key needed).
 * Less detail than Sentinel-2 but always available.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {number} radiusKm
 * @returns {Promise<Buffer|null>}
 */
export async function fetchGIBSImage(lat, lng, radiusKm = 10) {
  const deg = radiusKm / 111;
  const minx = lng - deg, miny = lat - deg, maxx = lng + deg, maxy = lat + deg;

  const today = new Date().toISOString().split('T')[0];
  const params = new URLSearchParams({
    SERVICE: 'WMS',
    REQUEST: 'GetMap',
    VERSION: '1.3.0',
    LAYERS: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    STYLES: '',
    CRS: 'CRS:84',
    BBOX: `${minx},${miny},${maxx},${maxy}`,
    WIDTH: '512',
    HEIGHT: '512',
    FORMAT: 'image/jpeg',
    TIME: today,
  });

  const url = `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?${params}`;

  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!resp.ok) return null;
    return Buffer.from(await resp.arrayBuffer());
  } catch (err) {
    console.error('NASA GIBS fetch failed:', err.message);
    return null;
  }
}

/**
 * Get the best available satellite image for the given coordinates.
 * Tries Sentinel-2 first; falls back to NASA GIBS.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {number} radiusKm
 * @returns {Promise<{ buffer: Buffer, source: string }|null>}
 */
export async function getBestSatelliteImage(lat, lng, radiusKm = 5) {
  const s2 = await fetchSentinel2Image(lat, lng, radiusKm);
  if (s2) return { buffer: s2, source: 'Sentinel-2 (SWIR false-color, 10m)' };

  const gibs = await fetchGIBSImage(lat, lng, radiusKm + 5);
  if (gibs) return { buffer: gibs, source: 'MODIS Terra True Color (250m)' };

  return null;
}
