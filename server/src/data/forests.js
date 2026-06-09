// ──────────────────────────────────────────────────────────────────────────────
// ForestGuard AI — Pan-Arab & Middle East Forest Registry
// Single source of truth for all monitored forests, reserves, and ecosystems
// ──────────────────────────────────────────────────────────────────────────────

import { getDistanceKm } from '../utils/geo.js';

// ── Country Metadata & FIRMS Bounding Boxes ─────────────────────────────────
// Each country has a bounding box used for NASA FIRMS satellite queries.
// We group small/adjacent countries into regional queries to respect rate limits.

export const COUNTRY_BOUNDS = {
  JO: { name: 'Jordan',      nameAr: 'الأردن',      nameFr: 'Jordanie',      west: 34.8, south: 29.0, east: 39.3, north: 33.5, region: 'levant' },
  LB: { name: 'Lebanon',     nameAr: 'لبنان',       nameFr: 'Liban',         west: 35.1, south: 33.0, east: 36.7, north: 34.7, region: 'levant' },
  SY: { name: 'Syria',       nameAr: 'سوريا',       nameFr: 'Syrie',         west: 35.7, south: 32.3, east: 42.4, north: 37.3, region: 'levant' },
  PS: { name: 'Palestine',   nameAr: 'فلسطين',      nameFr: 'Palestine',     west: 34.2, south: 31.2, east: 35.6, north: 32.6, region: 'levant' },
  IQ: { name: 'Iraq',        nameAr: 'العراق',      nameFr: 'Irak',          west: 38.7, south: 29.0, east: 48.6, north: 37.4, region: 'mesopotamia' },
  KW: { name: 'Kuwait',      nameAr: 'الكويت',      nameFr: 'Koweït',        west: 46.5, south: 28.5, east: 48.5, north: 30.1, region: 'gulf' },
  SA: { name: 'Saudi Arabia', nameAr: 'السعودية',    nameFr: 'Arabie saoudite', west: 34.5, south: 16.3, east: 55.7, north: 32.2, region: 'gulf' },
  BH: { name: 'Bahrain',     nameAr: 'البحرين',     nameFr: 'Bahreïn',       west: 50.3, south: 25.7, east: 50.8, north: 26.3, region: 'gulf' },
  AE: { name: 'UAE',         nameAr: 'الإمارات',    nameFr: 'Émirats arabes unis', west: 51.5, south: 22.6, east: 56.4, north: 26.1, region: 'gulf' },
  OM: { name: 'Oman',        nameAr: 'عُمان',       nameFr: 'Oman',          west: 51.9, south: 16.6, east: 59.8, north: 26.4, region: 'gulf' },
  YE: { name: 'Yemen',       nameAr: 'اليمن',       nameFr: 'Yémen',         west: 42.5, south: 12.1, east: 54.5, north: 19.0, region: 'gulf' },
  EG: { name: 'Egypt',       nameAr: 'مصر',         nameFr: 'Égypte',        west: 24.7, south: 22.0, east: 36.9, north: 31.7, region: 'north-africa' },
  LY: { name: 'Libya',       nameAr: 'ليبيا',       nameFr: 'Libye',         west: 9.3,  south: 19.5, east: 25.2, north: 33.2, region: 'north-africa' },
  TN: { name: 'Tunisia',     nameAr: 'تونس',        nameFr: 'Tunisie',       west: 7.5,  south: 30.2, east: 11.6, north: 37.5, region: 'north-africa' },
  DZ: { name: 'Algeria',     nameAr: 'الجزائر',     nameFr: 'Algérie',       west: -8.7, south: 19.0, east: 12.0, north: 37.1, region: 'north-africa' },
  MA: { name: 'Morocco',     nameAr: 'المغرب',      nameFr: 'Maroc',         west: -13.2, south: 27.6, east: -1.0, north: 35.9, region: 'north-africa' },
  MR: { name: 'Mauritania',  nameAr: 'موريتانيا',   nameFr: 'Mauritanie',    west: -17.1, south: 14.7, east: -4.8, north: 27.3, region: 'sahel' },
  SD: { name: 'Sudan',       nameAr: 'السودان',     nameFr: 'Soudan',        west: 21.8, south: 8.7,  east: 38.6, north: 22.2, region: 'sahel' },
  SO: { name: 'Somalia',     nameAr: 'الصومال',     nameFr: 'Somalie',       west: 40.9, south: -1.7, east: 51.4, north: 12.0, region: 'horn' },
  DJ: { name: 'Djibouti',    nameAr: 'جيبوتي',      nameFr: 'Djibouti',      west: 41.7, south: 10.9, east: 43.5, north: 12.7, region: 'horn' },
};

// ── Regional Query Groups ───────────────────────────────────────────────────
// For FIRMS API efficiency, we merge adjacent small countries into single queries.
export const FIRMS_QUERY_REGIONS = {
  levant:       { west: 34.2, south: 29.0, east: 42.4, north: 37.3, countries: ['JO', 'LB', 'SY', 'PS'] },
  mesopotamia:  { west: 38.7, south: 29.0, east: 48.6, north: 37.4, countries: ['IQ'] },
  gulf:         { west: 34.5, south: 12.1, east: 59.8, north: 32.2, countries: ['SA', 'KW', 'BH', 'AE', 'OM', 'YE'] },
  'north-africa': { west: -13.2, south: 19.0, east: 36.9, north: 37.5, countries: ['EG', 'LY', 'TN', 'DZ', 'MA'] },
  sahel:        { west: -17.1, south: 8.7, east: 38.6, north: 27.3, countries: ['MR', 'SD'] },
  horn:         { west: 40.9, south: -1.7, east: 51.4, north: 12.7, countries: ['SO', 'DJ'] },
};

// ── Forest Registry ─────────────────────────────────────────────────────────
// Each entry is a monitored forest, reserve, or protected ecosystem.
//
// Fields:
//   id           — unique slug (country-name)
//   name         — English name
//   nameAr       — Arabic name
//   nameFr       — French name
//   country      — ISO 3166-1 alpha-2 country code
//   lat, lng     — center coordinates (WGS84)
//   radius       — monitoring radius in km
//   area         — approximate area in km^2 (0 if unknown)
//   forestType   — biome / vegetation classification
//   elevation    — average elevation in meters
//   primaryThreats — array of main threat types
//   unescoStatus — UNESCO designation or null

export const FORESTS = [
  // ── Jordan (8) ──────────────────────────────────────────────────────────────
  { id: 'jo-ajloun',     name: 'Ajloun Forest',      nameAr: 'غابة عجلون',        nameFr: 'Forêt d\'Ajloun',        country: 'JO', lat: 32.3333, lng: 35.7500, radius: 15, area: 13,  forestType: 'Mediterranean',  elevation: 1100, primaryThreats: ['fire', 'logging'],            unescoStatus: null },
  { id: 'jo-dibeen',     name: 'Dibeen Forest',       nameAr: 'غابة دبين',         nameFr: 'Forêt de Dibeen',        country: 'JO', lat: 32.2833, lng: 35.8167, radius: 10, area: 8.5, forestType: 'Mediterranean',  elevation: 800,  primaryThreats: ['fire', 'desertification'],   unescoStatus: null },
  { id: 'jo-dana',       name: 'Dana Reserve',        nameAr: 'محمية دانا',         nameFr: 'Réserve de Dana',        country: 'JO', lat: 30.6500, lng: 35.6167, radius: 20, area: 308, forestType: 'Mixed arid',     elevation: 1500, primaryThreats: ['desertification', 'fire'],    unescoStatus: 'UNESCO Biosphere' },
  { id: 'jo-alzai',      name: 'Al-Zai Forest',       nameAr: 'غابة الزي',          nameFr: 'Forêt d\'Al-Zai',        country: 'JO', lat: 32.1000, lng: 35.8000, radius: 5,  area: 3,   forestType: 'Mediterranean',  elevation: 700,  primaryThreats: ['fire', 'logging'],            unescoStatus: null },
  { id: 'jo-barqash',    name: 'Barqash Forest',      nameAr: 'غابة برقش',          nameFr: 'Forêt de Barqash',       country: 'JO', lat: 32.4667, lng: 35.7333, radius: 8,  area: 5,   forestType: 'Mediterranean',  elevation: 900,  primaryThreats: ['fire'],                       unescoStatus: null },
  { id: 'jo-ishtafina',  name: 'Ishtafina Forest',    nameAr: 'غابة اشتفينا',       nameFr: 'Forêt d\'Ishtafina',     country: 'JO', lat: 32.3500, lng: 35.7167, radius: 6,  area: 4,   forestType: 'Mediterranean',  elevation: 950,  primaryThreats: ['fire', 'logging'],            unescoStatus: null },
  { id: 'jo-azraq',      name: 'Azraq Reserve',       nameAr: 'محمية الأزرق',        nameFr: 'Réserve d\'Azraq',       country: 'JO', lat: 31.8333, lng: 36.8167, radius: 10, area: 12,  forestType: 'Wetland',        elevation: 520,  primaryThreats: ['desertification', 'pollution'], unescoStatus: 'Ramsar Wetland' },
  { id: 'jo-mujib',      name: 'Mujib Reserve',       nameAr: 'محمية الموجب',        nameFr: 'Réserve du Mujib',       country: 'JO', lat: 31.4667, lng: 35.6333, radius: 15, area: 212, forestType: 'Rift valley',    elevation: 400,  primaryThreats: ['fire', 'desertification'],   unescoStatus: null },

  // ── Lebanon (5) ─────────────────────────────────────────────────────────────
  { id: 'lb-cedars',     name: 'Cedars of God',       nameAr: 'أرز الرب',           nameFr: 'Cèdres de Dieu',         country: 'LB', lat: 34.2467, lng: 36.0631, radius: 5,  area: 2.5, forestType: 'Cedar montane',  elevation: 1900, primaryThreats: ['fire', 'desertification'],   unescoStatus: 'UNESCO World Heritage' },
  { id: 'lb-shouf',      name: 'Shouf Biosphere',     nameAr: 'محمية أرز الشوف',     nameFr: 'Biosphère du Chouf',      country: 'LB', lat: 33.6667, lng: 35.6833, radius: 15, area: 550, forestType: 'Cedar-oak mixed', elevation: 1400, primaryThreats: ['fire', 'logging'],            unescoStatus: 'UNESCO Biosphere' },
  { id: 'lb-ehden',      name: 'Horsh Ehden',         nameAr: 'حرش إهدن',           nameFr: 'Horsh Ehden',             country: 'LB', lat: 34.3083, lng: 35.9917, radius: 5,  area: 10,  forestType: 'Cedar-fir mixed', elevation: 1500, primaryThreats: ['fire'],                       unescoStatus: null },
  { id: 'lb-tannourine', name: 'Tannourine Cedars',   nameAr: 'أرز تنورين',          nameFr: 'Cèdres de Tannourine',   country: 'LB', lat: 34.2167, lng: 35.9333, radius: 4,  area: 6,   forestType: 'Cedar montane',  elevation: 1700, primaryThreats: ['fire', 'logging'],            unescoStatus: null },
  { id: 'lb-bentael',    name: 'Bentael Reserve',     nameAr: 'محمية بنتاعل',        nameFr: 'Réserve de Bentael',      country: 'LB', lat: 34.1167, lng: 35.6667, radius: 3,  area: 2,   forestType: 'Mediterranean',  elevation: 600,  primaryThreats: ['fire', 'pollution'],          unescoStatus: null },

  // ── Palestine (3) ───────────────────────────────────────────────────────────
  { id: 'ps-wadi-qana',  name: 'Wadi Qana',           nameAr: 'وادي قانا',           nameFr: 'Wadi Qana',               country: 'PS', lat: 32.1500, lng: 35.1000, radius: 5,  area: 10,  forestType: 'Mediterranean',  elevation: 400,  primaryThreats: ['logging', 'pollution'],       unescoStatus: null },
  { id: 'ps-um-al-rihan', name: 'Um Al-Rihan Forest', nameAr: 'غابة أم الريحان',     nameFr: 'Forêt d\'Um Al-Rihan',    country: 'PS', lat: 32.4500, lng: 35.2333, radius: 4,  area: 6,   forestType: 'Mediterranean',  elevation: 500,  primaryThreats: ['fire', 'logging'],            unescoStatus: null },
  { id: 'ps-battir',     name: 'Battir Terraces',     nameAr: 'مصاطب بتير',          nameFr: 'Terrasses de Battir',     country: 'PS', lat: 31.7222, lng: 35.1333, radius: 3,  area: 3.5, forestType: 'Terraced olive', elevation: 700,  primaryThreats: ['desertification'],            unescoStatus: 'UNESCO World Heritage' },

  // ── Syria (3) ───────────────────────────────────────────────────────────────
  { id: 'sy-slunfeh',    name: 'Slunfeh Forest',      nameAr: 'غابة صلنفة',          nameFr: 'Forêt de Slunfeh',        country: 'SY', lat: 35.7833, lng: 36.2000, radius: 10, area: 25,  forestType: 'Mediterranean',  elevation: 1200, primaryThreats: ['fire', 'logging'],            unescoStatus: null },
  { id: 'sy-al-fronloq', name: 'Al-Fronloq Forest',   nameAr: 'غابة الفرنلق',        nameFr: 'Forêt d\'Al-Fronloq',     country: 'SY', lat: 35.7333, lng: 35.9833, radius: 8,  area: 15,  forestType: 'Mediterranean',  elevation: 800,  primaryThreats: ['fire'],                       unescoStatus: null },
  { id: 'sy-latakia',    name: 'Latakia Forests',     nameAr: 'غابات اللاذقية',       nameFr: 'Forêts de Lattaquié',     country: 'SY', lat: 35.5167, lng: 35.7833, radius: 15, area: 80,  forestType: 'Mediterranean',  elevation: 600,  primaryThreats: ['fire', 'logging'],            unescoStatus: null },

  // ── Iraq (4) ────────────────────────────────────────────────────────────────
  { id: 'iq-halgurd',    name: 'Halgurd-Sakran',      nameAr: 'هلگورد-ساكران',       nameFr: 'Halgurd-Sakran',          country: 'IQ', lat: 36.7333, lng: 44.8833, radius: 20, area: 1100, forestType: 'Mountain oak',  elevation: 2400, primaryThreats: ['fire', 'logging'],            unescoStatus: null },
  { id: 'iq-barzan',     name: 'Barzan Forests',      nameAr: 'غابات بارزان',        nameFr: 'Forêts de Barzan',        country: 'IQ', lat: 36.9167, lng: 44.0833, radius: 15, area: 200, forestType: 'Mountain oak',  elevation: 1800, primaryThreats: ['fire'],                       unescoStatus: null },
  { id: 'iq-dukan',      name: 'Dukan Lake Forests',  nameAr: 'غابات بحيرة دوكان',   nameFr: 'Forêts du lac Dukan',     country: 'IQ', lat: 35.9500, lng: 44.9833, radius: 12, area: 90,  forestType: 'Oak woodland',  elevation: 700,  primaryThreats: ['fire', 'desertification'],   unescoStatus: null },
  { id: 'iq-marshlands',  name: 'Mesopotamian Marshlands', nameAr: 'أهوار بلاد الرافدين', nameFr: 'Marais mésopotamiens', country: 'IQ', lat: 31.0333, lng: 47.0333, radius: 30, area: 6000, forestType: 'Wetland marsh', elevation: 3,    primaryThreats: ['desertification', 'pollution'], unescoStatus: 'UNESCO World Heritage' },

  // ── Morocco (6) ─────────────────────────────────────────────────────────────
  { id: 'ma-ifrane',     name: 'Ifrane Cedar Forest', nameAr: 'غابة أرز إفران',      nameFr: 'Cédraie d\'Ifrane',       country: 'MA', lat: 33.5333, lng: -5.1167, radius: 20, area: 500, forestType: 'Atlas cedar',    elevation: 1800, primaryThreats: ['fire', 'logging'],            unescoStatus: null },
  { id: 'ma-talassemtane', name: 'Talassemtane',      nameAr: 'تالاسمطان',           nameFr: 'Talassemtane',            country: 'MA', lat: 35.1333, lng: -5.1333, radius: 15, area: 580, forestType: 'Fir-cedar mixed', elevation: 1500, primaryThreats: ['fire'],                       unescoStatus: 'National Park' },
  { id: 'ma-toubkal',    name: 'Toubkal National Park', nameAr: 'منتزه توبقال',       nameFr: 'Parc national du Toubkal', country: 'MA', lat: 31.0597, lng: -7.9150, radius: 18, area: 380, forestType: 'High Atlas juniper', elevation: 2500, primaryThreats: ['fire', 'desertification'],   unescoStatus: 'National Park' },
  { id: 'ma-souss-massa', name: 'Souss-Massa',        nameAr: 'سوس ماسة',            nameFr: 'Souss-Massa',             country: 'MA', lat: 30.0500, lng: -9.6500, radius: 15, area: 340, forestType: 'Argan woodland', elevation: 200,  primaryThreats: ['desertification', 'logging'], unescoStatus: 'UNESCO Biosphere' },
  { id: 'ma-mamora',     name: 'Mamora Forest',       nameAr: 'غابة المعمورة',        nameFr: 'Forêt de la Mamora',      country: 'MA', lat: 34.0500, lng: -6.6500, radius: 25, area: 1300, forestType: 'Cork oak',      elevation: 150,  primaryThreats: ['logging', 'desertification'], unescoStatus: null },
  { id: 'ma-rif',        name: 'Rif Mountains Forests', nameAr: 'غابات جبال الريف',   nameFr: 'Forêts du Rif',           country: 'MA', lat: 35.0000, lng: -4.5000, radius: 20, area: 700, forestType: 'Mediterranean oak', elevation: 1200, primaryThreats: ['fire', 'logging'],          unescoStatus: null },

  // ── Algeria (5) ─────────────────────────────────────────────────────────────
  { id: 'dz-djurdjura',  name: 'Djurdjura National Park', nameAr: 'منتزه جرجرة',      nameFr: 'Parc national du Djurdjura', country: 'DZ', lat: 36.4500, lng: 4.0500,  radius: 15, area: 185, forestType: 'Atlas cedar',    elevation: 1800, primaryThreats: ['fire', 'logging'],            unescoStatus: 'UNESCO Biosphere' },
  { id: 'dz-chrea',      name: 'Chrea National Park', nameAr: 'منتزه الشريعة',        nameFr: 'Parc national de Chréa',  country: 'DZ', lat: 36.4333, lng: 2.8833,  radius: 10, area: 260, forestType: 'Atlas cedar',    elevation: 1500, primaryThreats: ['fire'],                       unescoStatus: 'UNESCO Biosphere' },
  { id: 'dz-theniet',    name: 'Theniet El Had',      nameAr: 'ثنية الأحد',           nameFr: 'Theniet El Had',          country: 'DZ', lat: 35.8667, lng: 2.0167,  radius: 8,  area: 34,  forestType: 'Atlas cedar',    elevation: 1400, primaryThreats: ['fire', 'logging'],            unescoStatus: 'National Park' },
  { id: 'dz-elkala',     name: 'El Kala National Park', nameAr: 'منتزه القالة',        nameFr: 'Parc national d\'El Kala', country: 'DZ', lat: 36.8500, lng: 8.4333,  radius: 15, area: 800, forestType: 'Cork oak wetland', elevation: 100, primaryThreats: ['fire', 'pollution'],          unescoStatus: 'UNESCO Biosphere' },
  { id: 'dz-belezma',    name: 'Belezma National Park', nameAr: 'منتزه بلزمة',         nameFr: 'Parc national de Belezma', country: 'DZ', lat: 35.6333, lng: 5.9333, radius: 12, area: 262, forestType: 'Atlas cedar-pine', elevation: 1600, primaryThreats: ['fire', 'desertification'],  unescoStatus: 'National Park' },

  // ── Tunisia (3) ─────────────────────────────────────────────────────────────
  { id: 'tn-kroumirie',  name: 'Kroumirie Forests',   nameAr: 'غابات خمير',           nameFr: 'Forêts de Kroumirie',     country: 'TN', lat: 36.7500, lng: 8.5500,  radius: 20, area: 1200, forestType: 'Cork oak',      elevation: 800,  primaryThreats: ['fire', 'logging'],            unescoStatus: null },
  { id: 'tn-ichkeul',    name: 'Ichkeul National Park', nameAr: 'منتزه إشكل',          nameFr: 'Parc national de l\'Ichkeul', country: 'TN', lat: 37.1500, lng: 9.6667, radius: 10, area: 126, forestType: 'Wetland',       elevation: 50,   primaryThreats: ['pollution', 'desertification'], unescoStatus: 'UNESCO World Heritage' },
  { id: 'tn-bou-hedma',  name: 'Bou Hedma',           nameAr: 'بوهدمة',              nameFr: 'Bou Hedma',               country: 'TN', lat: 34.4833, lng: 9.3333,  radius: 10, area: 170, forestType: 'Acacia savanna', elevation: 400,  primaryThreats: ['desertification'],            unescoStatus: 'UNESCO Biosphere' },

  // ── Egypt (3) ───────────────────────────────────────────────────────────────
  { id: 'eg-saint-catherine', name: 'Saint Catherine', nameAr: 'سانت كاترين',         nameFr: 'Sainte-Catherine',        country: 'EG', lat: 28.5553, lng: 33.9753, radius: 15, area: 4350, forestType: 'Mountain desert', elevation: 1600, primaryThreats: ['desertification', 'fire'],    unescoStatus: 'UNESCO World Heritage' },
  { id: 'eg-ras-mohamed', name: 'Ras Mohamed',         nameAr: 'رأس محمد',            nameFr: 'Ras Mohammed',            country: 'EG', lat: 27.7333, lng: 34.2500, radius: 10, area: 480, forestType: 'Mangrove coastal', elevation: 5,   primaryThreats: ['pollution'],                  unescoStatus: 'National Park' },
  { id: 'eg-wadi-rayan',  name: 'Wadi El Rayan',       nameAr: 'وادي الريان',          nameFr: 'Wadi El Rayan',           country: 'EG', lat: 29.2333, lng: 30.3333, radius: 12, area: 1759, forestType: 'Desert oasis',  elevation: 50,   primaryThreats: ['desertification'],            unescoStatus: 'UNESCO Biosphere' },

  // ── Libya (2) ───────────────────────────────────────────────────────────────
  { id: 'ly-aljabal',    name: 'Al Jabal Al Akhdar',  nameAr: 'الجبل الأخضر',         nameFr: 'Al Jabal Al Akhdar',      country: 'LY', lat: 32.8167, lng: 21.8667, radius: 25, area: 3000, forestType: 'Mediterranean maquis', elevation: 600, primaryThreats: ['fire', 'desertification'],  unescoStatus: null },
  { id: 'ly-nalut',      name: 'Nalut Forests',       nameAr: 'غابات نالوت',          nameFr: 'Forêts de Nalut',         country: 'LY', lat: 31.8667, lng: 10.9833, radius: 10, area: 50,  forestType: 'Semi-arid scrub', elevation: 700,  primaryThreats: ['desertification'],            unescoStatus: null },

  // ── Saudi Arabia (4) ────────────────────────────────────────────────────────
  { id: 'sa-asir',       name: 'Asir Mountains',      nameAr: 'جبال عسير',            nameFr: 'Montagnes de l\'Asir',    country: 'SA', lat: 18.2164, lng: 42.5000, radius: 25, area: 4500, forestType: 'Juniper woodland', elevation: 2700, primaryThreats: ['fire', 'desertification'],   unescoStatus: null },
  { id: 'sa-raghadan',   name: 'Raghadan Forest',     nameAr: 'غابة رغدان',           nameFr: 'Forêt de Raghadan',       country: 'SA', lat: 20.0000, lng: 41.4667, radius: 8,  area: 20,  forestType: 'Juniper highland', elevation: 2200, primaryThreats: ['fire'],                      unescoStatus: null },
  { id: 'sa-farasan',    name: 'Farasan Islands',     nameAr: 'جزر فرسان',            nameFr: 'Îles Farasan',            country: 'SA', lat: 16.7000, lng: 42.1167, radius: 15, area: 600, forestType: 'Mangrove coastal', elevation: 5,   primaryThreats: ['pollution'],                  unescoStatus: 'Protected Area' },
  { id: 'sa-hejaz',      name: 'Hejaz Highlands',     nameAr: 'مرتفعات الحجاز',       nameFr: 'Hauts plateaux du Hedjaz', country: 'SA', lat: 21.5000, lng: 40.5000, radius: 20, area: 800, forestType: 'Juniper-acacia',  elevation: 2000, primaryThreats: ['fire', 'desertification'],   unescoStatus: null },

  // ── UAE (2) ─────────────────────────────────────────────────────────────────
  { id: 'ae-mangroves',  name: 'Abu Dhabi Mangroves', nameAr: 'أشجار القرم أبوظبي',   nameFr: 'Mangroves d\'Abu Dhabi',   country: 'AE', lat: 24.4500, lng: 54.6167, radius: 10, area: 75,  forestType: 'Mangrove',       elevation: 1,    primaryThreats: ['pollution', 'desertification'], unescoStatus: null },
  { id: 'ae-al-ain',     name: 'Al Ain Oasis',        nameAr: 'واحة العين',           nameFr: 'Oasis d\'Al Ain',         country: 'AE', lat: 24.2075, lng: 55.7447, radius: 5,  area: 12,  forestType: 'Palm oasis',     elevation: 300,  primaryThreats: ['desertification'],            unescoStatus: 'UNESCO World Heritage' },

  // ── Oman (2) ────────────────────────────────────────────────────────────────
  { id: 'om-dhofar',     name: 'Dhofar Cloud Forest', nameAr: 'غابات ظفار',           nameFr: 'Forêt de nuages du Dhofar', country: 'OM', lat: 17.1500, lng: 54.0833, radius: 20, area: 800, forestType: 'Tropical cloud', elevation: 900,  primaryThreats: ['desertification', 'fire'],   unescoStatus: 'UNESCO World Heritage (part)' },
  { id: 'om-jebel-akhdar', name: 'Jebel Akhdar',      nameAr: 'الجبل الأخضر',         nameFr: 'Jebel Akhdar',            country: 'OM', lat: 23.2000, lng: 57.2667, radius: 15, area: 300, forestType: 'Mountain terrace', elevation: 2000, primaryThreats: ['desertification'],            unescoStatus: null },

  // ── Yemen (2) ───────────────────────────────────────────────────────────────
  { id: 'ye-socotra',    name: 'Socotra Island',      nameAr: 'جزيرة سقطرى',          nameFr: 'Île de Socotra',          country: 'YE', lat: 12.4634, lng: 53.8237, radius: 25, area: 3625, forestType: 'Dragon blood endemic', elevation: 500, primaryThreats: ['desertification', 'fire'],   unescoStatus: 'UNESCO World Heritage' },
  { id: 'ye-haraz',      name: 'Haraz Mountains',     nameAr: 'جبال هراز',            nameFr: 'Montagnes de Haraz',      country: 'YE', lat: 15.5000, lng: 43.7833, radius: 15, area: 200, forestType: 'Terraced highland', elevation: 2500, primaryThreats: ['desertification', 'logging'], unescoStatus: null },

  // ── Kuwait (1) ──────────────────────────────────────────────────────────────
  { id: 'kw-jahra',      name: 'Jahra Nature Reserve', nameAr: 'محمية الجهراء',        nameFr: 'Réserve de Jahra',        country: 'KW', lat: 29.3333, lng: 47.7000, radius: 8,  area: 3.4, forestType: 'Coastal wetland', elevation: 5,   primaryThreats: ['pollution', 'desertification'], unescoStatus: null },

  // ── Bahrain (1) ─────────────────────────────────────────────────────────────
  { id: 'bh-tubli',      name: 'Tubli Bay Mangroves', nameAr: 'أشجار قرم خليج توبلي', nameFr: 'Mangroves de Tubli',      country: 'BH', lat: 26.1833, lng: 50.5500, radius: 4,  area: 5,   forestType: 'Mangrove',       elevation: 1,    primaryThreats: ['pollution'],                  unescoStatus: null },

  // ── Sudan (3) ───────────────────────────────────────────────────────────────
  { id: 'sd-dinder',     name: 'Dinder National Park', nameAr: 'منتزه الدندر',         nameFr: 'Parc national de Dinder', country: 'SD', lat: 12.5000, lng: 35.0000, radius: 30, area: 6500, forestType: 'Savanna woodland', elevation: 500, primaryThreats: ['fire', 'logging'],            unescoStatus: 'UNESCO Biosphere' },
  { id: 'sd-suakin',     name: 'Suakin Mangroves',    nameAr: 'أشجار قرم سواكن',      nameFr: 'Mangroves de Suakin',     country: 'SD', lat: 19.1000, lng: 37.3333, radius: 10, area: 25,  forestType: 'Mangrove',       elevation: 2,    primaryThreats: ['pollution', 'desertification'], unescoStatus: null },
  { id: 'sd-jebel-marra', name: 'Jebel Marra',        nameAr: 'جبل مرة',             nameFr: 'Jebel Marra',             country: 'SD', lat: 12.9500, lng: 24.2667, radius: 20, area: 1500, forestType: 'Volcanic highland', elevation: 2000, primaryThreats: ['fire', 'desertification'],   unescoStatus: null },

  // ── Mauritania (1) ──────────────────────────────────────────────────────────
  { id: 'mr-diawling',   name: 'Diawling National Park', nameAr: 'منتزه دياولنغ',       nameFr: 'Parc national du Diawling', country: 'MR', lat: 16.3333, lng: -16.4167, radius: 15, area: 160, forestType: 'Wetland savanna', elevation: 5,   primaryThreats: ['desertification', 'pollution'], unescoStatus: 'Ramsar Wetland' },

  // ── Somalia (2) ─────────────────────────────────────────────────────────────
  { id: 'so-cal-madow',  name: 'Cal Madow Mountains', nameAr: 'جبال كالمدو',          nameFr: 'Montagnes Cal Madow',     country: 'SO', lat: 10.7833, lng: 47.3500, radius: 20, area: 600, forestType: 'Juniper-boxwood', elevation: 2000, primaryThreats: ['logging', 'fire'],            unescoStatus: null },
  { id: 'so-jubba',      name: 'Jubba Valley',        nameAr: 'وادي جوبا',            nameFr: 'Vallée de Jubba',         country: 'SO', lat: 1.5000,  lng: 42.8333, radius: 20, area: 400, forestType: 'Riverine forest', elevation: 100,  primaryThreats: ['logging', 'desertification'], unescoStatus: null },

  // ── Djibouti (1) ────────────────────────────────────────────────────────────
  { id: 'dj-day',        name: 'Day Forest',          nameAr: 'غابة داي',             nameFr: 'Forêt du Day',            country: 'DJ', lat: 11.7667, lng: 42.6500, radius: 8,  area: 14,  forestType: 'Juniper relict',  elevation: 1300, primaryThreats: ['desertification', 'fire'],   unescoStatus: 'National Park' },
];

// ── Helper Functions ────────────────────────────────────────────────────────

const DEFAULT_ACTIVE_COUNTRIES = ['JO'];

function parseActiveCountries() {
  const rawValue = process.env.ACTIVE_COUNTRIES?.trim();
  if (!rawValue) return DEFAULT_ACTIVE_COUNTRIES;
  if (rawValue === '*') return '*';

  const countryCodes = rawValue
    .split(',')
    .map(code => code.trim().toUpperCase())
    .filter(code => COUNTRY_BOUNDS[code]);

  return countryCodes.length > 0 ? [...new Set(countryCodes)] : DEFAULT_ACTIVE_COUNTRIES;
}

const ACTIVE_COUNTRY_CODES = parseActiveCountries();

/**
 * Check whether a country is inside the currently active runtime scope.
 * @param {string} countryCode — ISO 3166-1 alpha-2
 * @returns {boolean}
 */
export function isCountryActive(countryCode) {
  if (!countryCode) return false;
  if (ACTIVE_COUNTRY_CODES === '*') return Boolean(COUNTRY_BOUNDS[countryCode.toUpperCase()]);
  return ACTIVE_COUNTRY_CODES.includes(countryCode.toUpperCase());
}

/**
 * Get all forests inside the currently active runtime scope.
 * @returns {Array}
 */
export function getActiveForests() {
  return FORESTS.filter(forest => isCountryActive(forest.country));
}

export const ACTIVE_FORESTS = getActiveForests();

function getActiveCountryCodesFromForests() {
  return [...new Set(getActiveForests().map(forest => forest.country))];
}

/**
 * Get FIRMS query regions reduced to the active country scope.
 * @returns {Record<string, {west, south, east, north, countries: string[]}>}
 */
export function getActiveFirmsRegions() {
  return Object.entries(FIRMS_QUERY_REGIONS).reduce((regions, [regionName, region]) => {
    const countries = region.countries.filter(isCountryActive);
    const bounds = getBoundsForCountries(countries);
    if (countries.length > 0 && bounds) {
      regions[regionName] = { ...bounds, countries };
    }
    return regions;
  }, {});
}

/**
 * Get all forests for a specific country.
 * @param {string} countryCode — ISO 3166-1 alpha-2
 * @returns {Array} forests in that country
 */
export function getForestsByCountry(countryCode) {
  const normalizedCountry = countryCode?.toUpperCase();
  if (!isCountryActive(normalizedCountry)) return [];
  return FORESTS.filter(f => f.country === normalizedCountry);
}

/**
 * Get unique list of all monitored countries with metadata.
 * @returns {Array<{ code, name, nameAr, nameFr, forestCount }>}
 */
export function getAllCountries() {
  const activeForests = getActiveForests();
  const countryCodes = getActiveCountryCodesFromForests();
  return countryCodes.map(code => {
    const meta = COUNTRY_BOUNDS[code];
    return {
      code,
      name: meta?.name || code,
      nameAr: meta?.nameAr || code,
      nameFr: meta?.nameFr || code,
      forestCount: activeForests.filter(f => f.country === code).length,
      region: meta?.region || 'unknown',
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Find the nearest forest to a given lat/lng.
 * @param {number} lat
 * @param {number} lng
 * @returns {{ forest: object, distance: number } | null}
 */
export function findNearestForest(lat, lng) {
  let nearest = null;
  let minDist = Infinity;
  for (const forest of getActiveForests()) {
    const dist = getDistanceKm(lat, lng, forest.lat, forest.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = forest;
    }
  }
  return nearest ? { forest: nearest, distance: minDist } : null;
}

/**
 * Get the merged bounding box for a set of country codes.
 * @param {string[]} countryCodes
 * @returns {{ west, south, east, north }}
 */
export function getBoundsForCountries(countryCodes) {
  const bounds = countryCodes
    .map(c => COUNTRY_BOUNDS[c])
    .filter(Boolean);
  if (bounds.length === 0) return null;
  return {
    west: Math.min(...bounds.map(b => b.west)),
    south: Math.min(...bounds.map(b => b.south)),
    east: Math.max(...bounds.map(b => b.east)),
    north: Math.max(...bounds.map(b => b.north)),
  };
}

/**
 * Check if coordinates fall within any monitored country's bounding box.
 * @param {number} lat
 * @param {number} lng
 * @returns {{ valid: boolean, country: string|null }}
 */
export function isWithinAnyCountry(lat, lng) {
  for (const [code, bounds] of Object.entries(COUNTRY_BOUNDS)) {
    if (!isCountryActive(code)) continue;
    if (lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east) {
      return { valid: true, country: code };
    }
  }
  return { valid: false, country: null };
}

/**
 * Find a forest by its unique ID.
 * @param {string} forestId
 * @returns {object|undefined}
 */
export function getForestById(forestId) {
  return FORESTS.find(f => f.id === forestId);
}

/**
 * Get forests near a coordinate within a given radius (km).
 * @param {number} lat
 * @param {number} lng
 * @param {number} radiusKm
 * @returns {Array<{ forest: object, distance: number }>}
 */
export function getForestsNearPoint(lat, lng, radiusKm = 50) {
  return getActiveForests()
    .map(forest => ({ forest, distance: getDistanceKm(lat, lng, forest.lat, forest.lng) }))
    .filter(entry => entry.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}
