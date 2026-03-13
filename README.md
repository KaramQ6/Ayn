# ForestGuard AI

## Pan-Arab & Middle East Community-Satellite Fusion System for Real-Time Forest Protection

[![Status](https://img.shields.io/badge/Status-Operational-green.svg)](https://forestguard-ai.netlify.app)
[![Coverage](https://img.shields.io/badge/Coverage-21%20Countries-blue.svg)](#monitored-forests)
[![Forests](https://img.shields.io/badge/Forests-60%20Monitored-green.svg)](#monitored-forests)
[![Languages](https://img.shields.io/badge/Languages-EN%20%7C%20AR%20%7C%20FR-orange.svg)](#internationalization)
[![SDG](https://img.shields.io/badge/SDG-9%2C%2013%2C%2015-blue.svg)](https://sdgs.un.org/goals)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> *"Eyes in the Sky, Voices on the Ground"*

ForestGuard AI is a multi-layered disaster management system designed for forest ecosystems across the Arab world and Middle East. It fuses NASA satellite thermal anomalies with real-time community ground-truth reports to generate high-confidence fire alerts minutes before traditional systems can respond.

Covering **60 forests** across **21 MENA countries** with trilingual support (English, Arabic, French).

---

## Table of Contents

- [How It Works](#how-it-works)
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
                           |         <---- Google Cloud
                           |               Vision AI
              +------------+------------+
              |                         |
     +--------v--------+     +---------v---------+
     | Tactical         |     | Ranger            |
     | Dashboard        |     | Notifications     |
     | (React + WS)     |     | (Telegram)        |
     | 🌐 EN | AR | FR  |     +-------------------+
     +------------------+
```

**The 4 data sources feed into one weighted scoring algorithm.** When 2+ sources agree that a threat exists near the same coordinates, a cross-validated alert fires with a confidence score. Single-source detections are held at a lower confidence level until corroborated.

### MENA Coverage

The system queries **6 merged bounding boxes** covering the entire MENA region, then assigns each hotspot to the nearest of 60 monitored forests across 21 countries. Climate-zone adjustments tune FWI calculations for ~40 distinct forest types (Mediterranean, arid, tropical, montane, etc.).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Tailwind CSS, Leaflet (maps), Recharts (charts), GSAP (animations), react-i18next (i18n) |
| **Backend** | Node.js, Express, better-sqlite3, ws (WebSocket), node-cron, Zod (validation) |
| **AI** | Google Cloud Vision API (fire/smoke/logging detection from photos) |
| **Communication** | Telegram Bot API (node-telegram-bot-api) |
| **Data Sources** | NASA FIRMS API (VIIRS/MODIS), OpenWeatherMap API |
| **Security** | Helmet, express-rate-limit, CORS lockdown |
| **Infrastructure** | Docker (multi-stage build), docker-compose |

---

## Internationalization

ForestGuard AI supports **3 languages** with full RTL (right-to-left) support:

| Language | Code | Direction | Font |
|----------|------|-----------|------|
| English | `en` | LTR | System sans-serif |
| Arabic (MSA) | `ar` | RTL | Noto Kufi Arabic |
| French | `fr` | LTR | System sans-serif |

- **Auto-detection**: Browser language is detected on first visit
- **Persistence**: Language choice saved to `localStorage` (`forestguard-lang`)
- **RTL support**: CSS logical properties (`start`/`end`/`ms-`/`me-`), Leaflet map fixes, Noto Kufi Arabic web font
- **Coverage**: All 5 client components fully translated (~150+ keys per language)
- Language switcher in the dashboard header (EN | AR | FR)

---

## Project Structure

```
ForestGuard-AI/
├── .env.example              # Environment variable template
├── Dockerfile                # Multi-stage production build
├── docker-compose.yml        # One-command deployment
├── LICENSE                   # MIT
│
├── client/                   # React frontend (Vite)
│   ├── package.json
│   ├── vite.config.js        # Dev proxy → localhost:3001
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx          # App entry + i18n init
│       ├── App.jsx           # Router + lazy loading + RTL direction
│       ├── Landing.jsx       # GSAP-animated landing page (7 sections, i18n)
│       ├── Dashboard.jsx     # MENA tactical dashboard (map, alerts, stats, WS, country filter, demo scenarios)
│       ├── AnalyticsPanel.jsx # Modal with 4 Recharts charts (i18n)
│       ├── ReportForm.jsx    # Community report form (MENA-wide validation, i18n)
│       ├── ErrorBoundary.jsx # Graceful error handling
│       ├── index.css         # Tailwind + CSS variables + RTL overrides
│       └── i18n/
│           ├── index.js      # i18next config (browser detection, fallback en)
│           └── locales/
│               ├── en.json   # English (~150+ keys)
│               ├── ar.json   # Arabic MSA (~150+ keys)
│               └── fr.json   # French (~150+ keys)
│
└── server/                   # Express backend
    ├── package.json
    ├── forestguard.db        # SQLite database (auto-created)
    └── src/
        ├── index.js          # Server entry: Express + WS + cron + boot
        ├── routes/
        │   └── api.js        # REST endpoints (all accept ?country= filter)
        ├── models/
        │   └── database.js   # SQLite schema + country column migrations
        ├── services/
        │   ├── alertEngine.js  # 4-source cross-validation (bilingual labels)
        │   ├── demoEngine.js   # 5 demo scenarios across MENA
        │   ├── firms.js        # NASA FIRMS (6 MENA query regions)
        │   ├── weather.js      # OpenWeatherMap + FWI + climate zone adjustments
        │   └── visionAI.js     # Google Cloud Vision photo analysis
        ├── bot/
        │   └── telegramBot.js  # Telegram bot (MENA coverage, auto country detection)
        ├── middleware/
        │   └── validation.js   # Zod validation (MENA-wide coordinate bounds)
        ├── utils/
        │   └── geo.js          # Haversine distance formula
        ├── data/
        │   ├── forests.js      # 60 forests × 21 countries + helper functions
        │   └── seedData.js     # Multi-country demo seed data generator
        └── tests/
            ├── api.test.js       # API route tests
            ├── alertEngine.test.js # Cross-validation tests
            └── geo.test.js       # Haversine utility tests
```

---

## Getting Started

### Prerequisites

- **Node.js v18+** (v20 recommended)
- **npm** (comes with Node.js)
- API keys (optional for demo mode, required for live data):
  - [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/api/area/) - satellite fire data
  - [OpenWeatherMap](https://openweathermap.org/api) - weather data
  - [Google Cloud Vision](https://cloud.google.com/vision) - photo analysis (optional)
  - [Telegram BotFather](https://t.me/BotFather) - community bot (optional)

### 1. Clone and configure

```bash
git clone https://github.com/KaramQ6/ForestGuard.git
cd ForestGuard-AI
cp .env.example .env
# Edit .env with your API keys (or leave defaults for demo mode)
```

### 2. Install dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Start the backend (Terminal 1)

```bash
cd server
npm start
```

Server starts on `http://localhost:3001`. You'll see:

```
  ForestGuard AI Server running!
  API:       http://localhost:3001/api
  Health:    http://localhost:3001/health
  WebSocket: ws://localhost:3001
```

### 4. Start the frontend (Terminal 2)

```bash
cd client
npm run dev
```

Client starts on `http://localhost:5173`. Vite automatically proxies `/api` and `/ws` requests to the backend.

### 5. Open in browser

Go to `http://localhost:5173`. The landing page loads first. Click "Access Dashboard" to open the tactical dashboard. Use the language switcher (EN | AR | FR) and country filter to explore different regions.

---

## Environment Variables

Copy `.env.example` to `.env` at the project root. All variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Server port |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `DEMO_MODE` | No | `true` | Auto-seed data + run demo scenario on startup |
| `TELEGRAM_BOT_TOKEN` | No | - | From [@BotFather](https://t.me/BotFather) |
| `NASA_FIRMS_API_KEY` | No | - | [Get one here](https://firms.modaps.eosdis.nasa.gov/api/area/) |
| `OPENWEATHER_API_KEY` | No | - | [Get one here](https://openweathermap.org/api) |
| `GOOGLE_APPLICATION_CREDENTIALS` | No | - | Path to GCP service account JSON |
| `CORS_ORIGIN` | No | - | Comma-separated allowed origins (production) |
| `DB_PATH` | No | `server/forestguard.db` | SQLite database file path |

**Without API keys**, the system runs in demo mode with simulated data. Everything still works.

---

## API Reference

Base URL: `http://localhost:3001/api`

All GET endpoints accept an optional `?country=XX` query parameter (ISO 3166-1 alpha-2) to filter results by country.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/fires` | Active fire hotspots (last 100) |
| `GET` | `/api/risk` | Latest fire risk score per monitored forest |
| `GET` | `/api/reports` | Community reports (last 50) |
| `POST` | `/api/reports` | Submit a new report (body: `{ latitude, longitude, report_type, description }`) |
| `GET` | `/api/alerts` | Alert history (last 50) |
| `PATCH` | `/api/alerts/:id/resolve` | Mark an alert as resolved |
| `GET` | `/api/stats` | Dashboard summary (fires/24h, reports/24h, active alerts, avg risk) |
| `GET` | `/api/stats/history?days=7` | Historical trends for charts |
| `GET` | `/api/countries` | List of all countries with forest data |
| `GET` | `/api/forests` | List of 60 monitored forests with coordinates |
| `GET` | `/api/leaderboard` | Top 10 community reporters by points |
| `GET` | `/health` | Server health check |

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
| `FIRE_UPDATE` | Server -> Client | New fire hotspots detected (from FIRMS or demo) |
| `NEW_REPORT` | Server -> Client | New community report submitted |
| `NEW_ALERT` | Server -> Client | New cross-validated alert created |
| `ALERT_RESOLVED` | Server -> Client | An alert was resolved |
| `RISK_UPDATE` | Server -> Client | Fire risk scores updated |
| `DEMO_STARTED` | Server -> Client | Demo scenario has begun |
| `DEMO_EVENT` | Server -> Client | Demo progress event (`{ event, progress }`) |
| `DEMO_COMPLETE` | Server -> Client | Demo scenario finished |

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
| country | TEXT | ISO country code (JO, LB, MA, etc.) |
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
| ai_confidence | REAL | Vision AI confidence (0-100) |
| points_awarded | INTEGER | Gamification points |
| country | TEXT | ISO country code |
| created_at | TEXT | Timestamp |

### `alerts`
Cross-validated alerts with bilingual labels (`nameAr / name`).

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| level | TEXT | MEDIUM, HIGH, or CRITICAL |
| type | TEXT | cross_validated, fire, fire_risk |
| latitude | REAL | Alert center |
| longitude | REAL | Alert center |
| message | TEXT | Bilingual alert message |
| sources | TEXT | Comma-separated: FIRMS,COMMUNITY,WEATHER_RISK,AI_VISION |
| confidence | REAL | Weighted confidence score (0-99) |
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
| risk_score | INTEGER | FWI normalized to 0-100 |
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

The core intelligence of the system. Located in `server/src/services/alertEngine.js`.

### Source weights

| Source | Weight | What it provides |
|--------|--------|-----------------|
| NASA FIRMS | 35% | Satellite thermal hotspots within 5km radius |
| Weather Risk | 25% | FWI score for the nearest monitored forest |
| Community | 20% | Ground-truth reports within 5km radius |
| AI Vision | 20% | Fire/smoke detection confidence from photos |

### How confidence is calculated

1. For each data source, a 0-100 evidence score is computed (proximity-weighted for spatial sources).
2. A **weighted average** across available sources is calculated.
3. A **source-count multiplier** adjusts final confidence:
   - 4 sources: up to 99% confidence -> CRITICAL
   - 3 sources: up to 95% confidence -> CRITICAL or HIGH
   - 2 sources: up to 80% confidence -> HIGH or MEDIUM
   - 1 source: capped at 50% -> MEDIUM
4. **Alert creation threshold:** 2+ sources, OR 1 source with confidence >= 40%.
5. HIGH and CRITICAL alerts notify registered rangers via Telegram.
6. Alert messages use bilingual forest labels (`nameAr / name`).

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
| Cloud Forest | -15% | High moisture baseline |
| Mangrove | -30% | Wet environment |

### Risk labels

The adjusted FWI (0-100) is classified:

| Score | Label | Meaning |
|-------|-------|---------|
| 0-24 | LOW | Normal conditions |
| 25-44 | MODERATE | Elevated dryness |
| 45-64 | HIGH | Active fire risk |
| 65-84 | VERY_HIGH | Significant danger |
| 85-100 | EXTREME | Emergency conditions |

Cron schedule: risk is recalculated **every hour** for all 60 forests (rate-limited to respect OpenWeatherMap API limits).

---

## Telegram Bot

### Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message with instructions |
| `/report` | Start a threat report (interactive: pick type -> send location) |
| `/status` | Current fire risk for all monitored forests |
| `/alerts` | Latest 5 active alerts |
| `/register` | Register as a forest ranger (receive push notifications) |

### Photo reports

Users can send a photo directly. The bot:
1. Saves the photo immediately
2. Sends it to Google Cloud Vision for fire/smoke/logging analysis
3. Returns AI classification + confidence to the user
4. Waits for the user to share their GPS location
5. Auto-detects which MENA country the location falls in
6. Creates the report and triggers cross-validation

### Ranger notifications

When a HIGH or CRITICAL cross-validated alert fires, all registered rangers receive an instant Telegram push with alert details + coordinates.

### Points system

Each report with a valid location awards **10 points**. The leaderboard on the dashboard shows the top 10 contributors.

---

## Demo Mode

Set `DEMO_MODE=true` in `.env` (default).

### 5 Demo Scenarios

Select scenarios from the dashboard dropdown or via API:

| Scenario | Country | Forest | Key Events |
|----------|---------|--------|------------|
| `ajloun` (default) | Jordan | Ajloun Forest | Escalating fire: weather anomaly -> satellite -> ground reports -> CRITICAL |
| `lebanon_cedar` | Lebanon | Chouf Cedar Reserve | Cedar forest fire threatening UNESCO site |
| `iraq_kurdistan` | Iraq | Barzan Mountain Forest | Mountain forest fire in Kurdistan region |
| `morocco_atlas` | Morocco | Ifrane Atlas Cedar | Atlas Mountains cedar fire scenario |
| `yemen_socotra` | Yemen | Socotra Dragon Blood | Unique Dragon Blood tree ecosystem under threat |

Each scenario runs for ~3 minutes with real-time WebSocket events.

### Seed data

On startup, the system seeds **7 days of realistic historical data**:
- 33 fire hotspots across 7 countries
- 25 community reports
- 15 cross-validated alerts
- 488 fire risk records (60 forests x 8 days)
- 6 rangers

### Manual demo control

```bash
# List available scenarios
curl http://localhost:3001/api/demo/scenarios

# Start a specific scenario
curl http://localhost:3001/api/demo/start?scenario=lebanon_cedar

# Stop demo
curl http://localhost:3001/api/demo/stop

# Re-seed database
curl http://localhost:3001/api/demo/seed
```

---

## Docker Deployment

### Quick start

```bash
docker compose up --build
```

This builds a multi-stage image (node:20-alpine), copies the pre-built client into the server's `public/` directory, and serves everything from port 3001.

### Health check

The container has a built-in health check hitting `/health` every 30 seconds.

### Persistent data

SQLite database is stored in a Docker volume (`forestguard-data`) so data survives container restarts.

### Production env

Pass environment variables via docker-compose or `.env`:

```bash
DEMO_MODE=false \
NASA_FIRMS_API_KEY=your_key \
OPENWEATHER_API_KEY=your_key \
TELEGRAM_BOT_TOKEN=your_token \
docker compose up --build -d
```

---

## Running Tests

The server uses Node.js built-in test runner (no external framework needed):

```bash
cd server
node --test src/tests/
```

### Test coverage

| File | Tests | What it covers |
|------|-------|---------------|
| `geo.test.js` | 3 | Haversine distance formula accuracy |
| `api.test.js` | 9 | All REST endpoints (GET/POST/PATCH), validation, 404s |
| `alertEngine.test.js` | 7 | Cross-validation logic, source weighting, confidence scoring |

Total: **19 tests**

---

## Monitored Forests

60 forests across 21 MENA countries. Each forest has defined coordinates, monitoring radius, area, forest type, elevation, primary threats, and UNESCO status.

### Countries covered

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
| Every 1 hour | `updateFireRisk` | Recalculate FWI risk scores for all 60 forests (rate-limited) |

Both jobs are skipped in demo mode (simulated data is used instead).

---

## SDG Alignment

ForestGuard AI aligns with three UN Sustainable Development Goals:

1. **SDG 9: Industry, Innovation & Infrastructure** - Building resilient monitoring infrastructure using satellite-AI fusion across 21 MENA countries.
2. **SDG 13: Climate Action** - Early detection and response to climate-driven wildfires with climate-zone-tuned risk assessment.
3. **SDG 15: Life on Land** - Protecting terrestrial ecosystems, forests, and biodiversity across the Arab world and Middle East.

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
