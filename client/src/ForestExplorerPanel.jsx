import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Search, TreePine, Mountain, Star, MapPin, Filter, ChevronDown } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

const FOREST_TYPES = ['Mediterranean', 'Cedar montane', 'Cedar-oak mixed', 'Mountain oak', 'Wetland', 'Mangrove', 'Juniper woodland', 'Cork oak', 'Desert oasis', 'Savanna woodland', 'Other'];

export default function ForestExplorerPanel({ forests = [], onClose, onSelectForest }) {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterUnesco, setFilterUnesco] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const countries = useMemo(() => {
    const map = {};
    forests.forEach(f => {
      if (!map[f.country]) map[f.country] = f.country;
    });
    return Object.keys(map).sort();
  }, [forests]);

  const filtered = useMemo(() => {
    return forests.filter(f => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        f.name?.toLowerCase().includes(q) ||
        f.nameAr?.includes(searchQuery) ||
        f.country?.toLowerCase().includes(q) ||
        f.forestType?.toLowerCase().includes(q);
      const matchesType = !filterType || f.forestType?.toLowerCase().includes(filterType.toLowerCase());
      const matchesCountry = !filterCountry || f.country === filterCountry;
      const matchesUnesco = !filterUnesco || f.unescoStatus;
      return matchesSearch && matchesType && matchesCountry && matchesUnesco;
    });
  }, [forests, searchQuery, filterType, filterCountry, filterUnesco]);

  const getTypeIcon = (type) => {
    if (!type) return '🌲';
    const t = type.toLowerCase();
    if (t.includes('cedar') || t.includes('fir')) return '🌲';
    if (t.includes('mangrove') || t.includes('wetland') || t.includes('oasis')) return '🌊';
    if (t.includes('juniper') || t.includes('mountain') || t.includes('highland')) return '⛰️';
    if (t.includes('savanna') || t.includes('acacia')) return '🌿';
    if (t.includes('cork') || t.includes('oak')) return '🌳';
    if (t.includes('desert') || t.includes('arid')) return '🏜️';
    return '🌲';
  };

  return (
    <Sheet open={!!forests.length} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full max-w-md bg-[#0A140E]/95 backdrop-blur-2xl border-s border-white/10 p-0 flex flex-col overflow-hidden outline-none shadow-2xl">
        
        {/* Header */}
        <div className="flex-shrink-0 p-5 border-b border-white/5 bg-black/30">
          <SheetHeader className="mb-4 space-y-0 flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              <SheetTitle className="text-lg font-bold text-white/90 tracking-tight">{t('explorer.title', 'Forest Explorer')}</SheetTitle>
            </div>
            {/* Native close button is provided by SheetContent, but we keep the custom look if needed or just use default */}
          </SheetHeader>
          
          <SheetDescription className="sr-only">
            Explore diverse forests across the MENA region, filter by type, country, and UNESCO status.
          </SheetDescription>

          {/* Search */}
          <div className="relative mb-3 mt-4">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('explorer.searchPlaceholder', 'Search forests, countries, types...')}
              className="w-full bg-white/5 border border-white/10 rounded-xl ps-9 pe-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/40 transition-colors focus-ring"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              className="flex items-center gap-1.5 text-[10px] font-data uppercase tracking-widest text-white/50 hover:text-white/80 transition-colors focus-ring px-1 rounded-sm"
            >
              <Filter className="w-3 h-3" />
              {t('explorer.filters', 'Filters')}
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <span className="text-[10px] font-data text-white/40 uppercase tracking-widest">
              {filtered.length} {t('explorer.results', 'forests')}
            </span>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
              <div className="flex gap-2">
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/40"
                >
                  <option value="">{t('explorer.allCountries', 'All Countries')}</option>
                  {countries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/40"
                >
                  <option value="">{t('explorer.allTypes', 'All Types')}</option>
                  {FOREST_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterUnesco}
                  onChange={(e) => setFilterUnesco(e.target.checked)}
                  className="accent-amber-500 w-3.5 h-3.5"
                />
                <span className="text-xs text-white/60">🏛 {t('explorer.unescoOnly', 'UNESCO Sites Only')}</span>
              </label>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-white/20">
              <TreePine className="w-10 h-10 mb-3" />
              <p className="text-sm">{t('explorer.noResults', 'No forests found')}</p>
              <p className="text-xs text-white/10 mt-1">{t('explorer.tryDifferent', 'Try different search terms')}</p>
            </div>
          ) : filtered.map((f, i) => (
            <button
              key={f.id || i}
              onClick={() => onSelectForest(f)}
              aria-label={`Select forest: ${i18n.language === 'ar' && f.nameAr ? f.nameAr : f.name}`}
              className="w-full text-start p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-emerald-500/20 transition-all group cursor-pointer hover-lift click-scale focus-ring"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                  {getTypeIcon(f.forestType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm font-medium text-white/90 truncate">
                      {i18n.language === 'ar' && f.nameAr ? f.nameAr : f.name}
                    </span>
                    {f.unescoStatus && <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-data flex-shrink-0">UNESCO</span>}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-data text-white/40">
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" /> {f.country}
                    </span>
                    <span>•</span>
                    <span>{f.forestType || 'Forest'}</span>
                    {f.area > 0 && <><span>•</span><span>{f.area} km²</span></>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {f.elevation > 0 && (
                    <span className="text-[9px] font-data text-white/30 flex items-center gap-0.5">
                      <Mountain className="w-2.5 h-2.5" /> {f.elevation}m
                    </span>
                  )}
                  <span className="text-[9px] font-data text-emerald-500/60 flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60"></span> {f.radius}km
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-white/5 bg-black/20">
          <p className="text-[9px] font-data text-white/30 uppercase tracking-widest text-center">
            ⭐ {t('explorer.famousNote', 'Most Famous Forests in the MENA Region')}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
