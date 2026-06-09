// Solar monitoring sites across Jordan — used by solarEngine.js
// Covers geographic diversity: south desert (high potential) to northern forest (moderate)
export const SOLAR_SITES = [
  {
    id: 'wadi_rum',
    nameAr: 'وادي رم',
    nameEn: 'Wadi Rum',
    lat: 29.5758,
    lng: 35.4197,
    elevation_m: 900,
    country: 'JO',
  },
  {
    id: 'aqaba',
    nameAr: 'العقبة',
    nameEn: 'Aqaba',
    lat: 29.5321,
    lng: 35.0063,
    elevation_m: 10,
    country: 'JO',
  },
  {
    id: 'maan',
    nameAr: 'معان',
    nameEn: "Ma'an",
    lat: 30.1927,
    lng: 35.7340,
    elevation_m: 1070,
    country: 'JO',
  },
  {
    id: 'azraq',
    nameAr: 'الأزرق',
    nameEn: 'Azraq',
    lat: 31.8290,
    lng: 36.8123,
    elevation_m: 520,
    country: 'JO',
  },
  {
    id: 'amman',
    nameAr: 'عمّان',
    nameEn: 'Amman',
    lat: 31.9454,
    lng: 35.9284,
    elevation_m: 800,
    country: 'JO',
  },
  {
    id: 'jordan_valley',
    nameAr: 'غور الأردن',
    nameEn: 'Jordan Valley',
    lat: 32.0500,
    lng: 35.5500,
    elevation_m: -200,
    country: 'JO',
  },
  {
    id: 'irbid',
    nameAr: 'إربد',
    nameEn: 'Irbid',
    lat: 32.5567,
    lng: 35.8500,
    elevation_m: 617,
    country: 'JO',
  },
  {
    id: 'ajloun',
    nameAr: 'عجلون',
    nameEn: 'Ajloun',
    lat: 32.3333,
    lng: 35.7500,
    elevation_m: 1050,
    country: 'JO',
  },
];

export function getSolarSiteById(id) {
  return SOLAR_SITES.find(s => s.id === id) ?? null;
}
