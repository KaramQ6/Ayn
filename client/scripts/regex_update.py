import re, codecs

file_path = "c:/Users/ASUS/OneDrive/المستندات/GitHub/Aesll/ForestGuard-AI/client/src/Dashboard.jsx"
with codecs.open(file_path, "r", "utf-8") as f:
    content = f.read()

new_main_block = """{/* MAIN DASHBOARD */}
      <main className="flex-1 p-4 md:p-6 flex flex-col lg:flex-row gap-6 overflow-hidden max-w-[1800px] mx-auto w-full h-[calc(100vh-80px)]">

        {/* LEFT SIDEBAR: Stats & Feeds */}
        <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col gap-6 overflow-y-auto custom-scrollbar lg:pe-2">
          
          {/* STATS GRID */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: t('dashboard.stats.fires24h'), value: stats.fires_24h, icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10' },
              { label: t('dashboard.stats.reportsToday'), value: stats.reports_24h, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { label: t('dashboard.stats.activeAlerts'), value: stats.active_alerts, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
              { label: t('dashboard.stats.avgFWI'), value: `${stats.avg_fire_risk}%`, icon: Thermometer, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
              { label: t('dashboard.stats.monitoredZones'), value: stats.forests_monitored, icon: TreePine, color: 'text-green-500', bg: 'bg-green-500/10' },
              { label: t('dashboard.stats.rainyZones'), value: `${rainyZones}/${stats.forests_monitored || (risks.length || 0)}`, icon: Globe, color: 'text-sky-400', bg: 'bg-sky-500/10', sub: avgRainProb ? t('dashboard.rain.avgShort', { value: avgRainProb }) : null },
            ].map((stat, i) => (
              <div key={i} className="bg-[var(--canopy-green)] border border-white/5 rounded-[16px] p-4 flex flex-col gap-2 relative overflow-hidden group hover:border-[#10B981]/50 transition-colors">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#10B981]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className={`w-8 h-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xl font-bold tracking-tight text-white/95">{stat.value}</div>
                  <div className="text-[9px] font-data text-white/40 uppercase tracking-widest mt-1">{stat.label}</div>
                  {stat.sub && <div className="text-[9px] font-data text-sky-300/80 mt-0.5 truncate">{stat.sub}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* ACTIVE ALERTS */}
          <div className="bg-[var(--canopy-green)] border border-white/5 rounded-[20px] flex flex-col min-h-[250px] overflow-hidden shadow-lg border-t-2 border-t-[#10B981]/20">
            <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#10B981]" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#10B981]">{t('dashboard.alerts.title')}</h3>
              </div>
              <span className="text-[10px] font-data bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">{alerts.filter(a => !a.resolved).length}</span>
            </div>
            
            <div className="px-4 py-2 flex gap-1 border-b border-white/5 bg-black/10">
              {['active', 'all', 'resolved'].map(f => (
                <button key={f} onClick={() => setAlertFilter(f)} aria-label={`Filter ${f} alerts`}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-data uppercase tracking-widest transition-colors ${alertFilter === f ? 'bg-[#10B981]/20 text-[#10B981]' : 'text-white/30 hover:text-white/50'}`}>
                  {alertFilterLabels[f]}
                </button>
              ))}
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2 custom-scrollbar">
              {filteredAlerts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/20">
                  <CheckCircle className="w-8 h-8 mb-2 text-[#10B981]/30" />
                  <span className="text-xs font-data uppercase tracking-widest">{alertFilter === 'resolved' ? t('dashboard.alerts.noResolved') : t('dashboard.alerts.noActive')}</span>
                </div>
              ) : filteredAlerts.slice(0, 8).map((a, i) => (
                <div key={a.id || i} className={`p-3 rounded-xl border flex gap-3 items-start transition-all ${a.resolved ? 'border-white/5 bg-white/[0.02] opacity-60' : a.level === 'CRITICAL' ? 'border-red-500/30 bg-red-500/5' : 'border-[#10B981]/20 bg-[#10B981]/5'}`}>
                  <div className={`mt-0.5 flex-shrink-0 ${a.resolved ? 'text-green-500' : a.level === 'CRITICAL' ? 'text-red-500 animate-pulse' : 'text-[#10B981]'}`}>
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
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] font-data text-white/40">{timeAgo(a.created_at)}</span>
                      {a.confidence > 0 && (
                        <span className="text-[9px] font-data bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Brain className="w-2.5 h-2.5" /> {a.confidence}%
                        </span>
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

          {/* GROUND TRUTH TERMINAL */}
          <div className="flex-1 bg-[#050A07] border border-white/10 rounded-[24px] flex flex-col min-h-[200px] overflow-hidden shadow-[inset_0_4px_24px_rgba(0,0,0,0.5)] border-t-2 border-t-[#10B981]/30">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#0A140E]">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#10B981]" />
                <h3 className="text-xs font-data uppercase tracking-widest text-[#10B981]">{t('dashboard.terminal.title')}</h3>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 font-data text-[10px] custom-scrollbar space-y-3">
              {safeReports.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[#10B981]/20">
                  <Radio className="w-6 h-6 mb-2" />
                  <span className="text-[10px] uppercase tracking-widest">{t('dashboard.terminal.listening')}</span>
                </div>
              ) : safeReports.slice(0, 6).map((r, i) => (
                <div key={i} className="flex gap-2 text-[#10B981]/80">
                  <span className="text-[#10B981]">&gt;</span>
                  <div>
                    <span className="text-white/60">{timeAgo(r.created_at)}</span>{' '}
                    <span className="text-green-300">[{r.username || 'WEB'}]</span>{' '}
                    <span>{r.report_type?.toUpperCase()} {t('dashboard.terminal.detected')}</span>
                    {r.description && <span className="text-white/40 ms-1">— {r.description}</span>}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 text-[#10B981] animate-pulse">
                <span className="text-[#10B981]">&gt;</span> <div className="w-2 h-3 bg-[#10B981]/50 mt-1"></div>
              </div>
            </div>
          </div>

        </div>

        {/* MAIN MAP AREA (75% Width) */}
        <div className="flex-1 relative bg-[var(--canopy-green)] border border-white/10 rounded-[28px] overflow-hidden shadow-2xl min-h-[500px] flex flex-col">
          
          {/* Top Left Floating Pill */}
          <div className="absolute top-6 start-6 z-[500] bg-[#0A140E]/80 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg">
            <Map className="w-4 h-4 text-[#10B981]" />
            <span className="text-xs font-data text-white/90 uppercase tracking-widest">{t('dashboard.map.firmsTelemetry')}</span>
            <div className="h-4 w-px bg-white/10 mx-1"></div>
            <span className="text-[10px] font-data text-[#10B981]/80">{t('dashboard.map.clickToReport')}</span>
          </div>

          {/* Floating Risk Index Overlay (Bottom Right) */}
          <div className="absolute bottom-6 end-6 z-[500] w-[320px] pointer-events-auto hidden md:flex flex-col">
            <div className="bg-[#0A140E]/90 backdrop-blur-2xl border border-white/10 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden max-h-[300px]">
              <div className="p-4 border-b border-white/5 flex items-center gap-2 bg-[#1A211D]/50 w-full">
                <Thermometer className="w-4 h-4 text-[#10B981]" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/90">{t('dashboard.risk.title')}</h3>
                <Shield className="w-3 h-3 text-[#10B981]/50 ms-auto" />
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
          <div className="absolute inset-0 z-[400] pointer-events-none shadow-[inset_0_0_120px_rgba(5,10,7,0.9)]"></div>

          <MapContainer center={MENA_CENTER} zoom={MENA_ZOOM} className="w-full h-full bg-[#050A07] z-10 custom-map" zoomControl={false}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; CartoDB'
              className="opacity-80 contrast-125 grayscale-[0.5] sepia-[0.2] hue-rotate-180"
            />

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

            {(stats.forests || []).map((f, i) => (
              <Circle key={`forest-${i}`} center={[f.lat, f.lng]} radius={f.radius * 1000} pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.1, weight: 1 }}>
                <Popup className="tactical-popup"><b className="text-white">{f.nameAr ? `${f.nameAr} / ${f.name}` : f.name}</b></Popup>
              </Circle>
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
      </main>"""

pattern = r"\{\/\* MAIN DASHBOARD \*\/}.*?<\/main>"
new_content, count = re.subn(pattern, new_main_block, content, flags=re.DOTALL)

with codecs.open(file_path, "w", "utf-8") as f:
    f.write(new_content)

print(f"Replaced {count} instances.")
