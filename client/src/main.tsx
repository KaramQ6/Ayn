import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './i18n';
import './index.css';
import App from './App.tsx';

document.documentElement.dataset.build = 'asset-refresh-2026-06-10';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
