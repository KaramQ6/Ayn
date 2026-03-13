import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { Target, Flame, FileText, AlertTriangle, Thermometer, TreePine, Map, Bell, ArrowLeft, Radio, CheckCircle, TrendingUp, Plus, Wifi, WifiOff, Brain, Shield, Play, Square, Trophy } from 'lucide-react';
const AnalyticsPanel = lazy(() => import('./AnalyticsPanel'));
const ReportForm = lazy(() => import('./ReportForm'));
import 'leaflet/dist/leaflet.css';
import './index.css';

const API_URL = '/api';
const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

// Custom Map Icons
const fireIcon = L.divIcon({ html: '<div class="w-4 h-4 rounded-full bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)] border-2 border-white/50"></div>', className: '', iconSize: [16, 16], iconAnchor: [8, 8] });
const reportIcon = L.divIcon({ html: '<div class="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)] border border-white/50"></div>', className: '', iconSize: [12, 12], iconAnchor: [6, 6] });
const clickIcon = L.divIcon({ html: '<div class="w-5 h-5 rounded-full bg-green-500 animate-bounce shadow-[0_0_20px_rgba(34,197,94,0.8)] border-2 border-white"></div>', className: '', iconSize: [20, 20], iconAnchor: [10, 10] });

// Map click handler component
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function Dashboard() {
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

  const fetchData = useCallback(() => {
    return Promise.all([
      fetch(`${API_URL}/stats`).then(r => r.json()).catch(() => stats),
      fetch(`${API_URL}/fires`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/reports`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/alerts`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/risk`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/leaderboard`).then(r => r.json()).catch(() => []),
    ]).then(([statsData, firesData, reportsData, alertsData, risksData, leaderboardData]) => {
      setStats(statsData);
      setFires(firesData);
      setReports(reportsData);
      setAlerts(alertsData);
      setRisks(risksData);
      setLeaderboard(leaderboardData);
    });
  }, []);

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
          setDemoEventText('Demo scenario initializing...');
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
          setDemoEventText('Demo complete');
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
  }, [fetchData]);

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
      } else {
        await fetch(`${API_URL}/demo/seed`);
        await fetch(`${API_URL}/demo/start`);
      }
    } catch (err) {
      console.error('Demo toggle error:', err);
    }
  }, [demoActive]);

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

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr + 'Z').getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  const filteredAlerts = alerts.filter(a => {
    if (alertFilter === 'active') return !a.resolved;
    if (alertFilter === 'resolved') return a.resolved;
    return true;
  });

  return (
    <div className="bg-[#050A07] min-h-screen text-[var(--ui-ghost)] font-sans flex flex-col selection:bg-[var(--alert-signal)] selection:text-white relative">
      
      {/* LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 z-[100] bg-[#050A07] flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--alert-signal)] border-t-transparent rounded-full animate-spin"></div>
          <p className="font-data text-xs uppercase tracking-[0.3em] text-white/40 animate-pulse">Initializing Telemetry...</p>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#0A140E]/80 backdrop-blur-xl border-b border-white/5 py-3 px-6 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link to="/" aria-label="Back to Protocol" className="flex items-center justify-center min-w-[44px] min-h-[44px] hover:text-white text-white/50 transition-colors focus:ring-2 focus:ring-[var(--alert-signal)] rounded-md outline-none">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center space-x-2">
            <Target className="text-[var(--alert-signal)] w-6 h-6" />
            <div>
              <h1 className="font-bold text-lg tracking-tight leading-none">Command Center</h1>
              <p className="text-[10px] font-data text-white/40 uppercase tracking-widest mt-1">Live Telemetry</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* WebSocket Status */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-data uppercase tracking-widest ${connected ? 'border-green-500/20 text-green-500 bg-green-500/10' : 'border-red-500/20 text-red-500 bg-red-500/10 animate-pulse'}`}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? 'Live' : 'Reconnecting'}
          </div>

          {/* Analytics Button */}
          <button onClick={() => setShowAnalytics(true)} aria-label="Open analytics dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-data uppercase tracking-widest text-white/60 hover:text-white hover:border-white/20 bg-white/5 transition-colors">
            <TrendingUp className="w-3 h-3" /> Analytics
          </button>

          {/* Report Button */}
          <button onClick={() => setShowReportForm(true)} aria-label="Submit a new report"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-500/30 text-[10px] font-data uppercase tracking-widest text-green-400 hover:text-green-300 hover:border-green-500/50 bg-green-500/10 transition-colors">
            <Plus className="w-3 h-3" /> Report
          </button>

          {/* Demo Button */}
          <button onClick={handleDemoToggle} aria-label={demoActive ? 'Stop demo scenario' : 'Start demo scenario'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-data uppercase tracking-widest transition-colors ${demoActive ? 'border-red-500/30 text-red-400 hover:text-red-300 hover:border-red-500/50 bg-red-500/10' : 'border-yellow-500/30 text-yellow-400 hover:text-yellow-300 hover:border-yellow-500/50 bg-yellow-500/10'}`}>
            {demoActive ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {demoActive ? 'Stop Demo' : 'Demo'}
          </button>
        </div>
      </header>

      {/* DEMO MODE BANNER */}
      {demoActive && (
        <div className="sticky top-[57px] z-40 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border-b border-yellow-500/20 backdrop-blur-md px-6 py-2">
          <div className="max-w-[1600px] mx-auto flex items-center gap-4">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
              <span className="text-[10px] font-data uppercase tracking-widest text-yellow-400 font-bold">Demo Active</span>
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
      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden max-w-[1600px] mx-auto w-full">

        {/* LEFT COLUMN: Map & Stats */}
        <div className="lg:col-span-3 flex flex-col gap-6">

          {/* STATS ROW */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: '24h Fires', value: stats.fires_24h, icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10' },
              { label: 'Reports Today', value: stats.reports_24h, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { label: 'Active Alerts', value: stats.active_alerts, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
              { label: 'Avg FWI Risk', value: `${stats.avg_fire_risk}%`, icon: Thermometer, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
              { label: 'Monitored Zones', value: stats.forests_monitored, icon: TreePine, color: 'text-green-500', bg: 'bg-green-500/10' },
            ].map((stat, i) => (
              <div key={i} className="bg-[var(--canopy-green)] border border-white/5 rounded-[20px] p-5 flex flex-col gap-3 group hover:border-white/10 transition-colors">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight text-white/95">{stat.value}</div>
                  <div className="text-[10px] font-data text-white/40 uppercase tracking-widest mt-1">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* MAP */}
          <div className="flex-1 bg-[var(--canopy-green)] border border-white/5 rounded-[24px] overflow-hidden relative min-h-[500px] ring-1 ring-white/5 shadow-2xl">
            <div className="absolute top-4 left-4 z-[500] bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
              <Map className="w-4 h-4 text-white/60" />
              <span className="text-xs font-data text-white/80 uppercase tracking-widest">NASA FIRMS Telemetry</span>
              <span className="text-[9px] font-data text-green-500/60 ml-2">Click map to report</span>
            </div>

            {/* Subtle Map Vignette Overlay */}
            <div className="absolute inset-0 z-[400] pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]"></div>

            <MapContainer center={[31.5, 36.5]} zoom={8} className="w-full h-full bg-[#050A07] z-10" zoomControl={false}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; CartoDB'
                className="opacity-70 contrast-125 grayscale-[0.8] sepia-[0.3] hue-rotate-180"
              />

              <MapClickHandler onMapClick={handleMapClick} />

              {/* Clicked location marker */}
              {clickedCoords && (
                <Marker position={[clickedCoords.lat, clickedCoords.lng]} icon={clickIcon}>
                  <Popup className="tactical-popup">
                    <div className="text-xs font-data text-green-400">Report Location</div>
                  </Popup>
                </Marker>
              )}

              {(stats.forests || []).map((f, i) => (
                <Circle key={`forest-${i}`} center={[f.lat, f.lng]} radius={f.radius * 1000} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.1, weight: 1 }}>
                  <Popup className="tactical-popup"><b>{f.name}</b></Popup>
                </Circle>
              ))}

              {fires.map((f, i) => (
                <Marker key={`fire-${i}`} position={[f.latitude, f.longitude]} icon={fireIcon}>
                  <Popup className="tactical-popup">
                    <div className="text-xs font-data">
                      <b className="text-red-500">Thermal Anomaly</b><br />
                      Conf: {f.confidence}% | Src: {f.satellite}
                    </div>
                  </Popup>
                </Marker>
              ))}

              {reports.filter(r => r.latitude).map((r, i) => (
                <Marker key={`rep-${i}`} position={[r.latitude, r.longitude]} icon={reportIcon}>
                  <Popup className="tactical-popup">
                    <div className="text-xs font-data">
                      <b className="text-blue-400">Ground Report</b><br />
                      By: {r.username || 'Web'} | Type: {r.report_type}
                      {r.description && (
                        <><br /><span className="text-white/70 italic">{r.description}</span></>
                      )}
                      {r.ai_classification && r.ai_classification !== 'none' && (
                        <><br /><span className="text-purple-400">AI: {r.ai_classification} ({r.ai_confidence}%)</span></>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* RIGHT COLUMN: Feeds & Alerts */}
        <div className="flex flex-col gap-6 lg:h-[calc(100vh-120px)] overflow-hidden">

          {/* ACTIVE ALERTS */}
          <div className="flex-1 bg-[var(--canopy-green)] border border-white/5 rounded-[24px] flex flex-col min-h-[250px] overflow-hidden">
            <div className="p-5 border-b border-white/5 bg-black/20">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">Alerts</h3>
                </div>
                <span className="text-[10px] font-data bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">{alerts.filter(a => !a.resolved).length}</span>
              </div>
              {/* Filter Tabs */}
              <div className="flex gap-1">
                {['active', 'all', 'resolved'].map(f => (
                  <button key={f} onClick={() => setAlertFilter(f)} aria-label={`Filter ${f} alerts`}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-data uppercase tracking-widest transition-colors ${alertFilter === f ? 'bg-white/10 text-white/80' : 'text-white/30 hover:text-white/50'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-2 custom-scrollbar">
              {filteredAlerts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/20">
                  <CheckCircle className="w-8 h-8 mb-2" />
                  <span className="text-xs font-data uppercase tracking-widest">No {alertFilter === 'resolved' ? 'Resolved' : 'Active'} Threats</span>
                </div>
              ) : filteredAlerts.slice(0, 8).map((a, i) => (
                <div key={a.id || i} className={`p-3 rounded-xl border flex gap-3 items-start transition-all ${a.resolved ? 'border-white/5 bg-white/[0.02] opacity-60' : a.level === 'CRITICAL' ? 'border-red-500/30 bg-red-500/5' : 'border-orange-500/20 bg-orange-500/5'}`}>
                  <div className={`mt-0.5 flex-shrink-0 ${a.resolved ? 'text-green-500' : a.level === 'CRITICAL' ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>
                    {a.resolved ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/80 leading-snug truncate">{a.message}</p>
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
                      Resolve
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RISK INDEX */}
          <div className="bg-[var(--canopy-green)] border border-white/5 rounded-[24px] flex flex-col flex-1 min-h-[200px] overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center gap-2 bg-black/20">
              <Thermometer className="w-4 h-4 text-yellow-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">FWI Risk</h3>
              <Shield className="w-3 h-3 text-green-500/50 ml-auto" />
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
              {risks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/20">
                  <Thermometer className="w-6 h-6 mb-2" />
                  <span className="text-[10px] font-data uppercase tracking-widest">Awaiting data...</span>
                </div>
              ) : risks.slice(0, 8).map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[10px] font-data text-white/60 w-24 truncate">{r.region?.split(' - ')[1] || r.region}</span>
                  <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${getRiskBg(r.risk_score)}`} style={{ width: `${r.risk_score}%` }}></div>
                  </div>
                  <span className={`text-[10px] font-data font-bold w-6 text-right ${getRiskColorClass(r.risk_score).split(' ')[0]}`}>{r.risk_score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* COMMUNITY LEADERBOARD */}
          <div className="bg-[var(--canopy-green)] border border-white/5 rounded-[24px] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center gap-2 bg-black/20">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">Leaderboard</h3>
              <span className="text-[10px] font-data bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full ml-auto">{leaderboard.length} Rangers</span>
            </div>
            <div className="p-4 overflow-y-auto space-y-2 custom-scrollbar max-h-[180px]">
              {leaderboard.length === 0 ? (
                <div className="py-6 flex flex-col items-center justify-center text-white/20">
                  <Trophy className="w-6 h-6 mb-2" />
                  <span className="text-[10px] font-data uppercase tracking-widest">No reports yet</span>
                </div>
              ) : leaderboard.map((entry, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-colors">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-gray-400/20 text-gray-300' : i === 2 ? 'bg-orange-600/20 text-orange-400' : 'bg-white/5 text-white/30'}`}>
                    {i + 1}
                  </span>
                  <span className="text-xs text-white/80 flex-1 truncate">{entry.username}</span>
                  <span className="text-[9px] font-data text-white/40">{entry.report_count} reports</span>
                  <span className="text-[10px] font-data font-bold text-yellow-400">{entry.total_points} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* GROUND TRUTH TERMINAL */}
          <div className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-[24px] flex flex-col min-h-[200px] overflow-hidden shadow-[inset_0_4px_24px_rgba(0,0,0,0.5)]">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#111]">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-green-500" />
                <h3 className="text-xs font-data uppercase tracking-widest text-green-500">Live Relays</h3>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 font-data text-[10px] custom-scrollbar space-y-3">
              {reports.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-green-500/20">
                  <Radio className="w-6 h-6 mb-2" />
                  <span className="text-[10px] uppercase tracking-widest">Listening...</span>
                </div>
              ) : reports.slice(0, 6).map((r, i) => (
                <div key={i} className="flex gap-2 text-green-400/80">
                  <span className="text-green-600">&gt;</span>
                  <div>
                    <span className="text-white/60">{timeAgo(r.created_at)}</span>{' '}
                    <span className="text-green-300">[{r.username || 'WEB'}]</span>{' '}
                    <span>{r.report_type?.toUpperCase()} DETECTED</span>
                    {r.description && (
                      <span className="text-white/40 ml-1">— {r.description}</span>
                    )}
                    {r.ai_classification && r.ai_classification !== 'none' && (
                      <span className="text-purple-400 ml-1">AI:{r.ai_classification}({r.ai_confidence}%)</span>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 text-green-400 animate-pulse">
                <span className="text-green-600">&gt;</span> <div className="w-2 h-3 bg-green-500/50 mt-1"></div>
              </div>
            </div>
          </div>

        </div>
      </main>

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
