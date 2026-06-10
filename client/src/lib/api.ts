import type { Report, StarAnalysis } from '../types';

const fallbackApiBaseUrl = import.meta.env.PROD ? '' : 'http://localhost:5000';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || fallbackApiBaseUrl
).replace(/\/$/, '');

function getFallbackWsUrl() {
  if (!import.meta.env.PROD || typeof window === 'undefined') {
    return 'ws://localhost:5000/ws';
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

export const WS_URL = import.meta.env.VITE_WS_URL || getFallbackWsUrl();

export function withCountry(path: string, countryCode: string) {
  if (!countryCode) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}country=${encodeURIComponent(countryCode)}`;
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function submitReport(input: Pick<Report, 'latitude' | 'longitude' | 'report_type' | 'description'>) {
  const response = await fetch(`${API_BASE_URL}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || `HTTP ${response.status}`);
  }
  return payload as { success: boolean; report: Report };
}

// Upload a star photo for realism verification + identification.
// Sent as multipart/form-data — the browser sets the Content-Type boundary.
export async function identifyStar(file: File) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE_URL}/api/najm/identify`, {
    method: 'POST',
    body: formData,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || `HTTP ${response.status}`);
  }
  return payload as { success: boolean; analysis: StarAnalysis };
}
