import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { submitReport } from '../lib/api';

type FormState = {
  latitude: string;
  longitude: string;
  report_type: string;
  description: string;
};

const initialFormState: FormState = {
  latitude: '32.3333',
  longitude: '35.7500',
  report_type: 'fire',
  description: '',
};

const categories = [
  { id: 'fire', labelAr: 'حريق', labelEn: 'Fire', emoji: '🔥', color: '#ff5e3a' },
  { id: 'smoke', labelAr: 'دخان', labelEn: 'Smoke', emoji: '💨', color: '#94a3b8' },
  { id: 'logging', labelAr: 'قطع أشجار', labelEn: 'Logging', emoji: '🪓', color: '#10b981' },
  { id: 'desertification', labelAr: 'تصحر', labelEn: 'Desertification', emoji: '🌵', color: '#f59e0b' },
  { id: 'pollution', labelAr: 'تلوث', labelEn: 'Pollution', emoji: '☣️', color: '#ef4444' },
  { id: 'wildlife', labelAr: 'حياة برية', labelEn: 'Wildlife', emoji: '🦌', color: '#a855f7' },
  { id: 'dispute', labelAr: 'تعدي / نزاع', labelEn: 'Encroachment / Dispute', emoji: '⚠️', color: '#e11d48' },
  { id: 'other', labelAr: 'أخرى', labelEn: 'Other', emoji: '❓', color: '#3b82f6' },

] as const;

function MapEventsHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      map.setView([lat, lng], map.getZoom() < 10 ? 10 : map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
}

export function ReportForm() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  
  const [form, setForm] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  function updateField(field: keyof FormState, value: string) {
    setForm(current => ({ ...current, [field]: value }));
  }

  function useAjlounPoint() {
    setForm(current => ({
      ...current,
      latitude: '32.3333',
      longitude: '35.7500',
    }));
  }

  function handleDetectLocation() {
    if (!navigator.geolocation) {
      alert(isAr ? 'تحديد الموقع الجغرافي غير مدعوم في متصفحك.' : 'Geolocation is not supported by your browser.');
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateField('latitude', position.coords.latitude.toFixed(5));
        updateField('longitude', position.coords.longitude.toFixed(5));
        setIsDetecting(false);
      },
      (err) => {
        console.error(err);
        alert(isAr ? 'تعذر تحديد موقعك الحالي. يرجى تفعيل الموقع أو النقر يدوياً على الخريطة.' : 'Unable to find location. Please enable location permissions or click on the map.');
        setIsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );
  }

  // Image upload handlers
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError(t('reportError'));
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReport({
        latitude,
        longitude,
        report_type: form.report_type,
        description: form.description.trim(),
      });
      setMessage(t('reportSent'));
      setForm(initialFormState);
      setPhotoPreview(null);
    } catch (errorValue) {
      const detail = errorValue instanceof Error ? errorValue.message : t('reportError');
      setError(`${t('reportError')} ${detail}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const currentLat = Number(form.latitude);
  const currentLng = Number(form.longitude);
  const hasValidCoords = Number.isFinite(currentLat) && Number.isFinite(currentLng);

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8 font-sans">
      <div className="mx-auto max-w-4xl text-start">
        <h2 className="text-3xl font-black text-white tracking-tight">{t('reportTitle')}</h2>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">{t('reportSubtitle')}</p>

        <form className="panel mt-6 grid gap-6 p-6 sm:p-8 bg-slate-950/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl" onSubmit={handleSubmit}>
          
          {/* 1. VISUAL CATEGORY SELECTION CARDS */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
              {isAr ? '1. اختر نوع التهديد / البلاغ' : '1. Select Threat / Report Category'}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.map((cat) => {
                const isSelected = form.report_type === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => updateField('report_type', cat.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 ${
                      isSelected
                        ? 'border-white bg-white/15 text-white scale-[1.05]'
                        : 'border-white/5 bg-white/5 text-slate-400 hover:border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                    style={isSelected ? {
                      boxShadow: `0 0 15px ${cat.color}25`,
                      borderColor: cat.color
                    } : undefined}
                  >
                    <span className="text-2xl mb-1.5" style={{ textShadow: isSelected ? `0 0 10px ${cat.color}40` : undefined }}>
                      {cat.emoji}
                    </span>
                    <span className="text-[10px] font-black tracking-wide leading-tight">
                      {isAr ? cat.labelAr : cat.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. MAP PICKER SECTION */}
          <div className="grid gap-6 md:grid-cols-12">
            
            {/* LEFT SIDE: MAP CONTROLS & MANUAL COORDS */}
            <div className="md:col-span-4 flex flex-col gap-4 justify-between">
              <div className="flex flex-col gap-4">
                <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
                  {isAr ? '2. تحديد الموقع الجغرافي' : '2. Geo-Location Picker'}
                </span>
                
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isDetecting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-accent hover:brightness-105 active:scale-[0.98] py-3 text-xs font-black text-slate-950 transition shadow-lg shadow-accent/15 disabled:opacity-60"
                  >
                    📡 {isDetecting ? (isAr ? 'جاري التحديد...' : 'Locating...') : (isAr ? 'تحديد موقعي الحالي' : 'Find My Location')}
                  </button>
                  
                  <button
                    type="button"
                    onClick={useAjlounPoint}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 py-3 text-xs font-black text-slate-300 hover:text-white transition"
                  >
                    📍 {t('useAjloun')}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-2">
                <label className="flex flex-col gap-2 text-[10px] font-black text-slate-400">
                  <span>{t('latitude')}</span>
                  <input
                    type="number"
                    step="0.00001"
                    inputMode="decimal"
                    required
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                    value={form.latitude}
                    onChange={event => updateField('latitude', event.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-2 text-[10px] font-black text-slate-400">
                  <span>{t('longitude')}</span>
                  <input
                    type="number"
                    step="0.00001"
                    inputMode="decimal"
                    required
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                    value={form.longitude}
                    onChange={event => updateField('longitude', event.target.value)}
                  />
                </label>
              </div>
            </div>

            {/* RIGHT SIDE: EMBEDDED MAP PICKER */}
            <div className="md:col-span-8 flex flex-col gap-2 text-start">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {isAr ? 'انقر على الخريطة لتحديد الإحداثيات مباشرة:' : 'Click on the map to target coordinates:'}
              </span>
              <div className="h-[240px] w-full rounded-3xl overflow-hidden border border-white/10 relative z-0">
                <MapContainer
                  center={[31.165, 36.25]}
                  zoom={8}
                  minZoom={7}
                  maxBounds={[[29.0, 34.0], [33.5, 39.5]]}
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  />
                  <MapEventsHandler onSelect={(lat, lng) => {
                    updateField('latitude', lat.toFixed(5));
                    updateField('longitude', lng.toFixed(5));
                  }} />
                  {hasValidCoords && <MapRecenter lat={currentLat} lng={currentLng} />}
                  {hasValidCoords && (
                    <CircleMarker
                      center={[currentLat, currentLng]}
                      radius={9}
                      pathOptions={{
                        color: '#00f2fe',
                        fillColor: '#00f2fe',
                        fillOpacity: 0.8,
                        weight: 2
                      }}
                    />
                  )}
                </MapContainer>
              </div>
            </div>
          </div>

          {/* 3. PHOTO UPLOAD & DESCRIPTION */}
          <div className="grid gap-6 md:grid-cols-2 pt-2">
            
            {/* PHOTO ATTACHMENT DRAG ZONE */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
                {isAr ? '3. إرفاق صورة الدليل (اختياري)' : '3. Attach Photo Evidence (Optional)'}
              </span>
              
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-5 transition-all duration-350 ${
                  dragActive 
                    ? 'border-accent bg-accent/5' 
                    : photoPreview 
                    ? 'border-white/20 bg-slate-900/20' 
                    : 'border-white/10 bg-slate-900/60 hover:border-white/20'
                }`}
                style={{ height: '170px' }}
              >
                {photoPreview ? (
                  <div className="relative w-full h-full rounded-2xl overflow-hidden group">
                    <img 
                      src={photoPreview} 
                      alt="Upload preview" 
                      className="w-full h-full object-cover" 
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full bg-slate-950/80 text-white font-bold hover:bg-slate-950 transition"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-3xl mb-2">📸</span>
                    <p className="text-xs font-black text-slate-300">
                      {isAr ? 'اسحب وأفلت الصورة هنا، أو' : 'Drag & drop image here, or'}
                    </p>
                    <label className="mt-2.5 text-[10px] font-black text-accent cursor-pointer hover:underline">
                      <span>{isAr ? 'تصفح الملفات' : 'Browse Files'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange} 
                      />
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* DESCRIPTION FIELD */}
            <div className="flex flex-col gap-3">
              <label className="field flex flex-col gap-2 text-xs font-black text-slate-300 uppercase tracking-wider">
                <span>{isAr ? '4. تفاصيل البلاغ الوصفية' : '4. Report Details & Description'}</span>
                <textarea
                  rows={6}
                  maxLength={1000}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-3xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition duration-200 resize-none leading-relaxed"
                  placeholder={t('descriptionPlaceholder')}
                  style={{ height: '170px' }}
                  value={form.description}
                  onChange={event => updateField('description', event.target.value)}
                />
              </label>
            </div>
          </div>

          {/* SUBMIT ROW */}
          <div className="flex items-center justify-end pt-3">
            <button 
              type="submit" 
              className="inline-flex items-center justify-center rounded-2xl bg-accent hover:brightness-105 active:scale-[0.98] px-8 py-3 text-xs font-black text-slate-950 transition-all duration-300 shadow-lg shadow-accent/15" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (isAr ? 'جاري إرسال البلاغ الفضائي...' : 'Broadcasting satellite report...') : (isAr ? 'إرسال البلاغ الفوري' : 'Broadcast Report Now')}
            </button>
          </div>

          {message ? (
            <div className="rounded-2xl border border-success/30 bg-success/10 p-4 text-start text-xs font-black text-green-200 shadow-lg shadow-success/5 animate-pulse flex items-center gap-2">
              <span>✓</span>
              <span>{message}</span>
            </div>
          ) : null}
          {error ? (
            <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-start text-xs font-black text-red-200 shadow-lg shadow-danger/5 animate-pulse flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
}
