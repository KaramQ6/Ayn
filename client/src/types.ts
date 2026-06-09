export type Country = {
  code: string;
  name: string;
  nameAr: string;
  nameFr?: string;
  forestCount: number;
  region: string;
};

export type Forest = {
  id: string;
  name: string;
  nameAr: string;
  nameFr?: string;
  country: string;
  lat: number;
  lng: number;
  radius: number;
  area: number;
  forestType: string;
  elevation: number;
  primaryThreats: string[];
  unescoStatus: string | null;
};

export type Stats = {
  fires_24h: number;
  reports_24h: number;
  active_alerts: number;
  avg_fire_risk: number;
  forests_monitored: number;
  forests: Forest[];
};

export type FireHotspot = {
  id?: number;
  latitude: number;
  longitude: number;
  brightness?: number;
  confidence?: string | number;
  satellite?: string;
  country?: string;
  created_at?: string;
};

export type Report = {
  id?: number;
  latitude: number;
  longitude: number;
  country?: string;
  report_type: string;
  description?: string;
  status?: string;
  username?: string;
  points_awarded?: number;
  created_at?: string;
};

export type Alert = {
  id?: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'WARNING' | 'NORMAL' | string;
  type?: string;
  latitude?: number;
  longitude?: number;
  message?: string;
  sources?: string;
  confidence?: number;
  country?: string;
  resolved?: number;
  created_at?: string;
};

export type Risk = {
  id?: number;
  region: string;
  latitude: number;
  longitude: number;
  temperature?: number;
  humidity?: number;
  wind_speed?: number;
  rain_1h?: number;
  risk_score: number;
  rain_probability?: number;
  rain_label?: string;
  country?: string;
  updated_at?: string;
};



export type StatsHistory = {
  fireTrend: Array<{ date: string; count: number }>;
  alertTrend: Array<{ date: string; level: string; count: number }>;
  riskDistribution: Array<{ region: string; risk_score: number }>;
  reportsByType: Array<{ report_type: string; count: number }>;
  riskTrend: Risk[];
};

export type WsMessage = {
  type: string;
  data?: unknown;
  clientCount?: number;
  wadiId?: string;
  timestamp?: string;
  risk?: string;
  rain_mm?: number;
  Q_m3s?: string;
};

export type SolarPotentialLabel = 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'LOW';

export type SolarSite = {
  id?: number;
  site_id: string;
  latitude: number;
  longitude: number;
  ghi_w_m2: number;
  dni_w_m2: number;
  dhi_w_m2: number;
  cloud_cover_pct: number;
  uv_index: number;
  sunshine_hours: number;
  potential_score: number;
  potential_label: SolarPotentialLabel | string;
  country?: string;
  updated_at?: string;
};

export type RiyahSite = {
  id?: number;
  site_id: string;
  site_name: string;
  latitude: number;
  longitude: number;
  pm10: number;
  pm2_5: number;
  wind_speed: number;
  wind_deg: number;
  aqi: number;
  condition: string;
  country?: string;
  updated_at?: string;
};

export type BaydarSite = {
  id?: number;
  site_id: string;
  site_name: string;
  latitude: number;
  longitude: number;
  soil_moisture: number;
  temperature: number;
  et0: number;
  ndvi_proxy: number;
  crop_stress: number;
  health_label: string;
  country?: string;
  updated_at?: string;
};

export type NajjiStats = {
  flood_alerts_24h: number;
  avg_rain_mm: number;
  latest_flow_m3s: string;
  critical_wadis: number;
  wadis_monitored: number;
  readings?: Array<{ wadi_id: string; wadi_name: string; rain_mm: number; flow_m3s: number; risk_level: string }>;
};

export type NizaEvent = {
  id?: number;
  title: string;
  url?: string;
  source_domain?: string;
  event_date?: string;
  created_at?: string;
};

export type UnitMode = 'fayy' | 'najji' | 'shuaa' | 'baydar' | 'riyah' | 'niza' | 'najm' | 'jamal';

export type StargазingSite = {
  id: string;
  name: string;
  nameAr: string;
  lat: number;
  lng: number;
  darkSkyRating: number;
  elevation: number;
  bestMonths: string;
  events: string[];
  tier: 'Gold' | 'Silver' | 'Bronze';
  bortle: number;
};

export type WildlifeSite = {
  id: string;
  name: string;
  nameAr: string;
  lat: number;
  lng: number;
  species: string;
  speciesAr: string;
  status: string;
  statusAr: string;
  population: number;
  trend: string;
  habitat: string;
  color: string;
};

// DB-backed API types for Najm and Jamal engines
export type NajmSite = {
  id?: number;
  site_id: string;
  site_name: string;
  latitude: number;
  longitude: number;
  cloud_cover: number;
  visibility_km: number;
  wind_speed: number;
  precipitation: number;
  moon_phase: number;
  moon_illumination: number;
  seeing_score: number;
  seeing_label: string;
  country: string;
  updated_at?: string;
};

export type JamalSite = {
  id?: number;
  site_id: string;
  site_name: string;
  latitude: number;
  longitude: number;
  taxon_name: string;
  obs_count_year: number;
  latest_obs_date?: string;
  latest_lat?: number;
  latest_lng?: number;
  activity_score: number;
  country: string;
  updated_at?: string;
};


