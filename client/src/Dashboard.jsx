import React, { useState, useEffect, useCallback, lazy, Suspense, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker, useMapEvents, useMap, Tooltip as LeafletTooltip } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Target, Flame, FileText, AlertTriangle, Thermometer, TreePine, Map, Bell, ArrowLeft, Radio, CheckCircle, TrendingUp, Plus, Wifi, WifiOff, Brain, Shield, Play, Square, Trophy, Globe, ChevronDown, Layers, Users, User, Star, Search, Compass } from 'lucide-react';
const AnalyticsPanel = lazy(() => import('./AnalyticsPanel'));
const ReportForm = lazy(() => import('./ReportForm'));
import ForestExplorerPanel from './ForestExplorerPanel';
import 'leaflet/dist/leaflet.css';
import './index.css';

// shadcn UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const getBackendURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && apiUrl.trim()) {
    return apiUrl.includes('://') ? apiUrl.trim() : 'https://' + apiUrl.trim();
  }
  return 'https://forestguard-production.up.railway.app';
};

const API_BASE = getBackendURL();
const API_URL = API_BASE + '/api';
const WS_URL = API_BASE.replace(/^http/, 'ws') + '/ws';

// MENA overview center
const MENA_CENTER = [28, 35];
const MENA_ZOOM = 4;

// Custom Map Icons
const fireIcon = L.divIcon({ html: '<div class="w-4 h-4 rounded-full bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)] border-2 border-white/50"></div>', className: '', iconSize: [16, 16], iconAnchor: [8, 8] });
const reportIcon = L.divIcon({ html: '<div class="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)] border border-white/50"></div>', className: '', iconSize: [12, 12], iconAnchor: [6, 6] });
const clickIcon = L.divIcon({ html: '<div class="w-5 h-5 rounded-full bg-green-500 animate-bounce shadow-[0_0_20px_rgba(34,197,94,0.8)] border-2 border-white"></div>', className: '', iconSize: [20, 20], iconAnchor: [10, 10] });
const famousForestIcon = L.divIcon({ html: '<div class="relative flex items-center justify-center"><div class="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 shadow-[0_0_16px_rgba(245,158,11,0.6)] border-2 border-yellow-300/80 flex items-center justify-center"><span style="font-size:12px;line-height:1">⭐</span></div></div>', className: '', iconSize: [24, 24], iconAnchor: [12, 12] });

function getMarkerStyle(frp) {
  if (frp > 100) return { color: '#ef4444', radius: 18 }; // critical
  if (frp > 50)  return { color: '#f97316', radius: 14 }; // high
  if (frp > 20)  return { color: '#eab308', radius: 10 }; // medium
  return { color: '#22c55e', radius: 7 };                  // low
}

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
    const defaultStats = { fires_24h: 0, reports_24h: 0, active_alerts: 0, avg_fire_risk: 0, forests_monitored: 0, forests: [] };
    
    return Promise.all([
      fetch(`${API_URL}/stats${cp}`).then(r => r.ok ? r.json() : defaultStats).catch(() => defaultStats),
      fetch(`${API_URL}/fires${cp}`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API_URL}/reports${cp}`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API_URL}/alerts${cp}`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API_URL}/risk${cp}`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API_URL}/leaderboard${cp}`).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([statsData, firesData, reportsData, alertsData, risksData, leaderboardData]) => {
      setStats(statsData?.forests ? statsData : defaultStats);
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
    <TooltipProvider>
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
            <Link to="/" aria-label={t('dashboard.backToProtocol', 'Back to Protocol')} className="flex items-center justify-center min-w-[36px] min-h-[36px] md:min-w-[44px] md:min-h-[44px] hover:text-white text-white/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-emerald)]/50 rounded-md">
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
          {/* Language Switcher: Using shadcn Button Group */}
          <div className="flex items-center rounded-lg bg-[#161B18]/60 p-1 border border-white/5 backdrop-blur-sm">
            {['en', 'ar', 'fr'].map(lng => (
              <Button
                key={lng}
                onClick={() => changeLang(lng)}
                variant={i18n.language === lng ? "default" : "ghost"}
                className={`h-7 px-3 text-[10px] font-bold uppercase tracking-widest transition-all rounded-md ${i18n.language === lng ? 'bg-[#FF7162] text-black hover:bg-[#FF7162]/90' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
              >
                {lng.toUpperCase()}
              </Button>
            ))}
          </div>

          {/* Mode Switcher: Enhanced with shadcn Button */}
          <div className="flex items-center rounded-lg bg-[#161B18]/60 p-1 border border-white/5 mx-2 backdrop-blur-sm">
            <Button
              onClick={() => setDataMode('demo')}
              variant="ghost"
              className={`h-7 px-3 text-[10px] font-bold uppercase tracking-widest transition-all rounded-md gap-2 ${dataMode === 'demo' ? 'bg-[#333] text-white' : 'text-white/20 hover:text-white/40 hover:bg-white/5'}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${dataMode === 'demo' ? 'bg-yellow-500' : 'bg-white/20'}`}></div>
              DEMO
            </Button>
            <Button
              onClick={() => setDataMode('live')}
              variant="ghost"
              className={`h-7 px-3 text-[10px] font-bold uppercase tracking-widest transition-all rounded-md gap-2 ${dataMode === 'live' ? 'bg-[#00A3FF]/20 text-[#00A3FF] border border-[#00A3FF]/30' : 'text-white/20 hover:text-white/40 hover:bg-white/5'}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${dataMode === 'live' ? 'bg-[#00A3FF]' : 'bg-white/20'}`}></div>
              LIVE
            </Button>
          </div>

          <div className="h-4 w-px bg-white/10 mx-2"></div>

          {/* Country Filter */}
          <div className="relative group">
            <select
              value={selectedCountry}
              onChange={e => {
                setSelectedCountry(e.target.value);
                if (!e.target.value) {
                  setMapCenter(MENA_CENTER);
                  setMapZoom(MENA_ZOOM);
                }
              }}
              className="appearance-none bg-[#161B18] border border-white/10 rounded-sm px-4 py-2 pe-10 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90 hover:border-white/20 transition-all cursor-pointer focus-ring min-w-[180px]"
              aria-label={t('dashboard.filterCountry')}
            >
              <option value="">ALL COUNTRIES</option>
              {safeCountries.map(c => (
                <option key={c.code} value={c.code}>{i18n.language === 'ar' ? c.nameAr : c.name.toUpperCase()}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute end-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none transition-transform group-hover:text-white" />
          </div>

          <div className="h-4 w-px bg-white/10 mx-2"></div>

          {/* WebSocket Status */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[10px] font-bold uppercase tracking-widest ${connected ? 'border-green-500/20 text-green-500 bg-green-500/10' : 'border-red-500/20 text-red-500 bg-red-500/10 animate-pulse'}`}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? t('dashboard.live') : t('dashboard.reconnecting')}
          </div>

          <div className="h-4 w-px bg-white/10 mx-2"></div>

          {/* Feature Actions with Tooltips */}
          <div className="flex items-center gap-2 ml-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => setShowAnalytics(true)} variant="outline" size="icon" className="w-10 h-10 bg-[#161B18] border-white/5 hover:border-[#00A3FF]/50 text-white/40 hover:text-[#00A3FF] transition-all">
                  <TrendingUp className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#161B18] border-white/10 text-white/90 text-[10px] font-data uppercase tracking-widest">{t('dashboard.openAnalytics')}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="outline" size="icon" className="w-10 h-10 bg-[#161B18] border-white/5 hover:border-purple-400/50 text-white/40 hover:text-purple-400 transition-all">
                  <Link to="/community"><Users className="w-5 h-5" /></Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#161B18] border-white/10 text-white/90 text-[10px] font-data uppercase tracking-widest">{t('dashboard.openCommunity')}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => setShowForestExplorer(true)} variant="outline" size="icon" className="w-10 h-10 bg-[#161B18] border-white/5 hover:border-emerald-400/50 text-white/40 hover:text-emerald-400 transition-all">
                  <Compass className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#161B18] border-white/10 text-white/90 text-[10px] font-data uppercase tracking-widest">{t('dashboard.openExplorer')}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="outline" size="icon" className="w-10 h-10 rounded-full border-emerald-500/20 bg-gradient-to-br from-emerald-600/80 to-teal-600/80 text-white hover:border-emerald-400/50 transition-all shadow-sm shadow-emerald-500/10">
                  <Link to="/profile"><User className="w-4 h-4" /></Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#161B18] border-white/10 text-white/90 text-[10px] font-data uppercase tracking-widest">Profile</TooltipContent>
            </Tooltip>

            <Button 
              onClick={() => setShowReportForm(true)} 
              variant="outline"
              className="bg-transparent border-[#FF7162]/40 text-[#FF7162] hover:bg-[#FF7162]/10 hover:border-[#FF7162]/60 font-bold uppercase tracking-[0.2em] px-6 ml-2 text-[11px] h-10 transition-all"
            >
              <Plus className="w-4 h-4 mr-2" /> {t('dashboard.report')}
            </Button>
          </div>

          {/* Demo Scenario Selector + Toggle */}
          <div className="flex items-center gap-1">
            {!demoActive && scenarios.length > 0 && (
              <div className="relative">
                <select value={selectedScenario} onChange={e => setSelectedScenario(e.target.value)}
                  className="appearance-none bg-yellow-500/5 border border-yellow-500/20 rounded-s-full px-3 py-1.5 pe-7 text-[10px] font-data uppercase tracking-widest text-yellow-400/70 hover:text-yellow-300 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  aria-label={t('dashboard.selectScenario')}>
                  {scenarios.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 absolute end-2 top-1/2 -translate-y-1/2 text-yellow-400/40 pointer-events-none" />
              </div>
            )}
            <button onClick={handleDemoToggle} aria-label={demoActive ? t('dashboard.stopDemo', 'Stop demo scenario') : t('dashboard.startDemo', 'Start demo scenario')}
              className={`flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-data uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500/50 cursor-pointer ${!demoActive && scenarios.length > 0 ? 'rounded-e-full' : 'rounded-full'} ${demoActive ? 'border-red-500/30 text-red-400 hover:text-red-300 hover:border-red-500/50 bg-red-500/10' : 'border-yellow-500/30 text-yellow-400 hover:text-yellow-300 hover:border-yellow-500/50 bg-yellow-500/10'}`}>
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

          {/* STATS: Enhanced with shadcn Card */}
          <div className="flex-shrink-0 flex overflow-x-auto lg:grid lg:grid-cols-2 gap-3 pb-2 lg:pb-0 snap-x hide-scrollbar">
            {[
              { label: t('dashboard.stats.fires24h'), value: stats.fires_24h, icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10' },
              { label: t('dashboard.stats.reportsToday'), value: stats.reports_24h, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { label: t('dashboard.stats.activeAlerts'), value: stats.active_alerts, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
              { label: t('dashboard.stats.avgFWI'), value: `${stats.avg_fire_risk}%`, icon: Thermometer, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
              { label: t('dashboard.stats.monitoredZones'), value: stats.forests_monitored, icon: TreePine, color: 'text-green-500', bg: 'bg-green-500/10' },
              { label: t('dashboard.stats.rainyZones'), value: `${rainyZones}/${stats.forests_monitored || (risks.length || 0)}`, icon: Globe, color: 'text-sky-400', bg: 'bg-sky-500/10', sub: avgRainProb ? t('dashboard.rain.avgShort', { value: avgRainProb }) : null },
            ].map((stat, i) => (
              <Card key={i} className="min-w-[140px] lg:min-w-0 flex-shrink-0 snap-center bg-[#0A140E]/80 border-white/10 backdrop-blur-md rounded-[16px] hover:border-[#10B981]/30 transition-all cursor-pointer group">
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className={`w-8 h-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center relative z-10`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xl font-bold tracking-tight text-white">{stat.value}</div>
                    <div className="text-[9px] font-data text-white/50 uppercase tracking-widest mt-1">{stat.label}</div>
                    {stat.sub && <div className="text-[9px] font-data text-sky-300/80 mt-0.5 truncate">{stat.sub}</div>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* SIDEBAR FEEDS FOLLOW */}

          {/* SIDEBAR FEEDS: Tabbed Interface */}
          <Tabs defaultValue="alerts" className="flex-1 flex flex-col min-h-0">
            <div className="px-1 mb-2">
              <TabsList className="w-full bg-[#0A140E]/60 border border-white/5 p-1 rounded-xl h-11">
                <TabsTrigger value="alerts" className="flex-1 gap-2 data-[state=active]:bg-[#10B981]/10 data-[state=active]:text-[#10B981]">
                  <Bell className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t('dashboard.alerts.title')}</span>
                </TabsTrigger>
                <TabsTrigger value="risk" className="flex-1 gap-2 data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-500">
                  <Thermometer className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t('dashboard.risk.title')}</span>
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="flex-1 gap-2 data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-400">
                  <Trophy className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t('dashboard.leaderboard.title')}</span>
                </TabsTrigger>
                <TabsTrigger value="terminal" className="flex-1 gap-2 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-500">
                  <Radio className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t('dashboard.terminal.title')}</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
              {/* ACTIVE ALERTS CONTENT */}
              <TabsContent value="alerts" className="mt-0 outline-none p-1">
                <Card className="bg-[#0A140E]/60 border-white/5 backdrop-blur-md rounded-[24px]">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xs font-bold uppercase tracking-widest text-white/60">
                        {t('dashboard.alerts.title')}
                      </CardTitle>
                      <span className="text-[10px] font-data bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                        {alerts.filter(a => !a.resolved).length}
                      </span>
                    </div>
                    {/* Filter local to alerts tab */}
                    <div className="flex gap-1 mt-2">
                      {['active', 'all', 'resolved'].map(f => (
                        <button key={f} onClick={() => setAlertFilter(f)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-data uppercase tracking-widest transition-colors ${alertFilter === f ? 'bg-white/10 text-white/80' : 'text-white/30 hover:text-white/50'}`}>
                          {alertFilterLabels[f]}
                        </button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2 space-y-2">
                    {filteredAlerts.length === 0 ? (
                      <div className="py-12 flex flex-col items-center justify-center text-white/20">
                        <CheckCircle className="w-8 h-8 mb-2" />
                        <span className="text-xs font-data uppercase tracking-widest">{alertFilter === 'resolved' ? t('dashboard.alerts.noResolved') : t('dashboard.alerts.noActive')}</span>
                      </div>
                    ) : filteredAlerts.slice(0, 10).map((a, i) => (
                      <div key={a.id || i} className={`p-3 rounded-xl border flex gap-3 items-start transition-all ${a.resolved ? 'border-white/5 bg-white/[0.02] opacity-60' : a.level === 'CRITICAL' ? 'border-red-500/30 bg-red-500/5' : 'border-orange-500/20 bg-orange-500/5'} hover:border-white/20`}>
                        <div className={`mt-0.5 flex-shrink-0 ${a.resolved ? 'text-green-500' : a.level === 'CRITICAL' ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>
                          {a.resolved ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/90 leading-snug truncate">
                            {t(`dashboard.alerts.level.${a.level}`, a.level)} {a.country && `· ${a.country}`}
                          </p>
                          <p className="text-[10px] text-white/50 leading-snug truncate">
                            {t('dashboard.alerts.meta', { confidence: a.confidence ?? 0, sources: (a.sources || '').split(',').filter(Boolean).length || 1 })}
                          </p>
                        </div>
                        {!a.resolved && a.id && (
                          <Button onClick={() => handleResolveAlert(a.id)} variant="ghost" className="h-7 px-2 text-[9px] text-green-500 hover:text-green-400 hover:bg-green-500/10">
                            {t('dashboard.alerts.resolve')}
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* RISK CONTENT */}
              <TabsContent value="risk" className="mt-0 outline-none p-1">
                <Card className="bg-[#0A140E]/60 border-white/5 backdrop-blur-md rounded-[24px]">
                  <CardHeader>
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-white/60">
                      {t('dashboard.risk.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {risks.length === 0 ? (
                      <div className="py-12 flex flex-col items-center justify-center text-white/20">
                        <Thermometer className="w-6 h-6 mb-2" />
                        <span className="text-[10px] font-data uppercase tracking-widest">{t('dashboard.risk.awaiting')}</span>
                      </div>
                    ) : risks.slice(0, 10).map((r, i) => (
                      <div key={i} className="flex items-center gap-3 p-1">
                        <div className="flex flex-col w-28">
                          <span className="text-[10px] font-data text-white/60 truncate">{r.region?.split(' - ')[1] || r.region}</span>
                        </div>
                        <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 ${getRiskBg(r.risk_score)}`} style={{ width: `${r.risk_score}%` }}></div>
                        </div>
                        <span className={`text-[10px] font-data font-bold w-6 text-right ${getRiskColorClass(r.risk_score).split(' ')[0]}`}>{r.risk_score}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* LEADERBOARD CONTENT */}
              <TabsContent value="leaderboard" className="mt-0 outline-none p-1">
                <Card className="bg-[#0A140E]/60 border-white/5 backdrop-blur-md rounded-[24px]">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xs font-bold uppercase tracking-widest text-white/60">
                        {t('dashboard.leaderboard.title')}
                      </CardTitle>
                      <span className="text-[10px] font-data bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                        {leaderboard.length} {t('dashboard.leaderboard.rangers')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {leaderboard.length === 0 ? (
                      <div className="py-12 flex flex-col items-center justify-center text-white/20">
                        <Trophy className="w-6 h-6 mb-2" />
                        <span className="text-[10px] font-data uppercase tracking-widest">{t('dashboard.leaderboard.noReports')}</span>
                      </div>
                    ) : leaderboard.map((entry, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] group transition-colors">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-white/5 text-white/30'}`}>
                          {i + 1}
                        </span>
                        <span className="text-xs text-white/80 flex-1 truncate font-medium">{entry.username}</span>
                        <span className="text-[10px] font-data font-bold text-yellow-400">{entry.total_points} {t('dashboard.leaderboard.pts')}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TERMINAL CONTENT */}
              <TabsContent value="terminal" className="mt-0 outline-none">
                <div className="terminal-output rounded-[24px] shadow-[inset_0_4px_24px_rgba(0,0,0,0.5)] border-emerald-500/10 min-h-[300px] flex flex-col border border-white/5">
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                      <h3 className="text-xs font-data uppercase tracking-[0.2em] text-emerald-500">{t('dashboard.terminal.title')}</h3>
                    </div>
                  </div>
                  <div className="p-4 flex-1 font-data text-[10px] space-y-3 overflow-y-auto max-h-[400px]">
                    {safeReports.slice(0, 10).map((r, i) => (
                      <div key={i} className="flex gap-2 text-emerald-400/80 group">
                        <span className="text-emerald-600 shrink-0">&gt;</span>
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white/40">{timeAgo(r.created_at)}</span>
                            <span className="text-emerald-300 font-bold">[{r.username || 'WEB'}]</span>
                            <span>{r.report_type?.toUpperCase()} detected</span>
                          </div>
                          {r.description && <span className="text-white/40 mt-0.5 truncate">— {r.description}</span>}
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 text-emerald-400 animate-pulse">
                      <span className="text-emerald-600 font-bold">&gt;</span> <div className="w-2 h-3 bg-emerald-500/50 mt-1"></div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

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

          {/* Tree Cover Layer Toggle: Using shadcn Switch */}
          <div className="absolute top-6 end-6 z-[500] flex flex-col gap-2">
            <div className={`bg-[#0A140E]/60 backdrop-blur-xl border px-3 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg transition-all ${showTreeCover ? 'border-emerald-500/40' : 'border-white/10'}`}>
              <Layers className={`w-4 h-4 ${showTreeCover ? 'text-emerald-400' : 'text-white/40'}`} />
              <span className="text-[10px] font-data uppercase tracking-widest text-white/60">{t('dashboard.map.treeCover', 'Tree Cover')}</span>
              <Switch checked={showTreeCover} onCheckedChange={setShowTreeCover} />
            </div>
            {showTreeCover && (
              <div className="bg-[#0A140E]/60 backdrop-blur-xl border border-white/10 px-3 py-2 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[9px] font-data text-white/40 uppercase tracking-wider">Opacity</span>
                  <span className="text-[9px] font-data text-emerald-400 font-bold">{Math.round(treeCoverOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={treeCoverOpacity}
                  onChange={(e) => setTreeCoverOpacity(parseFloat(e.target.value))}
                  className="w-full h-1 accent-emerald-500 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Floating Risk Index Overlay: Using shadcn Card */}
          <div className="absolute bottom-6 end-6 z-[500] w-[320px] pointer-events-auto hidden md:flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-500">
            <Card className="bg-[#0A140E]/80 backdrop-blur-2xl border-white/10 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
              <CardHeader className="p-4 border-b border-white/5 bg-[#1A211D]/50 flex-row items-center gap-2 space-y-0">
                <Thermometer className="w-4 h-4 text-[#10B981]" />
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-white/90">{t('dashboard.risk.title')}</CardTitle>
                <Shield className="w-3 h-3 text-[#10B981]/50 ms-auto" />
              </CardHeader>
              <CardContent className="p-4 max-h-[220px] overflow-y-auto space-y-4 custom-scrollbar">
                {risks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/20 py-4 font-data text-[10px] uppercase tracking-widest">
                    {t('dashboard.risk.awaiting')}
                  </div>
                ) : risks.slice(0, 5).map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex flex-col w-24">
                      <span className="text-[10px] font-data text-white/80 truncate">
                        {r.region?.split(' - ')[1] || r.region}
                      </span>
                    </div>
                    <div className="flex-1 h-1 bg-black/50 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${getRiskBg(r.risk_score)}`} style={{ width: `${r.risk_score}%` }}></div>
                    </div>
                    <span className={`text-[10px] font-data font-bold w-6 text-right ${getRiskColorClass(r.risk_score).split(' ')[0]}`}>{r.risk_score}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Subtle Map Vignette Overlay */}
          <div className="absolute inset-0 z-[400] pointer-events-none shadow-[inset_0_0_120px_rgba(5,10,7,0.95)]"></div>

          <MapContainer center={MENA_CENTER} zoom={MENA_ZOOM} className="w-full h-full bg-[#050A07] z-10 custom-map" zoomControl={false}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; CartoDB'
              className="opacity-80 contrast-125 grayscale-[0.5] sepia-[0.2] hue-rotate-180"
            />

            {/* Global Tree Cover Layer (Hansen Global Forest Change) - 100% Authentic Scientific Database */}
            {showTreeCover && (
              <TileLayer
                url="https://storage.googleapis.com/earthenginepartners-hansen/tiles/gfc_v1.4/tree_alpha/{z}/{x}/{y}.png"
                attribution='&copy; UMD Hansen / Google Earth Engine'
                opacity={treeCoverOpacity}
                className="contrast-150 saturate-200 brightness-125"
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
                  <LeafletTooltip direction="top" offset={[0, -10]} opacity={0.9}>
                    <div className="bg-[#0A140E]/90 border border-amber-500/50 p-2 rounded-lg backdrop-blur-md shadow-xl">
                      <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">⭐ {f.nameAr || f.name}</div>
                      <div className="text-[9px] text-emerald-400 font-data uppercase tracking-wider">{f.forestType || 'Protected Zone'}</div>
                    </div>
                  </LeafletTooltip>
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

            <MarkerClusterGroup chunkedLoading maxClusterRadius={40}>
              {(Array.isArray(fires) ? fires : []).map((f, i) => {
                const style = getMarkerStyle(f.frp || f.brightness || 0);
                return (
                  <CircleMarker
                    key={`fire-${i}`}
                    center={[f.latitude, f.longitude]}
                    radius={style.radius}
                    pathOptions={{
                      fillColor: style.color,
                      color: '#ffffff',
                      weight: 1.5,
                      opacity: 1,
                      fillOpacity: 0.85
                    }}
                  >
                    <LeafletTooltip direction="top" offset={[0, -5]} opacity={0.9}>
                      <div className="bg-[#0A140E]/90 border border-red-500/50 p-2 rounded-lg backdrop-blur-md shadow-xl">
                        <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">{t('dashboard.map.thermalAnomaly')}</div>
                        <div className="text-[9px] text-white/70 font-data">FRP: <span className="text-red-400">{f.frp || f.brightness || 0} MW</span></div>
                      </div>
                    </LeafletTooltip>
                    <Popup className="tactical-popup">
                      <div className="text-xs font-data">
                        <b className="text-red-500">{t('dashboard.map.thermalAnomaly')}</b><br />
                        FRP: <b>{f.frp || f.brightness || 0} MW</b><br />
                        {t('dashboard.map.confidence')}: {f.confidence}% | {t('dashboard.map.source')}: {f.satellite}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MarkerClusterGroup>

            {safeReports.filter(r => r.latitude).map((r, i) => (
              <Marker key={`rep-${i}`} position={[r.latitude, r.longitude]} icon={reportIcon}>
                <LeafletTooltip direction="top" offset={[0, -15]} opacity={0.9}>
                  <div className="bg-[#0A140E]/90 border border-[#10B981]/50 p-2 rounded-lg backdrop-blur-md shadow-xl">
                    <div className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest mb-1">{t('dashboard.map.groundReport')}</div>
                    <div className="text-[9px] text-white/70 font-data">BY: <span className="text-emerald-400">{r.username || 'Web'}</span></div>
                  </div>
                </LeafletTooltip>
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
    </TooltipProvider>
  );
}

export default Dashboard;
