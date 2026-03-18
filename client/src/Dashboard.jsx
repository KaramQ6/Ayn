import React, { useState, useEffect, useCallback, lazy, Suspense, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Target, Flame, FileText, AlertTriangle, Thermometer, TreePine, Map, Bell, ArrowLeft, Radio, CheckCircle, TrendingUp, Plus, Wifi, WifiOff, Brain, Shield, Play, Square, Trophy, Globe, ChevronDown, Layers, Users, Star, Search, Compass } from 'lucide-react';
const AnalyticsPanel = lazy(() => import('./AnalyticsPanel'));
const ReportForm = lazy(() => import('./ReportForm'));
import ForestExplorerPanel from './ForestExplorerPanel';
import 'leaflet/dist/leaflet.css';
import './index.css';

const API_URL = '/api';
const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

// MENA overview center
const MENA_CENTER = [28, 35];
const MENA_ZOOM = 4;

// Custom Map Icons
const fireIcon = L.divIcon({ html: '<div class="w-4 h-4 rounded-full bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)] border-2 border-white/50"></div>', className: '', iconSize: [16, 16], iconAnchor: [8, 8] });
const reportIcon = L.divIcon({ html: '<div class="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)] border border-white/50"></div>', className: '', iconSize: [12, 12], iconAnchor: [6, 6] });
const clickIcon = L.divIcon({ html: '<div class="w-5 h-5 rounded-full bg-green-500 animate-bounce shadow-[0_0_20px_rgba(34,197,94,0.8)] border-2 border-white"></div>', className: '', iconSize: [20, 20], iconAnchor: [10, 10] });
const famousForestIcon = L.divIcon({ html: '<div class="relative flex items-center justify-center"><div class="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 shadow-[0_0_16px_rgba(245,158,11,0.6)] border-2 border-yellow-300/80 flex items-center justify-center"><span style="font-size:12px;line-height:1">⭐</span></div></div>', className: '', iconSize: [24, 24], iconAnchor: [12, 12] });

// Map click handler component
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Map fly-to controller
function MapController({ center, zoom }) {
  const map = useMap();
  const prevCenter = useRef(center);
  const prevZoom = useRef(zoom);
  useEffect(() => {
    if (center && zoom && (prevCenter.current !== center || prevZoom.current !== zoom)) {
      map.flyTo(center, zoom, { duration: 1.5 });
      prevCenter.current = center;
      prevZoom.current = zoom;
    }
  }, [center, zoom, map]);
  return null;
}

function Dashboard() {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState({ fires_24h: 0, reports_24h: 0, active_alerts: 0, avg_fire_risk: 0, forests_monitored: 0, forests: [] });
  const [fires, setFires] = useState([]);
  const [reports, setReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [risks, setRisks] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [clickedCoords, setClickedCoords] = useState(null);
  const [alertFilter, setAlertFilter] = useState('active'); // 'all' | 'active' | 'resolved'
  const [demoActive, setDemoActive] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const [demoEventText, setDemoEventText] = useState('');
  const [dataMode, setDataMode] = useState(null); // 'live' | 'demo'
  const [showTreeCover, setShowTreeCover] = useState(false);
  const [treeCoverOpacity, setTreeCoverOpacity] = useState(0.6);
  const [showForestExplorer, setShowForestExplorer] = useState(false);

  // Pan-Arab: country filter & scenarios
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState('ajloun');
  const [mapCenter, setMapCenter] = useState(MENA_CENTER);
  const [mapZoom, setMapZoom] = useState(MENA_ZOOM);

  // Fetch countries and scenarios on mount
  useEffect(() => {
    fetch(`${API_URL}/countries`)
      .then(r => r.json())
      .then(data => setCountries(Array.isArray(data) ? data : []))
      .catch(() => { setCountries([]); });
    fetch(`${API_URL}/demo/scenarios`).then(r => r.json()).then(data => {
      if (data.scenarios) setScenarios(data.scenarios);
    }).catch(() => {});
    fetch(`${API_URL}/data-status`).then(r => r.json()).then(data => {
      setDataMode(data.mode || 'live');
    }).catch(() => {});
  }, []);

  const countryParam = selectedCountry ? `&country=${selectedCountry}` : '';

  const fetchData = useCallback(() => {
    const cp = selectedCountry ? `?country=${selectedCountry}` : '';
    return Promise.all([
      fetch(`${API_URL}/stats${cp}`).then(r => r.json()).catch(() => stats),
      fetch(`${API_URL}/fires${cp}`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/reports${cp}`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/alerts${cp}`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/risk${cp}`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/leaderboard${cp}`).then(r => r.json()).catch(() => []),
    ]).then(([statsData, firesData, reportsData, alertsData, risksData, leaderboardData]) => {
      setStats(statsData);
      setFires(Array.isArray(firesData) ? firesData : []);
      setReports(Array.isArray(reportsData) ? reportsData : []);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      setRisks(Array.isArray(risksData) ? risksData : []);
      setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
    });
  }, [selectedCountry]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  useEffect(() => {
    let ws;
    let retryCount = 0;
    let retryTimer;
    let cancelled = false;
    const MAX_RETRIES = 10;
    function connect() {
      if (cancelled || retryCount >= MAX_RETRIES) return;
      ws = new WebSocket(WS_URL);
      ws.onopen = () => { if (!cancelled) { setConnected(true); retryCount = 0; } };
      ws.onclose = () => {
        if (cancelled) return;
        setConnected(false);
        retryCount++;
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        retryTimer = setTimeout(connect, delay);
      };
      ws.onmessage = (event) => {
        if (cancelled) return;
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch (err) {
          console.warn('WebSocket: malformed message', err);
          return;
        }
        if (msg.type === 'FIRE_UPDATE') setFires(prev => [...msg.data, ...prev].slice(0, 100));
        if (msg.type === 'NEW_REPORT') setReports(prev => [msg.data, ...prev].slice(0, 50));
        if (msg.type === 'NEW_ALERT') { setAlerts(prev => [msg.data, ...prev].slice(0, 50)); setStats(s => ({ ...s, active_alerts: s.active_alerts + 1 })); }
        if (msg.type === 'ALERT_RESOLVED') {
          setAlerts(prev => prev.map(a => a.id === msg.data.id ? msg.data : a));
          setStats(s => ({ ...s, active_alerts: Math.max(0, s.active_alerts - 1) }));
        }
        if (msg.type === 'RISK_UPDATE') setRisks(msg.data);
        // Demo mode events
        if (msg.type === 'DEMO_STARTED') {
          setDemoActive(true);
          setDemoProgress(0);
          setDemoEventText(t('dashboard.demoInit'));
          // Fly to scenario center if provided
          if (msg.data?.center) {
            setMapCenter(msg.data.center);
            setMapZoom(msg.data.zoom || 10);
          }
          fetchData();
        }
        if (msg.type === 'DEMO_EVENT') {
          const d = msg.data || {};
          const pct = (d.progress || 0) <= 1 ? (d.progress || 0) * 100 : (d.progress || 0);
          setDemoProgress(pct);
          setDemoEventText(d.description || d.event || `Event ${d.step || ''}...`);
          fetchData();
        }
        if (msg.type === 'DEMO_COMPLETE') {
          setDemoProgress(100);
          setDemoEventText(t('dashboard.demoComplete'));
          setTimeout(() => { setDemoActive(false); setDemoProgress(0); setDemoEventText(''); }, 5000);
        }
      };
    }
    connect();
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [fetchData, t]);

  const handleMapClick = useCallback((coords) => {
    setClickedCoords(coords);
    setShowReportForm(true);
  }, []);

  const handleResolveAlert = useCallback(async (alertId) => {
    try {
      const res = await fetch(`${API_URL}/alerts/${alertId}/resolve`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        setAlerts(prev => prev.map(a => a.id === alertId ? data.alert : a));
        setStats(s => ({ ...s, active_alerts: Math.max(0, s.active_alerts - 1) }));
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  }, []);

  const handleDemoToggle = useCallback(async () => {
    try {
      if (demoActive) {
        await fetch(`${API_URL}/demo/stop`);
        setDemoActive(false);
        setDemoProgress(0);
        setDemoEventText('');
        // Reset to MENA overview
        setMapCenter(MENA_CENTER);
        setMapZoom(MENA_ZOOM);
      } else {
        await fetch(`${API_URL}/demo/seed`);
        await fetch(`${API_URL}/demo/start?scenario=${selectedScenario}`);
      }
    } catch (err) {
      console.error('Demo toggle error:', err);
    }
  }, [demoActive, selectedScenario]);

  // Language switcher
  const changeLang = useCallback((lng) => {
    i18n.changeLanguage(lng);
  }, [i18n]);

  const getRiskColorClass = (score) => {
    if (score >= 65) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (score >= 45) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    if (score >= 25) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    return 'text-green-500 bg-green-500/10 border-green-500/20';
  };

  const getRiskBg = (score) => {
    if (score >= 65) return 'bg-red-500';
    if (score >= 45) return 'bg-orange-500';
    if (score >= 25) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const rainyZones = risks.filter(r => typeof r.rain_probability === 'number' && r.rain_probability >= 50).length;
  const safeRisks = Array.isArray(risks) ? risks : [];
  const avgRainProb = safeRisks.length
    ? Math.round(
        safeRisks
          .filter(r => typeof r.rain_probability === 'number')
          .reduce((sum, r) => sum + r.rain_probability, 0) /
        Math.max(1, safeRisks.filter(r => typeof r.rain_probability === 'number').length)
      )
    : 0;

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr + 'Z').getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('dashboard.time.justNow');
    if (mins < 60) return t('dashboard.time.minsAgo', { count: mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t('dashboard.time.hoursAgo', { count: hrs });
    return t('dashboard.time.daysAgo', { count: Math.floor(hrs / 24) });
  }

  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const filteredAlerts = safeAlerts.filter(a => {
    if (alertFilter === 'active') return !a.resolved;
    if (alertFilter === 'resolved') return a.resolved;
    return true;
  });

  const alertFilterLabels = {
    active: t('dashboard.alerts.active'),
    all: t('dashboard.alerts.all'),
    resolved: t('dashboard.alerts.resolved'),
  };

  const safeReports = Array.isArray(reports) ? reports : [];
  const safeCountries = Array.isArray(countries) ? countries : [];

  return (
    <div className="bg-[#050A07] min-h-screen lg:h-screen text-[var(--ui-ghost)] font-sans flex flex-col selection:bg-[var(--alert-signal)] selection:text-white relative lg:overflow-hidden">
      
      {/* SCANLINE EFFECT */}
      <div className="scanline"></div>

      {/* LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 z-[100] bg-[#050A07] flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--accent-emerald)] border-t-transparent rounded-full animate-spin"></div>
          <p className="font-data text-xs uppercase tracking-[0.3em] text-white/40 animate-pulse">{t('app.initTelemetry')}</p>
        </div>
      )}

      {/* HEADER */}
      <header className="flex-shrink-0 z-50 bg-[#0A140E]/40 backdrop-blur-md border-b border-white/5 py-2 md:py-3 px-3 md:px-6 flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-4">
        
        {/* Top Row on Mobile, Left Side on Desktop */}
        <div className="flex items-center justify-between md:justify-start w-full md:w-auto gap-3 md:gap-6">
          <div className="flex items-center gap-3 md:gap-6">
            <Link to="/" aria-label="Back to Protocol" className="flex items-center justify-center min-w-[36px] min-h-[36px] md:min-w-[44px] md:min-h-[44px] hover:text-white text-white/50 transition-colors focus:ring-2 focus:ring-[var(--alert-signal)] rounded-md outline-none">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Target className="text-[var(--accent-emerald)] w-6 h-6" />
              <div>
                <h1 className="font-bold text-sm md:text-lg tracking-tight leading-none text-white/90 whitespace-nowrap">{t('dashboard.commandCenter')}</h1>
                <p className="hidden md:block text-[10px] font-data text-white/40 uppercase tracking-widest mt-1">{t('dashboard.liveTelemetry')}</p>
              </div>
            </div>
          </div>
        </div>
        {/* Controls: Scrollable row on mobile, Right aligned on desktop */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar md:flex-wrap md:justify-end w-full md:w-auto snap-x">
          {/* Language Switcher */}
          <div className="flex items-center rounded-full border border-white/10 bg-white/5 overflow-hidden">
            {['en', 'ar', 'fr'].map(lng => (
              <button key={lng} onClick={() => changeLang(lng)}
                className={`px-2.5 py-1.5 text-[10px] font-data uppercase tracking-widest transition-colors ${i18n.language === lng ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'}`}>
                {lng.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Country Filter */}
          <div className="relative">
            <select
              value={selectedCountry}
              onChange={e => {
                setSelectedCountry(e.target.value);
                if (!e.target.value) {
                  setMapCenter(MENA_CENTER);
                  setMapZoom(MENA_ZOOM);
                }
              }}
              className="appearance-none bg-black/40 border border-white/20 rounded-full px-3 py-1.5 pe-7 text-[10px] md:text-[11px] font-data uppercase tracking-widest text-white hover:text-white hover:border-white/40 transition-colors cursor-pointer focus:outline-none focus:border-green-400/80 min-w-[140px] md:min-w-[200px]"
              aria-label={t('dashboard.filterCountry')}
            >
              <option value="">{t('dashboard.allCountries')}</option>
              {safeCountries.map(c => (
                <option key={c.code} value={c.code}>{i18n.language === 'ar' ? c.nameAr : c.name} ({c.forestCount})</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 absolute end-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          </div>

          {/* Data Mode Badge */}
          {dataMode && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-data uppercase tracking-widest ${dataMode === 'live' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10' : 'border-yellow-500/20 text-yellow-400 bg-yellow-500/10'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${dataMode === 'live' ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`}></div>
              {dataMode === 'live' ? t('dashboard.liveData', 'LIVE DATA') : t('dashboard.demoData', 'DEMO')}
            </div>
          )}

          {/* WebSocket Status */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-data uppercase tracking-widest ${connected ? 'border-green-500/20 text-green-500 bg-green-500/10' : 'border-red-500/20 text-red-500 bg-red-500/10 animate-pulse'}`}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? t('dashboard.live') : t('dashboard.reconnecting')}
          </div>

          {/* Analytics Button */}
          <button onClick={() => setShowAnalytics(true)} aria-label="Open analytics dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-data uppercase tracking-widest text-white/60 hover:text-white hover:border-white/20 bg-white/5 transition-colors">
            <TrendingUp className="w-3 h-3" /> {t('dashboard.analytics')}
          </button>

          {/* Forest Explorer Button */}
          <button onClick={() => setShowForestExplorer(true)} aria-label="Explore forests"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/30 text-[10px] font-data uppercase tracking-widest text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/50 bg-emerald-500/10 transition-colors">
            <Compass className="w-3 h-3" /> {t('dashboard.explore', 'Explore')}
          </button>

          {/* Community Button */}
          <Link to="/community" aria-label="Open community"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-500/30 text-[10px] font-data uppercase tracking-widest text-purple-400 hover:text-purple-300 hover:border-purple-500/50 bg-purple-500/10 transition-colors no-underline">
            <Users className="w-3 h-3" /> {t('dashboard.community', 'Community')}
          </Link>

          {/* Report Button */}
          <button onClick={() => setShowReportForm(true)} aria-label="Submit a new report"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-500/30 text-[10px] font-data uppercase tracking-widest text-green-400 hover:text-green-300 hover:border-green-500/50 bg-green-500/10 transition-colors">
            <Plus className="w-3 h-3" /> {t('dashboard.report')}
          </button>

          {/* Demo Scenario Selector + Toggle */}
          <div className="flex items-center gap-1">
            {!demoActive && scenarios.length > 0 && (
              <div className="relative">
                <select value={selectedScenario} onChange={e => setSelectedScenario(e.target.value)}
                  className="appearance-none bg-yellow-500/5 border border-yellow-500/20 rounded-s-full px-3 py-1.5 pe-7 text-[10px] font-data uppercase tracking-widest text-yellow-400/70 hover:text-yellow-300 transition-colors cursor-pointer focus:outline-none focus:border-yellow-500/50"
                  aria-label={t('dashboard.selectScenario')}>
                  {scenarios.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 absolute end-2 top-1/2 -translate-y-1/2 text-yellow-400/40 pointer-events-none" />
              </div>
            )}
            <button onClick={handleDemoToggle} aria-label={demoActive ? 'Stop demo scenario' : 'Start demo scenario'}
              className={`flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-data uppercase tracking-widest transition-colors ${!demoActive && scenarios.length > 0 ? 'rounded-e-full' : 'rounded-full'} ${demoActive ? 'border-red-500/30 text-red-400 hover:text-red-300 hover:border-red-500/50 bg-red-500/10' : 'border-yellow-500/30 text-yellow-400 hover:text-yellow-300 hover:border-yellow-500/50 bg-yellow-500/10'}`}>
              {demoActive ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {demoActive ? t('dashboard.stopDemo') : t('dashboard.demo')}
            </button>
          </div>
        </div>
      </header>


      {/* DEMO MODE BANNER */}
      {demoActive && (
        <div className="sticky top-[57px] z-40 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border-b border-yellow-500/20 backdrop-blur-md px-6 py-2">
          <div className="max-w-[1600px] mx-auto flex items-center gap-4">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
              <span className="text-[10px] font-data uppercase tracking-widest text-yellow-400 font-bold">{t('dashboard.demoActive')}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${demoProgress}%` }}></div>
              </div>
            </div>
            <span className="text-[9px] font-data text-white/50 flex-shrink-0 w-8 text-right">{Math.round(demoProgress)}%</span>
            <span className="text-[9px] font-data text-yellow-400/70 truncate max-w-[200px] hidden md:block">{demoEventText}</span>
          </div>
        </div>
      )}

      {/* MAIN DASHBOARD */}
      <main className="flex-1 p-3 md:p-6 flex flex-col-reverse lg:flex-row gap-4 md:gap-6 lg:overflow-hidden max-w-[1800px] mx-auto w-full">

        {/* LEFT SIDEBAR: Stats & Feeds */}
        <div className="w-full lg:w-[360px] xl:w-[400px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto hide-scrollbar lg:pe-2">

          {/* STATS: Horizontally scrollable on mobile to save space, grid on desktop */}
          <div className="flex-shrink-0 flex overflow-x-auto lg:grid lg:grid-cols-2 gap-3 pb-2 lg:pb-0 snap-x hide-scrollbar">
            {[
              { label: t('dashboard.stats.fires24h'), value: stats.fires_24h, icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10' },
              { label: t('dashboard.stats.reportsToday'), value: stats.reports_24h, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { label: t('dashboard.stats.activeAlerts'), value: stats.active_alerts, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
              { label: t('dashboard.stats.avgFWI'), value: `${stats.avg_fire_risk}%`, icon: Thermometer, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
              { label: t('dashboard.stats.monitoredZones'), value: stats.forests_monitored, icon: TreePine, color: 'text-green-500', bg: 'bg-green-500/10' },
              {
                label: t('dashboard.stats.rainyZones'),
                value: `${rainyZones}/${stats.forests_monitored || (risks.length || 0)}`,
                icon: Globe,
                color: 'text-sky-400',
                bg: 'bg-sky-500/10',
                sub: avgRainProb ? t('dashboard.rain.avgShort', { value: avgRainProb }) : null,
              },
            ].map((stat, i) => (
              <div key={i} className="min-w-[140px] lg:min-w-0 flex-shrink-0 snap-center bg-[#0A140E]/80 border border-white/10 backdrop-blur-md rounded-[16px] p-4 flex flex-col gap-2 relative group cursor-pointer hover:border-emerald-500/30 transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#10B981]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className={`w-8 h-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center relative z-10`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <div className="relative z-10">
                  <div className="text-xl font-bold tracking-tight text-white">{stat.value}</div>
                  <div className="text-[9px] font-data text-white/50 uppercase tracking-widest mt-1">{stat.label}</div>
                  {stat.sub && <div className="text-[9px] font-data text-sky-300/80 mt-0.5 truncate">{stat.sub}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* SIDEBAR FEEDS FOLLOW */}

          {/* ACTIVE ALERTS */}
          <div className="glass-card rounded-[24px] flex flex-col">
            <div className="p-5 border-b border-white/5 bg-black/20">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">{t('dashboard.alerts.title')}</h3>
                </div>
                <span className="text-[10px] font-data bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">{alerts.filter(a => !a.resolved).length}</span>
              </div>
              {/* Filter Tabs */}
              <div className="flex gap-1">
                {['active', 'all', 'resolved'].map(f => (
                  <button key={f} onClick={() => setAlertFilter(f)} aria-label={`Filter ${f} alerts`}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-data uppercase tracking-widest transition-colors ${alertFilter === f ? 'bg-white/10 text-white/80' : 'text-white/30 hover:text-white/50'}`}>
                    {alertFilterLabels[f]}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 flex-1 space-y-2">
              {filteredAlerts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/20">
                  <CheckCircle className="w-8 h-8 mb-2" />
                  <span className="text-xs font-data uppercase tracking-widest">{alertFilter === 'resolved' ? t('dashboard.alerts.noResolved') : t('dashboard.alerts.noActive')}</span>
                </div>
              ) : filteredAlerts.slice(0, 8).map((a, i) => (
                <div key={a.id || i} className={`p-3 rounded-xl border flex gap-3 items-start transition-all ${a.resolved ? 'border-white/5 bg-white/[0.02] opacity-60' : a.level === 'CRITICAL' ? 'border-red-500/30 bg-red-500/5' : 'border-orange-500/20 bg-orange-500/5'}`}>
                  <div className={`mt-0.5 flex-shrink-0 ${a.resolved ? 'text-green-500' : a.level === 'CRITICAL' ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>
                    {a.resolved ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/90 leading-snug truncate">
                      {t(`dashboard.alerts.level.${a.level}`, a.level)} {a.country && `· ${a.country}`}
                    </p>
                    <p className="text-[10px] text-white/50 leading-snug truncate">
                      {t('dashboard.alerts.meta', {
                        confidence: a.confidence ?? 0,
                        sources: (a.sources || '').split(',').filter(Boolean).length || 1,
                      })}
                    </p>
                    {a.message && (
                      <p className="text-[10px] text-white/30 mt-0.5 truncate" title={a.message}>
                        {a.message}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] font-data text-white/40">{timeAgo(a.created_at)}</span>
                      {a.confidence > 0 && (
                        <span className="text-[9px] font-data bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Brain className="w-2.5 h-2.5" /> {a.confidence}%
                        </span>
                      )}
                      {a.sources?.includes('AI_VISION') && (
                        <span className="text-[9px] font-data bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">AI</span>
                      )}
                    </div>
                  </div>
                  {!a.resolved && a.id && (
                    <button onClick={() => handleResolveAlert(a.id)} aria-label={`Resolve alert ${a.id}`}
                      className="flex-shrink-0 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-[9px] font-data uppercase hover:bg-green-500/20 transition-colors">
                      {t('dashboard.alerts.resolve')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RISK INDEX */}
          <div className="glass-card rounded-[24px] flex flex-col">
            <div className="p-5 border-b border-white/5 flex items-center gap-2 bg-black/20">
              <Thermometer className="w-4 h-4 text-yellow-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">{t('dashboard.risk.title')}</h3>
              <Shield className="w-3 h-3 text-green-500/50 ms-auto" />
            </div>
            <div className="p-4 flex-1 space-y-4">
              {risks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/20">
                  <Thermometer className="w-6 h-6 mb-2" />
                  <span className="text-[10px] font-data uppercase tracking-widest">{t('dashboard.risk.awaiting')}</span>
                </div>
              ) : risks.slice(0, 8).map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex flex-col w-28">
                    <span className="text-[10px] font-data text-white/60 truncate">
                      {r.region?.split(' - ')[1] || r.region}
                    </span>
                    {typeof r.rain_probability === 'number' && (
                      <span className="text-[9px] font-data text-sky-300/80 flex items-center gap-1 truncate">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400/80" />
                        {t('dashboard.rain.probShort', { value: r.rain_probability })}{' '}
                        {r.rain_label && t(`dashboard.rain.label.${r.rain_label.toLowerCase()}`, r.rain_label)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${getRiskBg(r.risk_score)}`} style={{ width: `${r.risk_score}%` }}></div>
                  </div>
                  <span className={`text-[10px] font-data font-bold w-6 text-right ${getRiskColorClass(r.risk_score).split(' ')[0]}`}>{r.risk_score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* COMMUNITY LEADERBOARD */}
          <div className="glass-card rounded-[24px] flex flex-col">
            <div className="p-5 border-b border-white/5 flex items-center gap-2 bg-black/20">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">{t('dashboard.leaderboard.title')}</h3>
              <span className="text-[10px] font-data bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full ms-auto">{leaderboard.length} {t('dashboard.leaderboard.rangers')}</span>
            </div>
            <div className="p-4 space-y-2">
              {leaderboard.length === 0 ? (
                <div className="py-6 flex flex-col items-center justify-center text-white/20">
                  <Trophy className="w-6 h-6 mb-2" />
                  <span className="text-[10px] font-data uppercase tracking-widest">{t('dashboard.leaderboard.noReports')}</span>
                </div>
              ) : leaderboard.map((entry, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-colors relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-emerald)]/0 to-[var(--accent-emerald)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 ${i === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : i === 1 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30' : i === 2 ? 'bg-orange-600/20 text-orange-400 border border-orange-600/30' : 'bg-white/5 text-white/30'}`}>
                    {i + 1}
                  </span>
                  <span className="text-xs text-white/80 flex-1 truncate z-10 font-medium">{entry.username}</span>
                  <span className="text-[9px] font-data text-white/40 z-10">{entry.report_count} {t('dashboard.leaderboard.reports')}</span>
                  <span className="text-[10px] font-data font-bold text-yellow-400 z-10">{entry.total_points} {t('dashboard.leaderboard.pts')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* GROUND TRUTH TERMINAL */}
          <div className="terminal-output rounded-[24px] flex flex-col shadow-[inset_0_4px_24px_rgba(0,0,0,0.5)] border-emerald-500/10">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                <h3 className="text-xs font-data uppercase tracking-[0.2em] text-emerald-500">{t('dashboard.terminal.title')}</h3>
              </div>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20"></div>
              </div>
            </div>
            <div className="p-4 flex-1 font-data text-[10px] space-y-3">
              {safeReports.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-green-500/20">
                  <Radio className="w-6 h-6 mb-2" />
                  <span className="text-[10px] uppercase tracking-widest">{t('dashboard.terminal.listening')}</span>
                </div>
              ) : safeReports.slice(0, 6).map((r, i) => (
                <div key={i} className="flex gap-2 text-emerald-400/80 group">
                  <span className="text-emerald-600 shrink-0">&gt;</span>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white/40">{timeAgo(r.created_at)}</span>
                      <span className="text-emerald-300 font-bold">[{r.username || 'WEB'}]</span>
                      <span>{r.report_type?.toUpperCase()} {t('dashboard.terminal.detected')}</span>
                      {r.ai_classification && r.ai_classification !== 'none' && (
                        <span className="text-purple-400">AI:{r.ai_classification}({r.ai_confidence}%)</span>
                      )}
                    </div>
                    {r.description && (
                      <span className="text-white/40 mt-0.5 truncate">— {r.description}</span>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 text-emerald-400 animate-pulse">
                <span className="text-emerald-600 font-bold">&gt;</span> <div className="w-2 h-3 bg-emerald-500/50 mt-1"></div>
              </div>
            </div>
          </div>

        </div>

        {/* MAIN MAP AREA (75% Width) */}
        <div className="flex-1 relative glass-card rounded-[28px] overflow-hidden shadow-2xl min-h-[500px] flex flex-col">
          
          {/* Top Left Floating Pill */}
          <div className="absolute top-6 start-6 z-[500] bg-[#0A140E]/60 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg">
            <Map className="w-4 h-4 text-[var(--accent-emerald)]" />
            <span className="text-xs font-data text-white/90 uppercase tracking-widest">{t('dashboard.map.firmsTelemetry')}</span>
            <div className="h-4 w-px bg-white/10 mx-1"></div>
            <span className="text-[10px] font-data text-[var(--accent-emerald)]/80">{t('dashboard.map.clickToReport')}</span>
          </div>

          {/* Tree Cover Layer Toggle */}
          <div className="absolute top-6 end-6 z-[500] flex flex-col gap-2">
            <button
              onClick={() => setShowTreeCover(prev => !prev)}
              className={`bg-[#0A140E]/60 backdrop-blur-xl border px-3 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg transition-all ${
                showTreeCover ? 'border-emerald-500/40 text-emerald-400' : 'border-white/10 text-white/60 hover:text-white'
              }`}
              aria-label="Toggle tree cover layer"
            >
              <Layers className="w-4 h-4" />
              <span className="text-[10px] font-data uppercase tracking-widest">{t('dashboard.map.treeCover', 'Tree Cover')}</span>
            </button>
            {showTreeCover && (
              <div className="bg-[#0A140E]/60 backdrop-blur-xl border border-white/10 px-3 py-2 rounded-xl flex items-center gap-2">
                <span className="text-[9px] font-data text-white/40">0%</span>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={treeCoverOpacity}
                  onChange={(e) => setTreeCoverOpacity(parseFloat(e.target.value))}
                  className="flex-1 h-1 accent-emerald-500 cursor-pointer"
                />
                <span className="text-[9px] font-data text-white/40">100%</span>
              </div>
            )}
          </div>

          {/* Floating Risk Index Overlay (Bottom Right) */}
          <div className="absolute bottom-6 end-6 z-[500] w-[320px] pointer-events-auto hidden md:flex flex-col">
            <div className="bg-[#0A140E]/80 backdrop-blur-2xl border border-white/10 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden max-h-[300px]">
              <div className="p-4 border-b border-white/5 flex items-center gap-2 bg-[#1A211D]/50 w-full">
                <Thermometer className="w-4 h-4 text-[var(--accent-emerald)]" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/90">{t('dashboard.risk.title')}</h3>
                <Shield className="w-3 h-3 text-[var(--accent-emerald)]/50 ms-auto" />
              </div>
              <div className="p-4 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
                {risks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/20 py-4">
                    <span className="text-[10px] font-data uppercase tracking-widest">{t('dashboard.risk.awaiting')}</span>
                  </div>
                ) : risks.slice(0, 5).map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex flex-col w-24">
                      <span className="text-[10px] font-data text-white/80 truncate">
                        {r.region?.split(' - ')[1] || r.region}
                      </span>
                    </div>
                    <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${getRiskBg(r.risk_score)}`} style={{ width: `${r.risk_score}%` }}></div>
                    </div>
                    <span className={`text-[10px] font-data font-bold w-6 text-right ${getRiskColorClass(r.risk_score).split(' ')[0]}`}>{r.risk_score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Subtle Map Vignette Overlay */}
          <div className="absolute inset-0 z-[400] pointer-events-none shadow-[inset_0_0_120px_rgba(5,10,7,0.95)]"></div>

          <MapContainer center={MENA_CENTER} zoom={MENA_ZOOM} className="w-full h-full bg-[#050A07] z-10 custom-map" zoomControl={false}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; CartoDB'
              className="opacity-80 contrast-125 grayscale-[0.5] sepia-[0.2] hue-rotate-180"
            />

            {/* Global Tree Cover Layer (Hansen / UMD / GFW) */}
            {showTreeCover && (
              <TileLayer
                url="https://tiles.globalforestwatch.org/umd_tree_cover_density_2000/v1.11/tcd_30/{z}/{x}/{y}.png"
                attribution='&copy; Global Forest Watch'
                opacity={treeCoverOpacity}
                maxZoom={12}
              />
            )}

            <MapController center={mapCenter} zoom={mapZoom} />
            <MapClickHandler onMapClick={handleMapClick} />

            {/* Clicked location marker */}
            {clickedCoords && (
              <Marker position={[clickedCoords.lat, clickedCoords.lng]} icon={clickIcon}>
                <Popup className="tactical-popup">
                  <div className="text-xs font-data text-green-400">{t('dashboard.map.reportLocation')}</div>
                </Popup>
              </Marker>
            )}

            {/* Famous Forest Zones + Star Markers */}
            {(stats.forests || []).map((f, i) => (
              <React.Fragment key={`forest-${i}`}>
                <Circle center={[f.lat, f.lng]} radius={f.radius * 1000} pathOptions={{ color: '#F59E0B', fillColor: '#10B981', fillOpacity: 0.08, weight: 1, dashArray: '4 6' }}>
                  <Popup className="tactical-popup">
                    <div className="text-xs font-data space-y-1">
                      <b className="text-amber-400">⭐ {f.nameAr ? `${f.nameAr} / ${f.name}` : f.name}</b><br/>
                      <span className="text-white/70">{t('dashboard.map.famousForest', 'Famous Forest in the Region')}</span><br/>
                      {f.forestType && <span className="text-emerald-400">🌲 {f.forestType}</span>}
                      {f.area > 0 && <span className="text-white/50"> · {f.area} km²</span>}
                      {f.elevation > 0 && <span className="text-white/50"> · {f.elevation}m</span>}
                      {f.unescoStatus && <><br/><span className="text-yellow-300">🏛 {f.unescoStatus}</span></>}
                    </div>
                  </Popup>
                </Circle>
                <Marker position={[f.lat, f.lng]} icon={famousForestIcon}>
                  <Popup className="tactical-popup">
                    <div className="text-xs font-data space-y-1">
                      <b className="text-amber-400">⭐ {f.nameAr ? `${f.nameAr} / ${f.name}` : f.name}</b><br/>
                      <span className="text-white/70">{t('dashboard.map.famousForest', 'Famous Forest in the Region')}</span>
                      {f.forestType && <><br/><span className="text-emerald-400">🌲 {f.forestType}</span></>}
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            ))}

            {(Array.isArray(fires) ? fires : []).map((f, i) => (
              <Marker key={`fire-${i}`} position={[f.latitude, f.longitude]} icon={fireIcon}>
                <Popup className="tactical-popup">
                  <div className="text-xs font-data">
                    <b className="text-red-500">{t('dashboard.map.thermalAnomaly')}</b><br />
                    {t('dashboard.map.confidence')}: {f.confidence}% | {t('dashboard.map.source')}: {f.satellite}
                  </div>
                </Popup>
              </Marker>
            ))}

            {safeReports.filter(r => r.latitude).map((r, i) => (
              <Marker key={`rep-${i}`} position={[r.latitude, r.longitude]} icon={reportIcon}>
                <Popup className="tactical-popup">
                  <div className="text-xs font-data">
                    <b className="text-[#10B981]">{t('dashboard.map.groundReport')}</b><br />
                    {t('dashboard.map.by')}: {r.username || 'Web'} | {t('dashboard.map.type')}: {r.report_type}
                    {r.description && <><br /><span className="text-white/70 italic">{r.description}</span></>}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </main>

      {/* Forest Explorer Slide-over */}
      {showForestExplorer && (
        <ForestExplorerPanel
          forests={stats.forests || []}
          onClose={() => setShowForestExplorer(false)}
          onSelectForest={(f) => {
            setMapCenter([f.lat, f.lng]);
            setMapZoom(11);
            setShowForestExplorer(false);
          }}
        />
      )}

      {/* Modals */}
      <Suspense fallback={null}>
        {showAnalytics && <AnalyticsPanel isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} />}
        {showReportForm && <ReportForm
          isOpen={showReportForm}
          onClose={() => { setShowReportForm(false); setClickedCoords(null); }}
          clickedCoords={clickedCoords}
          onSubmitted={() => fetchData()}
        />}
      </Suspense>
    </div>
  );
}

export default Dashboard;
