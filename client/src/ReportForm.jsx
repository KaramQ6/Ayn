import { useState, useEffect } from 'react';
import { X, Send, MapPin, AlertTriangle } from 'lucide-react';

const API_URL = '/api';

const REPORT_TYPES = [
  { value: 'fire', label: 'Fire', color: 'text-red-500' },
  { value: 'smoke', label: 'Smoke', color: 'text-gray-400' },
  { value: 'logging', label: 'Illegal Logging', color: 'text-orange-500' },
  { value: 'desertification', label: 'Desertification', color: 'text-yellow-600' },
  { value: 'pollution', label: 'Pollution', color: 'text-purple-400' },
  { value: 'wildlife', label: 'Endangered Wildlife', color: 'text-blue-400' },
  { value: 'other', label: 'Other', color: 'text-white/50' },
];

const typeIcons = { fire: '\uD83D\uDD25', smoke: '\uD83D\uDCA8', logging: '\uD83E\uDE93', desertification: '\uD83C\uDFDC\uFE0F', pollution: '\uD83D\uDDD1\uFE0F', wildlife: '\uD83E\uDD85', other: '\u2753' };

function ReportForm({ isOpen, onClose, clickedCoords, onSubmitted }) {
  const [reportType, setReportType] = useState('fire');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(clickedCoords?.lat?.toFixed(6) || '');
  const [longitude, setLongitude] = useState(clickedCoords?.lng?.toFixed(6) || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Update coords when clickedCoords changes
  useEffect(() => {
    if (clickedCoords) {
      setLatitude(clickedCoords.lat?.toFixed(6) || '');
      setLongitude(clickedCoords.lng?.toFixed(6) || '');
    }
  }, [clickedCoords]);

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

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      setError('Please enter valid coordinates or click on the map');
      return;
    }
    if (lat < 29 || lat > 34 || lng < 34 || lng > 40) {
      setError('Coordinates must be within Jordan');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng, report_type: reportType, description }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        onSubmitted?.(data.report);
        setTimeout(() => { onClose(); setSuccess(false); setDescription(''); }, 1500);
      } else {
        setError(data.error || 'Failed to submit report');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Submit Report" onClick={onClose}>
      <div className="bg-[#0a140e] border border-white/10 rounded-[24px] w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="border-b border-white/5 p-5 flex justify-between items-center bg-black/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <h2 className="text-base font-bold text-white/90">Submit Report</h2>
          </div>
          <button onClick={onClose} aria-label="Close report form" className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="p-10 flex flex-col items-center gap-3 text-green-400">
            <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center text-2xl">&#10003;</div>
            <p className="font-bold">Report Submitted!</p>
            <p className="text-xs text-white/40">Cross-validation will begin automatically</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Report Type */}
            <div>
              <label className="text-[10px] font-data uppercase tracking-widest text-white/40 mb-2 block">Threat Type</label>
              <div className="grid grid-cols-4 gap-2">
                {REPORT_TYPES.map(type => (
                  <button key={type.value} type="button"
                    className={`p-2.5 rounded-xl border text-center transition-all text-xs ${reportType === type.value ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-white/5 bg-white/5 text-white/50 hover:border-white/10'}`}
                    onClick={() => setReportType(type.value)}>
                    <span className="text-lg block mb-1">{typeIcons[type.value]}</span>
                    <span className="text-[9px] font-data">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Coordinates */}
            <div>
              <label htmlFor="report-lat" className="text-[10px] font-data uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Location
                <span className="text-green-500 normal-case tracking-normal ml-1">(click on map to set)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input id="report-lat" type="number" step="any" placeholder="Latitude" value={latitude}
                  onChange={e => setLatitude(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white/80 focus:border-green-500/50 focus:outline-none transition-colors font-data" />
                <input id="report-lng" type="number" step="any" placeholder="Longitude" value={longitude}
                  onChange={e => setLongitude(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white/80 focus:border-green-500/50 focus:outline-none transition-colors font-data" />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="report-desc" className="text-[10px] font-data uppercase tracking-widest text-white/40 mb-2 block">Description (Optional)</label>
              <textarea id="report-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe what you observed..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white/80 focus:border-green-500/50 focus:outline-none transition-colors resize-none" />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">{error}</p>
            )}

            {/* Submit */}
            <button type="submit" disabled={submitting}
              className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Report
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ReportForm;
