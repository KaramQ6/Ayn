// server/src/data/wadis.js
// Hydrological constants for Jordanian Wadis

export const WADIS = [
  {
    id:                 'wadi_siq_petra',
    nameAr:             'وادي السيق — البتراء',
    nameEn:             'Wadi Al-Siq, Petra',
    name:               'Wadi Al-Siq, Petra',
    lat:                30.3285,
    lng:                35.4444,
    country:            'JO',
    C:                  0.55,   // limestone + rocky terrain
    A:                  42,     // area_km2: contributing catchment to Siq entrance
    threshold_m3s:      95,     // back-calculated from 2018 event
    population_at_risk: 'tourists + local residents'
  },
  {
    id:                 'wadi_mujib',
    nameAr:             'وادي الموجب',
    nameEn:             'Wadi Mujib',
    name:               'Wadi Mujib',
    lat:                31.4700,
    lng:                35.5900,
    country:            'JO',
    C:                  0.38,
    A:                  4480,
    threshold_m3s:      650,
    population_at_risk: 'Dead Sea Highway, resort areas'
  },
  {
    id:                 'wadi_zarqa_main',
    nameAr:             'وادي زرقا ماعين',
    nameEn:             'Wadi Zarqa Ma\'in',
    name:               'Wadi Zarqa Ma\'in',
    lat:                31.5600,
    lng:                35.5700,
    country:            'JO',
    C:                  0.42,
    A:                  390,
    threshold_m3s:      120,
    population_at_risk: 'Dead Sea road, hot springs visitors'
  },
  {
    id:                 'wadi_wala',
    nameAr:             'وادي الوالة',
    nameEn:             'Wadi Wala',
    name:               'Wadi Wala',
    lat:                31.5200,
    lng:                35.8400,
    country:            'JO',
    C:                  0.40,
    A:                  1820,
    threshold_m3s:      310,
    population_at_risk: 'King\'s Highway settlements'
  }
];

export function getWadiById(id) {
  return WADIS.find(w => w.id === id);
}
