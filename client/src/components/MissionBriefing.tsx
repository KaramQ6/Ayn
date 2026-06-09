import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { UnitMode } from '../types';

type MissionBriefingProps = {
  unitMode: UnitMode;
};

type BriefingData = {
  missionNum: string;
  titleAr: string;
  titleEn: string;
  objectiveAr: string;
  objectiveEn: string;
  challengeAr: string;
  challengeEn: string;
  satellite: string;
  orbitAr: string;
  orbitEn: string;
  techDescAr: string;
  techDescEn: string;
  appIconAr: string;
  appIconEn: string;
  accentColor: string;
  tasks: Array<{ ar: string; en: string; points: number }>;
};

const BRIEFINGS: Record<UnitMode, BriefingData> = {
  fayy: {
    missionNum: '01',
    titleAr: 'حارس الغابات',
    titleEn: 'Wildfire Guardian',
    objectiveAr: 'رصد نقاط الحرارة النشطة وإصدار إنذارات مبكرة للحرائق في غابات الأردن',
    objectiveEn: 'Detect active thermal hotspots and issue early wildfire warnings across Jordan\'s forests',
    challengeAr: 'الأردن يخسر آلاف الدونمات من الغطاء الحرجي سنوياً بسبب الحرائق. الإنذار المبكر ينقذ حياة وأشجاراً.',
    challengeEn: 'Jordan loses thousands of dunams of forest cover annually to wildfires. Early warning saves lives and trees.',
    satellite: 'NASA VIIRS (NOAA-20) + MODIS (Terra/Aqua)',
    orbitAr: 'مدار قطبي متزامن مع الشمس — ارتفاع 824 كم',
    orbitEn: 'Sun-synchronous polar orbit — altitude 824 km',
    techDescAr: 'مستشعر VIIRS يرصد الإشعاع الحراري بدقة 375 متر. يكتشف نقاط الحرارة النشطة كل 12 ساعة فوق الأردن.',
    techDescEn: 'VIIRS sensor detects thermal radiation at 375m resolution. Passes over Jordan every 12 hours detecting active hotspots.',
    appIconAr: 'رصد الأرض',
    appIconEn: 'Earth Observation',
    accentColor: 'border-orange-500/40 bg-orange-500/5',
    tasks: [
      { ar: 'ابحث عن نقطة حرارة نشطة على الخريطة', en: 'Find an active hotspot on the map', points: 20 },
      { ar: 'أرسل بلاغاً مع صورة', en: 'Submit a report with a photo', points: 40 },
      { ar: 'راقب تطور الخطر خلال 24 ساعة', en: 'Monitor risk evolution for 24h', points: 30 },
    ],
  },
  najji: {
    missionNum: '02',
    titleAr: 'حارس الأودية',
    titleEn: 'Flood Sentinel',
    objectiveAr: 'قياس هطول الأمطار وحساب معدل الجريان لتحذير سكان الأودية مسبقاً',
    objectiveEn: 'Measure precipitation and calculate runoff rates to warn wadi residents in advance',
    challengeAr: 'الفيضانات المفاجئة في الأودية الأردنية تودي بأرواح كل عام. البيانات الفضائية تمنح دقائق ثمينة للإخلاء.',
    challengeEn: 'Flash floods in Jordanian wadis claim lives every year. Space data grants precious minutes for evacuation.',
    satellite: 'NASA GPM Core Observatory + Open-Meteo',
    orbitAr: 'مدار مائل 65° — ارتفاع 407 كم',
    orbitEn: 'Inclined orbit 65° — altitude 407 km',
    techDescAr: 'مجسات الرادار ثنائية التردد تقيس الهطول بدقة 0.1 مم/ساعة. البيانات تُدمج مع نموذج التدفق الهيدرولوجي.',
    techDescEn: 'Dual-frequency radar measures precipitation at 0.1 mm/hr accuracy. Data fused with hydrological flow model.',
    appIconAr: 'الأرصاد الجوية الفضائية',
    appIconEn: 'Space Weather Monitoring',
    accentColor: 'border-blue-500/40 bg-blue-500/5',
    tasks: [
      { ar: 'راقب معدل الهطول في وادٍ واحد', en: 'Monitor precipitation in one wadi', points: 20 },
      { ar: 'احسب معدل الجريان ومستوى الخطر', en: 'Calculate runoff and risk level', points: 30 },
      { ar: 'أرسل تحذير فيضان إذا تجاوز الخطر MEDIUM', en: 'Submit flood warning if risk exceeds MEDIUM', points: 50 },
    ],
  },
  baydar: {
    missionNum: '03',
    titleAr: 'عين الحقول',
    titleEn: 'Harvest Intel',
    objectiveAr: 'تحليل مؤشر NDVI للغطاء النباتي ودعم قرارات الري في المناطق الزراعية الأردنية',
    objectiveEn: 'Analyze NDVI vegetation index and support irrigation decisions in Jordanian agricultural areas',
    challengeAr: 'الأردن يعاني شح المياه وضغطاً على القطاع الزراعي. البيانات الفضائية تُحسّن كفاءة الري بنسبة تصل لـ 30%.',
    challengeEn: 'Jordan faces water scarcity and pressure on agriculture. Space data can improve irrigation efficiency by up to 30%.',
    satellite: 'Sentinel-2A / 2B (ESA Copernicus)',
    orbitAr: 'مدار قطبي متزامن مع الشمس — ارتفاع 786 كم — دورة 10 أيام',
    orbitEn: 'Sun-synchronous polar orbit — 786 km — 10-day revisit',
    techDescAr: 'نطاقات الأشعة تحت الحمراء القريبة (NIR) مقسومة على النطاق الأحمر تُنتج مؤشر NDVI لصحة المحصول.',
    techDescEn: 'Near-infrared bands divided by red band produce NDVI index measuring crop health and water stress.',
    appIconAr: 'مراقبة الغطاء النباتي',
    appIconEn: 'Vegetation Monitoring',
    accentColor: 'border-green-500/40 bg-green-500/5',
    tasks: [
      { ar: 'اقرأ مؤشر NDVI لموقع زراعي', en: 'Read NDVI index for an agricultural site', points: 20 },
      { ar: 'حدّد موقعاً يعاني إجهاداً مائياً', en: 'Identify a site showing water stress', points: 30 },
      { ar: 'أرسل توصية ري مبنية على البيانات', en: 'Submit a data-based irrigation recommendation', points: 40 },
    ],
  },
  shuaa: {
    missionNum: '04',
    titleAr: 'خريطة الطاقة',
    titleEn: 'Solar Scout',
    objectiveAr: 'تحديد أفضل المواقع للطاقة الشمسية في الأردن بناءً على بيانات الإشعاع الشمسي الفضائية',
    objectiveEn: 'Identify optimal solar energy sites in Jordan based on satellite solar irradiance data',
    challengeAr: 'الأردن يستورد 96% من طاقته. موارد الطاقة الشمسية الهائلة يمكن تحديدها بدقة عبر الأقمار الصناعية.',
    challengeEn: 'Jordan imports 96% of its energy. Vast solar resources can be precisely identified via satellites.',
    satellite: 'GOES-16 + ERA5 Reanalysis (Copernicus)',
    orbitAr: 'GOES-16: مدار جيوثابت — ارتفاع 35,786 كم',
    orbitEn: 'GOES-16: Geostationary orbit — altitude 35,786 km',
    techDescAr: 'بيانات الإشعاع الشمسي المباشر (DNI) والأفقي الكلي (GHI) من القمر الجيوثابت تُحدد إمكانية التوليد.',
    techDescEn: 'Direct Normal Irradiance (DNI) and Global Horizontal Irradiance (GHI) from geostationary satellite determine generation potential.',
    appIconAr: 'الطقس الفضائي',
    appIconEn: 'Space Meteorology',
    accentColor: 'border-yellow-500/40 bg-yellow-500/5',
    tasks: [
      { ar: 'ابحث عن موقع بإمكانية EXCELLENT', en: 'Find a site with EXCELLENT potential', points: 20 },
      { ar: 'قارن بين موقعين شمسيين', en: 'Compare two solar sites', points: 25 },
      { ar: 'أرسل توصية تركيب محطة شمسية', en: 'Submit a solar station installation recommendation', points: 35 },
    ],
  },
  riyah: {
    missionNum: '05',
    titleAr: 'كاشف الغبار',
    titleEn: 'Dust Tracker',
    objectiveAr: 'رصد عواصف الغبار وجودة الهواء في الأردن عبر بيانات الجسيمات الجوية الفضائية',
    objectiveEn: 'Monitor dust storms and air quality in Jordan using satellite atmospheric particle data',
    challengeAr: 'عواصف الغبار في الأردن تُلحق أضراراً بالصحة والزراعة والطيران. التحذير المبكر يُنقذ أرواحاً.',
    challengeEn: 'Dust storms in Jordan damage health, agriculture, and aviation. Early warning saves lives.',
    satellite: 'Terra / Aqua MODIS Aerosol Product',
    orbitAr: 'مدار قطبي — ارتفاع 705 كم — تغطية يومية كاملة',
    orbitEn: 'Polar orbit — altitude 705 km — daily global coverage',
    techDescAr: 'منتج الهباء الجوي MODIS يقيس عمق البصري للهباء (AOD) لتقدير تركيز الجسيمات PM10 و PM2.5.',
    techDescEn: 'MODIS Aerosol Optical Depth (AOD) product estimates PM10 and PM2.5 particle concentrations.',
    appIconAr: 'رصد الغلاف الجوي',
    appIconEn: 'Atmospheric Monitoring',
    accentColor: 'border-stone-500/40 bg-stone-500/5',
    tasks: [
      { ar: 'حدّد موقعاً بجودة هواء سيئة (AQI > 150)', en: 'Identify a site with poor air quality (AQI > 150)', points: 20 },
      { ar: 'تتبع اتجاه العاصفة الترابية', en: 'Track the dust storm direction', points: 30 },
      { ar: 'أرسل تحذيراً صحياً للمنطقة المتضررة', en: 'Submit a health warning for the affected area', points: 40 },
    ],
  },
  niza: {
    missionNum: '06',
    titleAr: 'رقيب الأراضي',
    titleEn: 'Land Monitor',
    objectiveAr: 'رصد التعدي على المحميات الطبيعية الأردنية وتوثيق النزاعات البيئية',
    objectiveEn: 'Monitor encroachment on Jordanian nature reserves and document environmental conflicts',
    challengeAr: 'محميات الأردن تتعرض لرعي جائر وتعدٍ متزايد. البيانات الفضائية توثّق التغيرات بموضوعية.',
    challengeEn: 'Jordan\'s reserves face overgrazing and increasing encroachment. Satellite data objectively documents changes.',
    satellite: 'Sentinel-1A / 1B SAR (ESA Copernicus)',
    orbitAr: 'مدار قطبي — ارتفاع 693 كم — رادار SAR يخترق السحاب',
    orbitEn: 'Polar orbit — 693 km — SAR radar penetrates cloud cover',
    techDescAr: 'رادار الفتحة الاصطناعية (SAR) يكتشف تغيرات الغطاء الأرضي بغض النظر عن الطقس أو الليل.',
    techDescEn: 'Synthetic Aperture Radar (SAR) detects land cover changes regardless of weather or night conditions.',
    appIconAr: 'رصد الأرض الرادارية',
    appIconEn: 'Radar Earth Observation',
    accentColor: 'border-purple-500/40 bg-purple-500/5',
    tasks: [
      { ar: 'اقرأ آخر تقرير نزاع أو تعدٍّ', en: 'Read the latest conflict or encroachment report', points: 20 },
      { ar: 'حدّد أخطر منطقة تعدٍّ موثّقة', en: 'Identify the most critical documented encroachment zone', points: 30 },
      { ar: 'أرسل بلاغ نزاع موثق بالموقع', en: 'Submit a geotagged conflict report', points: 50 },
    ],
  },
  najm: {
    missionNum: '07',
    titleAr: 'حارس الظلام',
    titleEn: 'Dark Sky Defender',
    objectiveAr: 'تقييم تلوث الضوء وتحديد أفضل مواقع الرصد الفلكي في الأردن',
    objectiveEn: 'Assess light pollution and identify the best astronomical observation sites in Jordan',
    challengeAr: 'التوسع العمراني يقضي على سماء الليل المظلمة. الأردن يمتلك مواقع فلكية نادرة تستحق الحماية.',
    challengeEn: 'Urban expansion destroys dark skies. Jordan has rare astronomical sites worth protecting.',
    satellite: 'NOAA-20 VIIRS Day/Night Band (DNB)',
    orbitAr: 'مدار قطبي متزامن مع الشمس — ارتفاع 824 كم',
    orbitEn: 'Sun-synchronous polar orbit — altitude 824 km',
    techDescAr: 'نطاق الليل/النهار (DNB) يقيس الإضاءة الاصطناعية الليلية بحساسية تصل لمناطيد الضوء المنفردة.',
    techDescEn: 'Day/Night Band (DNB) measures artificial night light with sensitivity down to single light balloons.',
    appIconAr: 'رصد الليل الفضائي',
    appIconEn: 'Night-time Space Monitoring',
    accentColor: 'border-indigo-500/40 bg-indigo-500/5',
    tasks: [
      { ar: 'ابحث عن موقع Bortle ≤ 3 (سماء داكنة)', en: 'Find a site with Bortle ≤ 3 (dark sky)', points: 20 },
      { ar: 'قارن مستويات التلوث الضوئي', en: 'Compare light pollution levels', points: 25 },
      { ar: 'سجّل موقعاً فلكياً مميزاً', en: 'Register a notable astronomical site', points: 35 },
    ],
  },
  jamal: {
    missionNum: '08',
    titleAr: 'راصد الحياة',
    titleEn: 'Wildlife Observer',
    objectiveAr: 'متابعة أعداد الحياة البرية المهددة بالانقراض في المحميات الطبيعية الأردنية',
    objectiveEn: 'Track endangered wildlife populations in Jordanian nature reserves',
    challengeAr: 'الحياة البرية الأردنية مهددة بالصيد والتعدي. الرصد المنتظم عبر GPS والأقمار الصناعية يدعم الحماية.',
    challengeEn: 'Jordanian wildlife is threatened by poaching and encroachment. Regular GPS and satellite monitoring supports protection.',
    satellite: 'GPS Constellation + iNaturalist Crowdsourcing',
    orbitAr: 'مدار GPS المتوسط — ارتفاع 20,200 كم — 24 قمراً',
    orbitEn: 'GPS Medium Earth Orbit — 20,200 km — 24 satellites',
    techDescAr: 'تقنية GPS تُحدد مواقع الأنواع بدقة متر واحد. البيانات الجماعية من iNaturalist تُكمل الرصد الفضائي.',
    techDescEn: 'GPS technology locates species to 1-meter accuracy. iNaturalist crowdsourced data complements satellite monitoring.',
    appIconAr: 'الملاحة الفضائية وGPS',
    appIconEn: 'Space Navigation & GPS',
    accentColor: 'border-teal-500/40 bg-teal-500/5',
    tasks: [
      { ar: 'ابحث عن نوع مهدد بالانقراض نشط', en: 'Find an active endangered species record', points: 20 },
      { ar: 'تتبع نشاط نوع خلال الشهر الماضي', en: 'Track a species activity over the past month', points: 25 },
      { ar: 'أرسل مشاهدة حياة برية موثّقة', en: 'Submit a documented wildlife sighting', points: 40 },
    ],
  },
};

export function MissionBriefing({ unitMode }: MissionBriefingProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [expanded, setExpanded] = useState(false);
  const b = BRIEFINGS[unitMode];

  return (
    <div className={`rounded-2xl border ${b.accentColor} mb-5 overflow-hidden`}>
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between p-4 text-start hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center h-10 w-10 rounded-xl bg-white/5 border border-white/10 shrink-0">
            <span className="text-[9px] font-black text-white/30 leading-none">MISSION</span>
            <span className="text-base font-black text-white leading-none">{b.missionNum}</span>
          </div>
          <div>
            <p className="text-xs font-black text-white/40 uppercase tracking-widest">
              {isAr ? b.appIconAr : b.appIconEn}
            </p>
            <h3 className="text-sm font-black text-white">
              {isAr ? b.titleAr : b.titleEn}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="hidden sm:block font-mono text-[10px]">{b.satellite}</span>
          <span className="text-slate-600">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Objective — always visible */}
      <div className="px-4 pb-3">
        <p className="text-xs text-slate-400 leading-relaxed">
          🎯 {isAr ? b.objectiveAr : b.objectiveEn}
        </p>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-white/5 px-4 py-4 space-y-4">

          {/* Jordan challenge */}
          <div className="rounded-xl bg-white/3 border border-white/5 p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
              {isAr ? 'التحدي الأردني' : 'JORDAN CHALLENGE'}
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isAr ? b.challengeAr : b.challengeEn}
            </p>
          </div>

          {/* Satellite tech */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/3 border border-white/5 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                {isAr ? 'القمر الصناعي' : 'SATELLITE'}
              </p>
              <p className="text-xs font-mono text-white">{b.satellite}</p>
              <p className="text-[10px] text-slate-500 mt-1">{isAr ? b.orbitAr : b.orbitEn}</p>
            </div>
            <div className="rounded-xl bg-white/3 border border-white/5 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                {isAr ? 'كيف تعمل التقنية؟' : 'HOW THE TECH WORKS'}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isAr ? b.techDescAr : b.techDescEn}
              </p>
            </div>
          </div>

          {/* Mission tasks */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              {isAr ? 'مهام اللاعب' : 'PLAYER TASKS'}
            </p>
            <div className="space-y-2">
              {b.tasks.map((task, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-lg bg-white/3 border border-white/5 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-white/20">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-xs text-slate-300">{isAr ? task.ar : task.en}</span>
                  </div>
                  <span className="text-[10px] font-black text-yellow-400 shrink-0">+{task.points} pts</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
