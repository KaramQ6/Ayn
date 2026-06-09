import { useTranslation } from 'react-i18next';
import type { UnitMode } from '../types';

type LandingProps = {
  onStart: () => void;
  onUnitModeChange: (mode: UnitMode) => void;
};

const MISSIONS: Array<{
  id: UnitMode;
  num: string;
  titleAr: string;
  titleEn: string;
  objectiveAr: string;
  objectiveEn: string;
  techAr: string;
  techEn: string;
  satellite: string;
  difficultyAr: string;
  difficultyEn: string;
  color: string;
}> = [
  {
    id: 'fayy',
    num: '01',
    titleAr: 'فيّ — حارس الغابات',
    titleEn: 'Fayy — Wildfire Guardian',
    objectiveAr: 'رصد نقاط الحرارة في غابات الأردن وإصدار إنذار مبكر',
    objectiveEn: 'Detect thermal hotspots across Jordan forests and trigger early warnings',
    techAr: 'رصد الأرض — NASA VIIRS / MODIS',
    techEn: 'Earth Observation — NASA VIIRS / MODIS',
    satellite: 'TERRA / AQUA / NOAA-20',
    difficultyAr: 'متوسط',
    difficultyEn: 'Medium',
    color: 'from-orange-900/60 to-red-900/40 border-orange-500/30 hover:border-orange-400/60',
  },
  {
    id: 'najji',
    num: '02',
    titleAr: 'نجّي — حارس الأودية',
    titleEn: 'Najji — Flood Sentinel',
    objectiveAr: 'قِس هطول الأمطار وتنبّأ بفيضانات الأودية قبل وقوعها',
    objectiveEn: 'Measure precipitation and predict wadi flash floods before they strike',
    techAr: 'الأرصاد الجوية الفضائية — NASA GPM IMERG',
    techEn: 'Space Weather — NASA GPM IMERG',
    satellite: 'GPM Core Observatory',
    difficultyAr: 'مرتفع',
    difficultyEn: 'Hard',
    color: 'from-blue-900/60 to-cyan-900/40 border-blue-500/30 hover:border-blue-400/60',
  },
  {
    id: 'baydar',
    num: '03',
    titleAr: 'بيدر — عين الحقول',
    titleEn: 'Baydar — Harvest Intel',
    objectiveAr: 'تحليل إجهاد المحاصيل ومؤشر النباتات لدعم قرارات الري',
    objectiveEn: 'Analyze crop stress and vegetation index to support irrigation decisions',
    techAr: 'رصد الغطاء النباتي — Sentinel-2 NDVI',
    techEn: 'Vegetation Monitoring — Sentinel-2 NDVI',
    satellite: 'Sentinel-2A / 2B',
    difficultyAr: 'متوسط',
    difficultyEn: 'Medium',
    color: 'from-green-900/60 to-emerald-900/40 border-green-500/30 hover:border-green-400/60',
  },
  {
    id: 'shuaa',
    num: '04',
    titleAr: 'شعاع — خريطة الطاقة',
    titleEn: "Shu'aa — Solar Scout",
    objectiveAr: 'حدّد أفضل مواقع الطاقة الشمسية في الأردن عبر بيانات الإشعاع',
    objectiveEn: 'Identify optimal solar energy sites across Jordan using irradiance data',
    techAr: 'الأرصاد الفضائية — GOES-16 / ERA5',
    techEn: 'Space Meteorology — GOES-16 / ERA5',
    satellite: 'GOES-16 / Copernicus',
    difficultyAr: 'منخفض',
    difficultyEn: 'Easy',
    color: 'from-yellow-900/60 to-amber-900/40 border-yellow-500/30 hover:border-yellow-400/60',
  },
  {
    id: 'riyah',
    num: '05',
    titleAr: 'رياح — كاشف الغبار',
    titleEn: 'Riyah — Dust Tracker',
    objectiveAr: 'تتبع عواصف الغبار وقياس جودة الهواء عبر بيانات الهواء الجوي',
    objectiveEn: 'Track dust storms and measure air quality using atmospheric data',
    techAr: 'رصد الغلاف الجوي — MODIS Aerosol',
    techEn: 'Atmospheric Monitoring — MODIS Aerosol',
    satellite: 'Terra / Aqua MODIS',
    difficultyAr: 'متوسط',
    difficultyEn: 'Medium',
    color: 'from-stone-800/60 to-orange-900/40 border-stone-500/30 hover:border-stone-400/60',
  },
  {
    id: 'niza',
    num: '06',
    titleAr: "نزاع — رقيب الأراضي",
    titleEn: "Niza' — Land Monitor",
    objectiveAr: 'رصد التعدي والنزاعات على المحميات الطبيعية الأردنية',
    objectiveEn: 'Monitor encroachment and conflicts in Jordanian nature reserves',
    techAr: 'رصد الأرض — Sentinel-1 SAR',
    techEn: 'Earth Observation — Sentinel-1 SAR',
    satellite: 'Sentinel-1A / 1B',
    difficultyAr: 'مرتفع',
    difficultyEn: 'Hard',
    color: 'from-purple-900/60 to-indigo-900/40 border-purple-500/30 hover:border-purple-400/60',
  },
  {
    id: 'najm',
    num: '07',
    titleAr: 'نجم — حارس الظلام',
    titleEn: 'Najm — Dark Sky Defender',
    objectiveAr: 'قِيّم تلوث الضوء وحدّد أفضل مواقع الرصد الفلكي في الأردن',
    objectiveEn: 'Assess light pollution and identify best astronomical observation sites',
    techAr: 'رصد الليل — VIIRS Night Lights',
    techEn: 'Night-time Monitoring — VIIRS Night Lights',
    satellite: 'NOAA-20 VIIRS DNB',
    difficultyAr: 'منخفض',
    difficultyEn: 'Easy',
    color: 'from-slate-900/60 to-indigo-950/40 border-slate-500/30 hover:border-slate-400/60',
  },
  {
    id: 'jamal',
    num: '08',
    titleAr: 'جمال — راصد الحياة',
    titleEn: 'Jamal — Wildlife Observer',
    objectiveAr: 'تتبع الحياة البرية المهددة بالانقراض في محميات الأردن',
    objectiveEn: 'Track endangered wildlife populations across Jordanian reserves',
    techAr: 'الملاحة الفضائية — GPS / iNaturalist',
    techEn: 'Space Navigation — GPS / iNaturalist',
    satellite: 'GPS Constellation',
    difficultyAr: 'منخفض',
    difficultyEn: 'Easy',
    color: 'from-teal-900/60 to-green-900/40 border-teal-500/30 hover:border-teal-400/60',
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'text-green-400 bg-green-400/10 border-green-400/20',
  Medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  Hard: 'text-red-400 bg-red-400/10 border-red-400/20',
  منخفض: 'text-green-400 bg-green-400/10 border-green-400/20',
  متوسط: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  مرتفع: 'text-red-400 bg-red-400/10 border-red-400/20',
};

export function Landing({ onStart, onUnitModeChange }: LandingProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <div
      className="w-full min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative text-white font-sans"
      style={{
        backgroundImage: "url('/blur.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="relative z-10 w-full">

        {/* HERO */}
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-slate-950/55 text-xs font-bold text-white shadow-sm">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span>{isAr ? 'لعبة تعليمية تفاعلية — Astro Code 2026 🇯🇴' : 'Interactive Educational Game — Astro Code 2026 🇯🇴'}</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white uppercase leading-none">
            {isAr ? 'مـركـز مـهـمّـة الأردن' : 'Mission Control Jordan'}
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 font-medium leading-relaxed">
            {isAr
              ? 'اكتشف كيف تُحلّ التحديات البيئية الحقيقية في الأردن عبر تقنيات الأقمار الصناعية. اختر مهمتك وانضم إلى فريق الاستشعار الفضائي.'
              : 'Discover how real environmental challenges in Jordan are solved through satellite technologies. Choose your mission and join the space observation team.'}
          </p>

          {/* Space apps callout */}
          <div className="inline-flex flex-wrap justify-center gap-2 pt-2">
            {[
              { icon: '🛰️', label: isAr ? 'رصد الأرض' : 'Earth Observation' },
              { icon: '🌧️', label: isAr ? 'الأرصاد الفضائية' : 'Space Weather' },
              { icon: '🌿', label: isAr ? 'الغطاء النباتي' : 'Vegetation Index' },
              { icon: '🌙', label: isAr ? 'رصد الليل' : 'Night Monitoring' },
              { icon: '📡', label: isAr ? 'الملاحة الفضائية' : 'Space Navigation' },
            ].map(app => (
              <span key={app.label} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
                {app.icon} {app.label}
              </span>
            ))}
          </div>
        </div>

        {/* HOW TO PLAY */}
        <div className="max-w-3xl mx-auto w-full mb-10">
          <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-5">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">
              {isAr ? 'كيف تلعب؟' : 'HOW TO PLAY'}
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                {
                  step: '01',
                  ar: 'اختر مهمتك',
                  en: 'Pick a Mission',
                  subAr: 'من الوحدات أدناه',
                  subEn: 'from modules below',
                },
                {
                  step: '02',
                  ar: 'افهم التقنية',
                  en: 'Learn the Tech',
                  subAr: 'اقرأ بيانات القمر الصناعي',
                  subEn: 'read the satellite data',
                },
                {
                  step: '03',
                  ar: 'أرسل بلاغاً',
                  en: 'Submit a Report',
                  subAr: 'واكسب نقاطاً',
                  subEn: 'and earn points',
                },
              ].map(s => (
                <div key={s.step} className="flex flex-col items-center gap-1">
                  <span className="text-2xl font-black text-white/20">{s.step}</span>
                  <span className="text-sm font-black text-white">{isAr ? s.ar : s.en}</span>
                  <span className="text-xs text-slate-500">{isAr ? s.subAr : s.subEn}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MISSION CARDS */}
        <div className="max-w-7xl mx-auto w-full">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 text-center">
            {isAr ? '— اختر مهمتك —' : '— SELECT YOUR MISSION —'}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {MISSIONS.map((m) => {
              const difficulty = isAr ? m.difficultyAr : m.difficultyEn;
              const diffColor = DIFFICULTY_COLORS[difficulty] ?? 'text-slate-400';
              return (
                <div
                  key={m.id}
                  role="button"
                  tabIndex={0}
                  aria-label={isAr ? m.titleAr : m.titleEn}
                  onClick={() => { onUnitModeChange(m.id); onStart(); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onUnitModeChange(m.id);
                      onStart();
                    }
                  }}
                  className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${m.color} p-5 text-start cursor-pointer transition-all duration-200 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-white`}
                >
                  {/* Mission number */}
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-black text-white/30 tracking-widest">MISSION {m.num}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${diffColor}`}>
                      {difficulty}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-black leading-tight text-white mb-2">
                    {isAr ? m.titleAr : m.titleEn}
                  </h3>

                  {/* Objective */}
                  <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">
                    {isAr ? m.objectiveAr : m.objectiveEn}
                  </p>

                  {/* Space tech badge */}
                  <div className="mt-auto">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-1">
                      <span>🛰️</span>
                      <span>{isAr ? m.techAr : m.techEn}</span>
                    </div>
                    <div className="text-[9px] text-slate-600 font-mono">
                      {m.satellite}
                    </div>
                  </div>

                  {/* Launch button hint */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-black text-white/60">
                      {isAr ? 'إطلاق ←' : 'LAUNCH →'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER — Space applications count */}
        <div className="max-w-4xl mx-auto text-center mt-12 space-y-2">
          <div className="flex flex-wrap justify-center gap-6 text-center">
            {[
              { val: '8', labelAr: 'مهمة فضائية', labelEn: 'Space Missions' },
              { val: '6+', labelAr: 'تطبيق فضائي', labelEn: 'Space Applications' },
              { val: '60', labelAr: 'موقع مُراقَب', labelEn: 'Monitored Sites' },
              { val: '21', labelAr: 'دولة عربية', labelEn: 'Arab Countries' },
            ].map(s => (
              <div key={s.val} className="flex flex-col">
                <span className="text-3xl font-black text-white">{s.val}</span>
                <span className="text-xs text-slate-500">{isAr ? s.labelAr : s.labelEn}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-600 pt-4">
            {isAr
              ? 'منصة عين — بُنيت لـ Astro Code 2026 | تقنيات الفضاء لصالح الأردن والعالم العربي'
              : 'Ayn Platform — Built for Astro Code 2026 | Space Technologies for Jordan & the Arab World'}
          </p>
        </div>

      </div>
    </div>
  );
}
