import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, PieChart as PieIcon, BarChart3, X } from 'lucide-react';

const API_URL = '/api';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

const RISK_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
};

function AnalyticsPanel({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch(`${API_URL}/stats/history?days=7`)
      .then(r => r.json())
      .then(data => { setHistory(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tooltipStyle = {
    contentStyle: { background: '#0a140e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11, color: '#fff' },
    itemStyle: { color: '#a3a3a3' },
  };

  // Transform alert trend data into per-date objects
  const alertByDate = {};
  (history?.alertTrend || []).forEach(row => {
    if (!alertByDate[row.date]) alertByDate[row.date] = { date: row.date.slice(5) };
    alertByDate[row.date][row.level] = row.count;
  });
  const alertChartData = Object.values(alertByDate);

  // Transform report types for pie chart
  const pieData = (history?.reportsByType || []).map(r => ({
    name: t(`analyticsPanel.reportTypes.${r.report_type}`, r.report_type),
    value: r.count,
  }));

  // Rain vs FWI trend (last 48h, bucketed by hour)
  const rainRiskSeries = (() => {
    if (!history?.riskTrend) return [];
    const buckets = {};
    history.riskTrend.forEach(entry => {
      const ts = entry.updated_at;
      if (!ts) return;
      const key = ts.slice(0, 13); // YYYY-MM-DDTHH
      if (!buckets[key]) {
        buckets[key] = { key, count: 0, riskSum: 0, rainProbSum: 0, rainCount: 0 };
      }
      buckets[key].count += 1;
      buckets[key].riskSum += entry.risk_score || 0;
      if (typeof entry.rain_probability === 'number') {
        buckets[key].rainProbSum += entry.rain_probability;
        buckets[key].rainCount += 1;
      }
    });
    return Object.values(buckets)
      .map(b => ({
        label: b.key.slice(5), // MM-DDTHH
        avgRisk: b.count ? Math.round(b.riskSum / b.count) : 0,
        avgRainProb: b.rainCount ? Math.round(b.rainProbSum / b.rainCount) : 0,
      }))
      .sort((a, b) => (a.label > b.label ? 1 : -1));
  })();

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={t('analyticsPanel.title')} onClick={onClose}>
      <div className="bg-[#0a140e] border border-white/10 rounded-[24px] w-full max-w-5xl max-h-[85vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0a140e]/95 backdrop-blur-xl border-b border-white/5 p-5 flex justify-between items-center rounded-t-[24px]">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-bold text-white/90">{t('analyticsPanel.title')}</h2>
            <span className="text-[10px] font-data bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full uppercase">{t('analyticsPanel.period')}</span>
          </div>
          <button onClick={onClose} aria-label={t('analyticsPanel.title')} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-20 flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-data text-white/40 uppercase tracking-widest">{t('analyticsPanel.loading')}</p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fire Trend */}
            <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-red-400" />
                <h3 className="text-xs font-data uppercase tracking-widest text-white/60">{t('analyticsPanel.fireTrend')}</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={(history?.fireTrend || []).map(d => ({ ...d, date: d.date.slice(5) }))}>
                  <defs>
                    <linearGradient id="fireGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#666' }} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Area type="monotone" dataKey="count" stroke="#ef4444" fill="url(#fireGrad)" strokeWidth={2} name={t('analyticsPanel.hotspots')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Alert Distribution */}
            <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-orange-400" />
                <h3 className="text-xs font-data uppercase tracking-widest text-white/60">{t('analyticsPanel.alertDist')}</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={alertChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#666' }} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="CRITICAL" stackId="a" fill={RISK_COLORS.CRITICAL} radius={[0, 0, 0, 0]} name={t('analyticsPanel.critical')} />
                  <Bar dataKey="HIGH" stackId="a" fill={RISK_COLORS.HIGH} name={t('analyticsPanel.high')} />
                  <Bar dataKey="MEDIUM" stackId="a" fill={RISK_COLORS.MEDIUM} radius={[4, 4, 0, 0]} name={t('analyticsPanel.medium')} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Distribution */}
            <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-yellow-400" />
                <h3 className="text-xs font-data uppercase tracking-widest text-white/60">{t('analyticsPanel.forestRisk')}</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(history?.riskDistribution || []).map(d => ({ ...d, name: d.region?.split(' - ')[1] || d.region }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#666' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#888' }} width={80} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="risk_score" name={t('analyticsPanel.riskScore')} radius={[0, 6, 6, 0]}>
                    {(history?.riskDistribution || []).map((entry, i) => (
                      <Cell key={i} fill={entry.risk_score >= 65 ? '#ef4444' : entry.risk_score >= 45 ? '#f97316' : entry.risk_score >= 25 ? '#eab308' : '#22c55e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Rain vs FWI */}
            <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-data uppercase tracking-widest text-white/60">{t('analyticsPanel.rainVsRisk')}</h3>
              </div>
              {rainRiskSeries.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-white/20 text-xs font-data">{t('analyticsPanel.noRainData')}</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={rainRiskSeries}>
                    <defs>
                      <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#666' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#666' }} domain={[0, 100]} />
                    <Tooltip {...tooltipStyle} />
                    <Area type="monotone" dataKey="avgRisk" stroke="#eab308" fill="url(#riskGrad)" strokeWidth={2} name={t('analyticsPanel.riskScore')} />
                    <Area type="monotone" dataKey="avgRainProb" stroke="#0ea5e9" fill="url(#rainGrad)" strokeWidth={2} name={t('dashboard.rain.title')} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Reports by Type */}
            <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <PieIcon className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-data uppercase tracking-widest text-white/60">{t('analyticsPanel.reportsByType')}</h3>
              </div>
              {pieData.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-white/20 text-xs font-data">{t('analyticsPanel.noReports')}</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalyticsPanel;
