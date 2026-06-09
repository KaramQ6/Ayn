# Ayn - عين

## Pan-Arab Modular Earth Observation & Disaster Management Platform

[![Status](https://img.shields.io/badge/Status-Operational-green.svg)](#)
[![Coverage](https://img.shields.io/badge/Coverage-21%20Countries-blue.svg)](#monitored-forests)
[![Forests](https://img.shields.io/badge/Forests-60%20Monitored-green.svg)](#monitored-forests)
[![Languages](https://img.shields.io/badge/Languages-EN%20%7C%20AR%20%7C%20FR-orange.svg)](#internationalization)
[![SDG](https://img.shields.io/badge/SDG-2%2C%206%2C%209%2C%2013%2C%2015-blue.svg)](https://sdgs.un.org/goals)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> *"Eyes in the Sky, Voices on the Ground"*

Ayn (عين) is a multi-modular Earth Observation platform designed for the Arab world. Born from the Astro Code 2026 Hackathon, it integrates diverse satellite data pipelines (NASA FIRMS, GPM, MODIS, Sentinel-2, SAR) with real-time community ground-truth reports to generate high-confidence early warnings for environmental disasters.

Currently operating its first fully-fledged module (**Fayy - فيّ**), with 7 additional modules in active prototyping. Covers **60 forests** across **21 MENA countries** with trilingual support (English, Arabic, French).

---

## Table of Contents

- [The Astro Code Vision (Modular Platform)](#the-astro-code-vision-modular-platform)
- [How It Works (Core Architecture)](#how-it-works)
- [Tech Stack](#tech-stack)
- [Internationalization](#internationalization)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [WebSocket Events](#websocket-events)
- [Database Schema](#database-schema)
- [Cross-Validation Engine](#cross-validation-engine)
- [Canadian FWI Implementation](#canadian-fwi-implementation)
- [Telegram Bot](#telegram-bot)
- [Demo Mode](#demo-mode)
- [Docker Deployment](#docker-deployment)
- [Running Tests](#running-tests)
- [Monitored Countries & Forests](#monitored-forests)
- [SDG Alignment](#sdg-alignment)
- [License](#license)

---

## The Astro Code Vision (Modular Platform)

Ayn (عين) is built on a scalable, modular architecture designed to ingest arbitrary satellite feeds. Each module is a self-contained intelligence engine with its own data sources and scoring logic:

| Module | Focus Area | Data Source | Status |
|--------|------------|-------------|--------|
| **🌲 Fayy (فيّ)** | Wildfires & Deforestation | NASA FIRMS (VIIRS/MODIS) + Sentinel-2 | **[Operational — Demo Ready]** |
| **🌊 Najji (نجّي)** | Flash Flood Early Warning | Open-Meteo precipitation + SRTM Wadi data | **[Prototyping]** |
| **🌾 Baydar (بيدر)** | Precision Agriculture | Open-Meteo (soil moisture, ET₀, temperature) | **[Prototyping]** |
| **🌪️ Riyah (رياح)** | Dust Storm & Air Quality | OpenWeatherMap Air Quality API | **[Prototyping]** |
| **⚔️ Niza (نزاع)** | Conflict & Encroachment Intelligence | Wikipedia API (conflict zones) | **[Prototyping]** |
| **☀️ Shu'aa (شعاع)** | Solar Irradiance Monitoring | Open-Meteo (GHI, UV, cloud cover) | **[Prototyping]** |
| **🦁 Jamal (جمال)** | Endangered Wildlife Tracking | GBIF (Global Biodiversity) API | **[Prototyping]** |
| **🌙 Najm (نجم)** | Stargazing Conditions | Open-Meteo (sky quality, cloud cover) | **[Prototyping]** |
| **💧 Miyya (ميّة)** | Underground Water Leaks | Sentinel-1 (SAR) | *[Vision / Planned]* |

---

## How It Works

```
   NASA FIRMS (VIIRS/MODIS)         Community Telegram Bot
          |                                  |
          v                                  v
   +------+------+                  +--------+--------+
   | Satellite    |                 | Ground Reports   |
   | Hotspots     |                 | + AI Photo       |
   | (6 MENA      |                 | Analysis         |
   | query regions)|                +-----------------+
   +--------------+                          |
          |                                  |
          +----------------+-----------------+
                           |
                    +------v-------+
                    | Cross-       |       OpenWeatherMap
                    | Validation   | <---- (FWI Risk Index
                    | Engine       |        + Climate Zone
                    +------+-------+        Adjustments)
                           |
                           |         <---- Google Cloud Vision AI
                           |         <---- Gemini Flash (fire cause)
                           |         <---- Sentinel-2 (SWIR imagery)
              +------------+------------+
              |                         |
     +--------v--------+     +---------v---------+
     | Tactical         |     | Ranger            |
     | Dashboard        |     | Notifications     |
     | (React + WS)     |     | (Telegram)        |
     | 🌐 EN | AR | FR  |     +-------------------+
     +------------------+
```

**The 4+ data sources feed into one weighted scoring algorithm.** When 2+ sources agree that a threat exists near the same coordinates, a cross-validated alert fires with a confidence score. Single-source detections are held at a lower confidence level until corroborated.

### MENA Coverage

The system queries **6 merged bounding boxes** covering the entire MENA region, then assigns each hotspot to the nearest of 60 monitored forests across 21 countries. Climate-zone adjustments tune FWI calculations for ~40 distinct forest types (Mediterranean, arid, tropical, montane, etc.).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Tailwind CSS, Leaflet (maps), Recharts (charts), GSAP (animations), react-i18next (i18n) |
| **Backend** | Node.js, Express, better-sqlite3, ws (WebSocket), node-cron, Zod (validation) |
| **Auth** | JWT (jsonwebtoken) — access tokens with configurable TTL |
| **AI — Vision** | Google Cloud Vision API (fire/smoke/logging detection from photos) |
| **AI — Analysis** | Google Gemini Flash (fire cause classification from satellite context) |
| **Satellite Imagery** | Sentinel-2 via SentinelHub Process API (10m SWIR); fallback to NASA GIBS MODIS (250m, no key needed) |
| **Storage** | Cloudinary (avatar uploads, optional); local `/uploads` fallback |
| **Communication** | Telegram Bot API (node-telegram-bot-api) |
| **Data Sources** | NASA FIRMS (VIIRS/MODIS), OpenWeatherMap, Open-Meteo (free), GBIF, Wikipedia API |
| **Community Data** | Supabase (optional — for cross-platform account deletion) |
| **Security** | Helmet, express-rate-limit, CORS lockdown |
| **Infrastructure** | Docker (multi-stage build), docker-compose |

---

## Internationalization

Ayn supports **3 languages** with full RTL (right-to-left) support:

| Language | Code | Direction | Font |
|----------|------|-----------|------|
| Arabic (MSA) | `ar` | RTL | Noto Kufi Arabic |
| English | `en` | LTR | System sans-serif |
| French | `fr` | LTR | System sans-serif |

- **Default**: Arabic on first visit
- **Persistence**: Language choice saved to `localStorage`
- **RTL support**: CSS logical properties (`start`/`end`/`ms-`/`me-`), Leaflet map fixes, Noto Kufi Arabic web font
- **Coverage**: All client components fully translated (~150+ keys per language)
- Language switcher in the dashboard header (AR | EN | FR)

---

## Project Structure

```
Ayn/
├── .env.example              # Environment variable template
├── docker-compose.yml        # One-command deployment
├── supabase-migration.sql    # Supabase schema migration
├── README.md
│
├── client/                   # React frontend (Vite)
│   ├── package.json
│   ├── vite.config.ts        # Dev proxy → localhost:3001
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx          # App entry + i18n init
│       ├── App.tsx           # Router + lazy loading + RTL direction
│       ├── types.ts          # Shared TypeScript types
│       ├── index.css         # Tailwind + CSS variables + RTL overrides
│       ├── i18n.ts           # i18next config (Arabic default, EN/FR)
│       ├── components/
│       │   ├── Landing.tsx         # GSAP-animated landing page (7 sections)
│       │   ├── Dashboard.tsx       # Main tactical dashboard (map, alerts, stats, WS)
│       │   ├── Analytics.tsx       # Recharts analytics panel (4 chart types)
│       │   ├── MapView.tsx         # Leaflet map with fire hotspots overlay
│       │   ├── ReportForm.tsx      # Community report submission form
│       │   ├── MissionBriefing.tsx # Mission control briefing panel
│       │   ├── ConflictPanel.tsx   # Niza conflict & encroachment panel
│       │   ├── SolarPanel.tsx      # Shu'aa solar irradiance panel
│       │   ├── StatusBlock.tsx     # System health status indicators
│       │   └── LanguageToggle.tsx  # AR / EN / FR language switcher
│       ├── hooks/
│       │   ├── useApiResource.ts   # Generic API fetch with caching
│       │   └── useWebSocketFeed.ts # WebSocket auto-reconnect hook
│       └── lib/
│           └── api.ts              # Typed API client functions
│
└── server/                   # Express backend
    ├── package.json
    └── src/
        ├── index.js          # Server entry: Express + WS + cron + boot
        ├── routes/
        │   ├── api.js        # REST endpoints (all accept ?country= filter)
        │   └── auth.js       # Auth endpoints (register, login, profile, delete)
        ├── models/
        │   └── database.js   # SQLite schema + migrations
        ├── services/
        │   ├── alertEngine.js       # 4-source cross-validation (Fayy)
        │   ├── demoEngine.js        # 5 demo scenarios across MENA
        │   ├── firms.js             # NASA FIRMS (6 MENA query regions)
        │   ├── weather.js           # OpenWeatherMap + Canadian FWI
        │   ├── visionAI.js          # Google Cloud Vision photo analysis
        │   ├── fireCauseAnalysis.js # Gemini Flash fire cause classification
        │   ├── satelliteImagery.js  # Sentinel-2 / NASA GIBS SWIR imagery
        │   ├── gamification.js      # Points, ranks, leaderboard logic
        │   ├── storage.js           # Cloudinary / local file upload handler
        │   ├── supabaseAdmin.js     # Supabase community data management
        │   ├── najjiEngine.js       # Flash flood scoring (Open-Meteo + Wadis)
        │   ├── baydarEngine.js      # Crop stress index (soil moisture / ET₀)
        │   ├── riyahEngine.js       # Dust & air quality scoring (OWM AQI)
        │   ├── nizaEngine.js        # Conflict intelligence (Wikipedia API)
        │   ├── solarEngine.js       # Solar irradiance scoring (Open-Meteo)
        │   ├── jamalEngine.js       # Endangered wildlife (GBIF API)
        │   └── najmEngine.js        # Stargazing conditions (Open-Meteo)
        ├── bot/
        │   └── telegramBot.js  # Telegram bot (MENA coverage, photo reports)
        ├── middleware/
        │   ├── auth.js         # JWT authentication middleware
        │   ├── upload.js       # Multer file upload middleware
        │   └── validation.js   # Zod validation (MENA-wide coordinate bounds)
        ├── utils/
        │   ├── auth.js         # JWT sign/verify helpers
        │   └── geo.js          # Haversine distance formula
        └── data/
            ├── forests.js      # 60 forests × 21 countries
            ├── wadis.js        # Jordan wadi network (flash flood risk data)
            ├── solarSites.js   # Jordan solar monitoring sites
            └── seedData.js     # Multi-country demo seed data
```

---

## Getting Started

### Prerequisites

- **Node.js v18+** (v20 recommended)
- **npm** (comes with Node.js)
- API keys (optional — demo mode works without any keys):
  - [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/api/area/) — satellite fire data
  - [OpenWeatherMap](https://openweathermap.org/api) — weather + air quality
  - [Google Cloud Vision](https://cloud.google.com/vision) — photo analysis (optional)
  - [Google Gemini](https://aistudio.google.com/app/apikey) — fire cause analysis, free tier (optional)
  - [SentinelHub](https://dataspace.copernicus.eu) — Sentinel-2 imagery, free tier (optional)
  - [Telegram BotFather](https://t.me/BotFather) — community bot (optional)

### 1. Clone and configure

```bash
git clone https://github.com/KaramQ6/Ayn.git
cd Ayn
cp .env.example .env
# Edit .env with your API keys (or leave defaults for demo mode)
```

### 2. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 3. Start the backend (Terminal 1)

```bash
cd server
npm start
```

Server starts on `http://localhost:3001`.

### 4. Start the frontend (Terminal 2)

```bash
cd client
npm run dev
```

Client starts on `http://localhost:5173`. Vite automatically proxies `/api` and `/ws` requests to the backend.

### 5. Open in browser

Go to `http://localhost:5173`. The landing page loads first — click "Access Dashboard" to open the tactical dashboard. Use the language switcher (AR | EN | FR) and country filter to explore different regions.

---

## Environment Variables

Copy `.env.example` to `.env` at the project root:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Server port |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `DEMO_MODE` | No | `true` | Auto-seed data + run demo scenario on startup |
| `JWT_SECRET` | **Yes (prod)** | - | Secret for signing JWT access tokens |
| `JWT_EXPIRES_IN` | No | `7d` | Access token TTL |
| `TELEGRAM_BOT_TOKEN` | No | - | From [@BotFather](https://t.me/BotFather) |
| `NASA_FIRMS_API_KEY` | No | - | [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/api/area/) |
| `OPENWEATHER_API_KEY` | No | - | [OpenWeatherMap](https://openweathermap.org/api) — weather + Riyah air quality |
| `GOOGLE_APPLICATION_CREDENTIALS` | No | - | Path to GCP service account JSON |
| `GEMINI_API_KEY` | No | - | [Google AI Studio](https://aistudio.google.com/app/apikey) — fire cause analysis (1500 req/day free) |
| `SENTINELHUB_CLIENT_ID` | No | - | [Copernicus Data Space](https://dataspace.copernicus.eu) — Sentinel-2 SWIR (30,000 PU/month free) |
| `SENTINELHUB_CLIENT_SECRET` | No | - | Same as above |
| `CLOUDINARY_CLOUD_NAME` | No | - | Avatar uploads — falls back to local `/uploads` if empty |
| `CLOUDINARY_API_KEY` | No | - | Cloudinary |
| `CLOUDINARY_API_SECRET` | No | - | Cloudinary |
| `SUPABASE_URL` | No | - | Supabase project URL (community data deletion) |
| `SUPABASE_SERVICE_ROLE_KEY` | No | - | Supabase service role key |
| `CORS_ORIGIN` | No | - | Comma-separated allowed origins (production) |

**Without any API keys**, the system runs in demo mode with simulated data. Everything still works.

---

## API Reference

Base URL: `http://localhost:3001/api`

All GET endpoints accept an optional `?country=XX` query parameter (ISO 3166-1 alpha-2) to filter results by country.

### Core endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/fires` | Active fire hotspots (last 100) |
| `GET` | `/api/risk` | Latest fire risk score per monitored forest |
| `GET` | `/api/reports` | Community reports (last 50) |
| `POST` | `/api/reports` | Submit a report (`{ latitude, longitude, report_type, description }`) |
| `GET` | `/api/alerts` | Alert history (last 50) |
| `PATCH` | `/api/alerts/:id/resolve` | Mark an alert as resolved |
| `GET` | `/api/stats` | Dashboard summary (fires/24h, reports/24h, active alerts, avg risk) |
| `GET` | `/api/stats/history?days=7` | Historical trends for charts |
| `GET` | `/api/countries` | All countries with forest data |
| `GET` | `/api/forests` | All 60 monitored forests with coordinates |
| `GET` | `/api/leaderboard` | Top 10 community reporters by points |
| `GET` | `/health` | Server health check |

### Auth endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user account |
| `POST` | `/api/auth/login` | Login and receive JWT |
| `GET` | `/api/auth/profile` | Get current user profile (requires JWT) |
| `DELETE` | `/api/auth/account` | Delete account and all community data |

### Demo endpoints (when `DEMO_MODE=true`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/demo/scenarios` | List available demo scenarios |
| `GET` | `/api/demo/start?scenario=ajloun` | Start a specific demo scenario |
| `GET` | `/api/demo/stop` | Stop the running demo |
| `GET` | `/api/demo/seed` | Re-seed the database |

### Rate limits

- **Global:** 200 requests / 15 minutes per IP
- **Report submission:** 20 requests / 15 minutes per IP

---

## WebSocket Events

Connect to `ws://localhost:3001/ws` (or via Vite proxy at `ws://localhost:5173/ws`).

All messages are JSON: `{ type: string, data: object }`

| Event Type | Direction | Description |
|-----------|-----------|-------------|
| `FIRE_UPDATE` | Server → Client | New fire hotspots detected |
| `NEW_REPORT` | Server → Client | New community report submitted |
| `NEW_ALERT` | Server → Client | New cross-validated alert created |
| `ALERT_RESOLVED` | Server → Client | An alert was resolved |
| `RISK_UPDATE` | Server → Client | Fire risk scores updated |
| `DEMO_STARTED` | Server → Client | Demo scenario has begun |
| `DEMO_EVENT` | Server → Client | Demo progress event (`{ event, progress }`) |
| `DEMO_COMPLETE` | Server → Client | Demo scenario finished |

The dashboard reconnects automatically with exponential backoff (2s, 4s, 8s... up to 30s, max 10 retries).

---

## Database Schema

SQLite with WAL mode. 5 tables. All tables include a `country TEXT` column for multi-country filtering.

### `fire_hotspots`
Satellite-detected thermal anomalies.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| latitude | REAL | Hotspot latitude |
| longitude | REAL | Hotspot longitude |
| brightness | REAL | Thermal brightness value |
| confidence | TEXT | Detection confidence (nominal/low/high) |
| acq_date | TEXT | Acquisition date |
| acq_time | TEXT | Acquisition time |
| satellite | TEXT | Satellite name (VIIRS/MODIS/DEMO) |
| source | TEXT | Data source (default: FIRMS) |
| country | TEXT | ISO country code |
| created_at | TEXT | Timestamp |

### `reports`
Community ground-truth reports.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| telegram_user_id | TEXT | Telegram user ID (if from bot) |
| username | TEXT | Reporter username |
| latitude | REAL | Report location |
| longitude | REAL | Report location |
| photo_url | TEXT | Telegram photo file_id |
| report_type | TEXT | fire, smoke, logging, desertification, pollution, wildlife, other |
| description | TEXT | Free-text description |
| status | TEXT | pending, awaiting_location, verified, rejected |
| ai_classification | TEXT | Vision AI result |
| ai_confidence | REAL | Vision AI confidence (0–100) |
| points_awarded | INTEGER | Gamification points |
| country | TEXT | ISO country code |
| created_at | TEXT | Timestamp |

### `alerts`
Cross-validated alerts with bilingual labels.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| level | TEXT | MEDIUM, HIGH, or CRITICAL |
| type | TEXT | cross_validated, fire, fire_risk |
| latitude | REAL | Alert center |
| longitude | REAL | Alert center |
| message | TEXT | Bilingual alert message |
| sources | TEXT | Comma-separated: FIRMS, COMMUNITY, WEATHER_RISK, AI_VISION |
| confidence | REAL | Weighted confidence score (0–99) |
| resolved | INTEGER | 0 = active, 1 = resolved |
| resolved_at | TEXT | Resolution timestamp |
| country | TEXT | ISO country code |
| created_at | TEXT | Timestamp |

### `fire_risk`
Per-forest weather-based fire risk scores.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| region | TEXT | Bilingual forest name |
| latitude | REAL | Forest coordinates |
| longitude | REAL | Forest coordinates |
| temperature | REAL | Temperature in Celsius |
| humidity | REAL | Relative humidity % |
| wind_speed | REAL | Wind speed in km/h |
| rain_1h | REAL | Rain in last hour (mm) |
| risk_score | INTEGER | FWI normalized to 0–100 |
| country | TEXT | ISO country code |
| updated_at | TEXT | Timestamp |

### `rangers`
Registered forest rangers who receive Telegram notifications.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| telegram_chat_id | TEXT UNIQUE | Telegram chat ID |
| name | TEXT | Ranger name |
| region | TEXT | Assigned region |
| active | INTEGER | 1 = active, 0 = inactive |
| created_at | TEXT | Timestamp |

---

## Cross-Validation Engine

The core intelligence of the Fayy module. Located in `server/src/services/alertEngine.js`.

### Source weights

| Source | Weight | What it provides |
|--------|--------|-----------------|
| NASA FIRMS | 35% | Satellite thermal hotspots within 5km radius |
| Weather Risk | 25% | FWI score for the nearest monitored forest |
| Community | 20% | Ground-truth reports within 5km radius |
| AI Vision | 20% | Fire/smoke detection confidence from photos |

### How confidence is calculated

1. For each data source, a 0–100 evidence score is computed (proximity-weighted for spatial sources).
2. A **weighted average** across available sources is calculated.
3. A **source-count multiplier** adjusts final confidence:
   - 4 sources → up to 99% → CRITICAL
   - 3 sources → up to 95% → CRITICAL or HIGH
   - 2 sources → up to 80% → HIGH or MEDIUM
   - 1 source → capped at 50% → MEDIUM
4. **Alert creation threshold:** 2+ sources, OR 1 source with confidence ≥ 40%.
5. HIGH and CRITICAL alerts notify registered rangers via Telegram.

---

## Canadian FWI Implementation

Located in `server/src/services/weather.js`. A simplified real-time implementation of the Van Wagner (1987) Canadian Fire Weather Index System, extended with **climate-zone adjustments** for ~40 MENA forest types.

### Components computed

| Component | Full Name | What it measures |
|-----------|-----------|-----------------|
| FFMC | Fine Fuel Moisture Code | Surface litter drying (fast response) |
| DMC | Duff Moisture Code | Moderate organic layer moisture |
| BUI | Build Up Index | Total fuel available for combustion |
| ISI | Initial Spread Index | Fire spread potential (wind + FFMC) |
| FWI | Fire Weather Index | Overall fire intensity rating |

### Climate-zone adjustments

The raw FWI is tuned per forest type using `CLIMATE_ADJUSTMENTS` multipliers. Examples:

| Forest Type | Adjustment | Rationale |
|-------------|------------|-----------|
| Mediterranean Coniferous | +15% | Resinous fuels, summer drought |
| Arid Scrubland | +25% | Extremely dry conditions |
| Tropical Dry | +10% | Seasonal dryness |
| Cloud Forest | −15% | High moisture baseline |
| Mangrove | −30% | Wet environment |

### Risk labels

| Score | Label | Meaning |
|-------|-------|---------|
| 0–24 | LOW | Normal conditions |
| 25–44 | MODERATE | Elevated dryness |
| 45–64 | HIGH | Active fire risk |
| 65–84 | VERY_HIGH | Significant danger |
| 85–100 | EXTREME | Emergency conditions |

Cron schedule: risk is recalculated **every hour** for all 60 forests (rate-limited to respect OpenWeatherMap API limits).

---

## Telegram Bot

### Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message with instructions |
| `/report` | Start a threat report (interactive: pick type → send location) |
| `/status` | Current fire risk for all monitored forests |
| `/alerts` | Latest 5 active alerts |
| `/register` | Register as a forest ranger (receive push notifications) |

### Photo reports

Users can send a photo directly. The bot:
1. Saves the photo and sends it to Google Cloud Vision for fire/smoke/logging analysis
2. Returns AI classification + confidence to the user
3. Waits for the user to share their GPS location
4. Auto-detects which MENA country the location falls in
5. Creates the report and triggers cross-validation

### Ranger notifications

When a HIGH or CRITICAL cross-validated alert fires, all registered rangers receive an instant Telegram push with alert details + coordinates.

### Points system

| Action | Points |
|--------|--------|
| Submit a report | 10 |
| Report with photo | 20 |
| First report of the day | 25 |
| Report verified | 50 |
| Report led to response | 100 |

Ranks: Observer → Field Reporter → Senior Guard → Team Leader → Elite Guardian

---

## Demo Mode

Set `DEMO_MODE=true` in `.env` (default).

### 5 Demo Scenarios

| Scenario | Country | Forest | Key Events |
|----------|---------|--------|------------|
| `ajloun` (default) | Jordan | Ajloun Forest | Escalating fire: weather anomaly → satellite → ground reports → CRITICAL |
| `lebanon_cedar` | Lebanon | Chouf Cedar Reserve | Cedar forest fire threatening UNESCO site |
| `iraq_kurdistan` | Iraq | Barzan Mountain Forest | Mountain forest fire in Kurdistan region |
| `morocco_atlas` | Morocco | Ifrane Atlas Cedar | Atlas Mountains cedar fire scenario |
| `yemen_socotra` | Yemen | Socotra Dragon Blood | Dragon Blood tree ecosystem under threat |

Each scenario runs for ~3 minutes with real-time WebSocket events.

### Seed data

On startup, the system seeds **7 days of realistic historical data**:
- 33 fire hotspots across 7 countries
- 25 community reports
- 15 cross-validated alerts
- 488 fire risk records (60 forests × 8 days)
- 6 rangers

### Manual demo control

```bash
curl http://localhost:3001/api/demo/scenarios
curl http://localhost:3001/api/demo/start?scenario=lebanon_cedar
curl http://localhost:3001/api/demo/stop
curl http://localhost:3001/api/demo/seed
```

---

## Docker Deployment

```bash
docker compose up --build
```

This builds a multi-stage image (node:20-alpine), copies the pre-built client into the server's `public/` directory, and serves everything from port 3001.

The container has a built-in health check hitting `/health` every 30 seconds. SQLite data is stored in a Docker volume so it survives container restarts.

---

## Running Tests

```bash
cd server
node --test src/tests/
```

| File | Tests | What it covers |
|------|-------|---------------|
| `geo.test.js` | 3 | Haversine distance formula accuracy |
| `api.test.js` | 9 | All REST endpoints (GET/POST/PATCH), validation, 404s |
| `alertEngine.test.js` | 7 | Cross-validation logic, source weighting, confidence scoring |

Total: **19 tests**

---

## Monitored Forests

60 forests across 21 MENA countries. Each forest has defined coordinates, monitoring radius, area, forest type, elevation, primary threats, and UNESCO status.

| Country | Code | Forests | Notable Sites |
|---------|------|---------|--------------|
| Jordan | JO | 8 | Ajloun, Dibeen, Dana Reserve |
| Lebanon | LB | 5 | Chouf Cedar Reserve (UNESCO) |
| Palestine | PS | 3 | Wadi Qelt |
| Syria | SY | 3 | Al-Fronloq (Latakia) |
| Iraq | IQ | 4 | Barzan Mountain Forest |
| Morocco | MA | 6 | Ifrane Atlas Cedar, Toubkal |
| Algeria | DZ | 5 | Djurdjura, Chrea |
| Tunisia | TN | 3 | Ain Draham Cork Oak |
| Egypt | EG | 3 | Ras Mohammed Mangrove |
| Libya | LY | 2 | Al-Jabal Al-Akhdar |
| Saudi Arabia | SA | 4 | Al-Baha Juniper, Asir |
| UAE | AE | 2 | Al Ain Oasis |
| Oman | OM | 2 | Jebel Akhdar |
| Yemen | YE | 2 | Socotra Dragon Blood |
| Kuwait | KW | 1 | Sabah Al-Ahmad Reserve |
| Bahrain | BH | 1 | Al Areen Wildlife Park |
| Sudan | SD | 3 | Dinder National Park |
| Mauritania | MR | 1 | Diawling Wetland |
| Somalia | SO | 2 | Daallo Mountain Forest |
| Djibouti | DJ | 1 | Day Forest (Juniper) |

### FIRMS Query Regions

To efficiently query NASA FIRMS, the 21 countries are merged into **6 bounding box regions**:

1. **Levant + Iraq** (JO, LB, PS, SY, IQ)
2. **Maghreb** (MA, DZ, TN, LY)
3. **Nile** (EG, SD)
4. **Arabian Peninsula** (SA, AE, OM, YE, KW, BH)
5. **Horn of Africa** (SO, DJ)
6. **West Africa** (MR)

---

## Cron Jobs

| Schedule | Job | Description |
|----------|-----|-------------|
| Every 3 hours | `fetchFIRMSData` | Pull NASA FIRMS VIIRS/MODIS hotspots for 6 MENA regions |
| Every 1 hour | `updateFireRisk` | Recalculate FWI risk scores for all 60 forests |

Both jobs are skipped in demo mode (simulated data is used instead).

---

## SDG Alignment

| SDG | Goal | Module |
|-----|------|--------|
| **SDG 2** | Zero Hunger | Baydar (بيدر) — precision agriculture & crop stress monitoring |
| **SDG 6** | Clean Water and Sanitation | Miyya (ميّة) — underground water leak detection |
| **SDG 9** | Industry, Innovation & Infrastructure | Satellite-AI fusion infrastructure across 21 MENA countries |
| **SDG 13** | Climate Action | Early detection of climate-driven disasters (Fayy, Najji, Riyah) |
| **SDG 15** | Life on Land | Forest protection (Fayy) + wildlife tracking (Jamal) |

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
