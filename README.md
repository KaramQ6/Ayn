# ForestGuard AI

## Community-Satellite Fusion System for Real-Time Forest Protection (Jordan)

[![Status](https://img.shields.io/badge/Status-Operational-green.svg)](https://forestguard-ai.netlify.app)
[![SDG](https://img.shields.io/badge/SDG-9%2C%2013%2C%2015-blue.svg)](https://sdgs.un.org/goals)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> *"Eyes in the Sky, Voices on the Ground"*

ForestGuard AI is a multi-layered disaster management system designed for Jordan's forest ecosystems. It fuses NASA satellite thermal anomalies with real-time community ground-truth reports to generate high-confidence fire alerts minutes before traditional systems can respond.

**Competition:** AI for Good Global Competition | IEEE YESIST12 | Jordan 2026

---

## Table of Contents

- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
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
- [Monitored Forests](#monitored-forests)
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
   +--------------+                 | Analysis         |
          |                         +-----------------+
          |                                  |
          +----------------+-----------------+
                           |
                    +------v-------+
                    | Cross-       |       OpenWeatherMap
                    | Validation   | <---- (FWI Risk Index)
                    | Engine       |
                    +------+-------+       Google Cloud
                           |         <---- Vision AI
                           |
              +------------+------------+
              |                         |
     +--------v--------+     +---------v---------+
     | Tactical         |     | Ranger            |
     | Dashboard        |     | Notifications     |
     | (React + WS)     |     | (Telegram)        |
     +------------------+     +-------------------+
```

**The 4 data sources feed into one weighted scoring algorithm.** When 2+ sources agree that a threat exists near the same coordinates, a cross-validated alert fires with a confidence score. Single-source detections are held at a lower confidence level until corroborated.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Tailwind CSS, Leaflet (maps), Recharts (charts), GSAP (animations) |
| **Backend** | Node.js, Express, better-sqlite3, ws (WebSocket), node-cron, Zod (validation) |
| **AI** | Google Cloud Vision API (fire/smoke/logging detection from photos) |
| **Communication** | Telegram Bot API (node-telegram-bot-api) |
| **Data Sources** | NASA FIRMS API (VIIRS/MODIS), OpenWeatherMap API |
| **Security** | Helmet, express-rate-limit, CORS lockdown |
| **Infrastructure** | Docker (multi-stage build), docker-compose |

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
│       ├── main.jsx          # App entry point
│       ├── App.jsx           # Router + lazy loading with retry
│       ├── Landing.jsx       # GSAP-animated landing page (7 sections)
│       ├── Dashboard.jsx     # Tactical dashboard (map, alerts, stats, WS)
│       ├── AnalyticsPanel.jsx # Modal with 4 Recharts charts
│       ├── ReportForm.jsx    # Community report submission form
│       ├── ErrorBoundary.jsx # Graceful error handling
│       └── index.css         # Tailwind + custom CSS variables
│
└── server/                   # Express backend
    ├── package.json
    ├── forestguard.db        # SQLite database (auto-created)
    └── src/
        ├── index.js          # Server entry: Express + WS + cron + boot
        ├── routes/
        │   └── api.js        # All REST endpoints
        ├── models/
        │   └── database.js   # SQLite schema + migrations
        ├── services/
        │   ├── alertEngine.js  # 4-source cross-validation algorithm
        │   ├── demoEngine.js   # 3-minute live demo scenario
        │   ├── firms.js        # NASA FIRMS data fetcher
        │   ├── weather.js      # OpenWeatherMap + Canadian FWI calculator
        │   └── visionAI.js     # Google Cloud Vision photo analysis
        ├── bot/
        │   └── telegramBot.js  # Telegram bot (5 commands + photo AI)
        ├── middleware/
        │   └── validation.js   # Zod request validation
        ├── utils/
        │   └── geo.js          # Haversine distance formula
        ├── data/
        │   └── seedData.js     # 7-day demo seed data generator
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
git clone https://github.com/Aesll/ForestGuard-AI.git
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

Go to `http://localhost:5173`. The landing page loads first. Click "Enter Command Center" to open the tactical dashboard.

---

## Environment Variables

Copy `.env.example` to `.env` at the project root. All variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Server port |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `DEMO_MODE` | No | `true` | Auto-seed data + run 3-min scenario on startup |
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

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/fires` | Active fire hotspots (last 100) |
| `GET` | `/api/risk` | Latest fire risk score per monitored forest |
| `GET` | `/api/reports` | Community reports (last 50) |
| `POST` | `/api/reports` | Submit a new report (body: `{ latitude, longitude, report_type, description }`) |
| `GET` | `/api/alerts` | Alert history (last 50) |
| `PATCH` | `/api/alerts/:id/resolve` | Mark an alert as resolved |
| `GET` | `/api/stats` | Dashboard summary (fires/24h, reports/24h, active alerts, avg risk) |
| `GET` | `/api/stats/history?days=7` | Historical trends for charts (fire trend, alert trend, risk distribution, reports by type) |
| `GET` | `/api/forests` | List of 8 monitored Jordanian forests with coordinates |
| `GET` | `/api/leaderboard` | Top 10 community reporters by points |
| `GET` | `/health` | Server health check (`{ status: "ok", demo: true/false }`) |

### Demo-only endpoints (when `DEMO_MODE=true`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/demo/start` | Start the 3-minute demo scenario |
| `GET` | `/api/demo/stop` | Stop the running demo |
| `GET` | `/api/demo/seed` | Re-seed the database with 7 days of data |

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
| `RISK_UPDATE` | Server -> Client | Fire risk scores updated for one or more forests |
| `DEMO_STARTED` | Server -> Client | Demo scenario has begun |
| `DEMO_EVENT` | Server -> Client | Demo progress event (`{ event, progress }`) |
| `DEMO_COMPLETE` | Server -> Client | Demo scenario finished |

The dashboard reconnects automatically with exponential backoff (2s, 4s, 8s... up to 30s, max 10 retries).

---

## Database Schema

SQLite with WAL mode. 5 tables:

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
| created_at | TEXT | Timestamp |

### `reports`
Community ground-truth reports (from Telegram or web dashboard).

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| telegram_user_id | TEXT | Telegram user ID (if from bot) |
| username | TEXT | Reporter username |
| latitude | REAL | Report location |
| longitude | REAL | Report location |
| photo_url | TEXT | Telegram photo file_id |
| report_type | TEXT | fire, smoke, logging, pollution, wildlife, other |
| description | TEXT | Free-text description |
| status | TEXT | pending, awaiting_location, verified, rejected |
| ai_classification | TEXT | Vision AI result (fire/smoke/logging/none) |
| ai_confidence | REAL | Vision AI confidence (0-100) |
| points_awarded | INTEGER | Gamification points (default: 0) |
| created_at | TEXT | Timestamp |

### `alerts`
Cross-validated alerts generated by the engine.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| level | TEXT | MEDIUM, HIGH, or CRITICAL |
| type | TEXT | cross_validated, fire, fire_risk |
| latitude | REAL | Alert center |
| longitude | REAL | Alert center |
| message | TEXT | Human-readable message (Arabic) |
| sources | TEXT | Comma-separated: FIRMS,COMMUNITY,WEATHER_RISK,AI_VISION |
| confidence | REAL | Weighted confidence score (0-99) |
| resolved | INTEGER | 0 = active, 1 = resolved |
| resolved_at | TEXT | Resolution timestamp |
| created_at | TEXT | Timestamp |

### `fire_risk`
Per-forest weather-based fire risk scores.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| region | TEXT | Forest name |
| latitude | REAL | Forest coordinates |
| longitude | REAL | Forest coordinates |
| temperature | REAL | Temperature in Celsius |
| humidity | REAL | Relative humidity % |
| wind_speed | REAL | Wind speed in km/h |
| rain_1h | REAL | Rain in last hour (mm) |
| risk_score | INTEGER | FWI normalized to 0-100 |
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
5. HIGH and CRITICAL alerts automatically notify registered rangers via Telegram.

---

## Canadian FWI Implementation

Located in `server/src/services/weather.js`. A simplified real-time implementation of the Van Wagner (1987) Canadian Fire Weather Index System.

### Components computed

| Component | Full Name | What it measures |
|-----------|-----------|-----------------|
| FFMC | Fine Fuel Moisture Code | Surface litter drying (fast response) |
| DMC | Duff Moisture Code | Moderate organic layer moisture |
| BUI | Build Up Index | Total fuel available for combustion |
| ISI | Initial Spread Index | Fire spread potential (wind + FFMC) |
| FWI | Fire Weather Index | Overall fire intensity rating |

### Jordan-tuned risk labels

The raw FWI (0-~120) is normalized to 0-100 and classified:

| Score | Label | Meaning |
|-------|-------|---------|
| 0-24 | LOW | Normal conditions |
| 25-44 | MODERATE | Elevated dryness |
| 45-64 | HIGH | Active fire risk |
| 65-84 | VERY_HIGH | Significant danger |
| 85-100 | EXTREME | Emergency conditions |

Cron schedule: risk is recalculated **every hour** for all 8 forests.

---

## Telegram Bot

Bot handle: `@ForestGuardJordanBot`

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
5. Creates the report and triggers cross-validation

### Ranger notifications

When a HIGH or CRITICAL cross-validated alert fires, all registered rangers receive an instant Telegram push with alert details + coordinates.

### Points system

Each report with a valid location awards **10 points**. The leaderboard on the dashboard shows the top 10 contributors.

---

## Demo Mode

Set `DEMO_MODE=true` in `.env` (default).

On server start, the system:
1. Seeds the database with **7 days of realistic historical data** (fires, reports, alerts, risk scores)
2. After a 3-second delay, starts a **3-minute live scenario**

### Scenario: Ajloun Forest Fire Escalation

| Time | Event |
|------|-------|
| T+0s | Weather anomaly: 42.5C, humidity 14% |
| T+15s | FIRMS satellite: thermal anomaly near Ajloun |
| T+30s | Second satellite confirmation (MODIS) |
| T+45s | Ground report: Ranger Ahmad confirms fire + AI Vision 91% |
| T+60s | **HIGH alert** triggered (3 sources, 78% confidence) |
| T+80s | Second ground report: Sara reports heavy smoke |
| T+100s | Weather escalation: 44.1C, wind 42 km/h |
| T+120s | Third FIRMS detection: fire expanded 500m |
| T+140s | **CRITICAL alert** (all 4 sources, 96% confidence) |
| T+160s | Adjacent Dibeen Forest risk rising |
| T+180s | Demo complete |

The dashboard updates in real-time via WebSocket as each event fires. This is designed for live demos to judges.

### Manual demo control

```bash
# Start demo manually
curl http://localhost:3001/api/demo/start

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

8 Jordanian forests and reserves with defined monitoring radii:

| Forest | Arabic | Lat | Lng | Radius (km) |
|--------|--------|-----|-----|-------------|
| Ajloun Forest | غابة عجلون | 32.3333 | 35.7500 | 15 |
| Dibeen Forest | غابة دبين | 32.2833 | 35.8167 | 10 |
| Dana Reserve | محمية دانا | 30.6500 | 35.6167 | 20 |
| Al-Zai Forest | غابة الزي | 32.1000 | 35.8000 | 5 |
| Barqash Forest | غابة برقش | 32.4667 | 35.7333 | 8 |
| Ishtafina Forest | غابة اشتفينا | 32.3500 | 35.7167 | 6 |
| Azraq Reserve | محمية الأزرق | 31.8333 | 36.8167 | 10 |
| Mujib Reserve | محمية الموجب | 31.4667 | 35.6333 | 15 |

---

## Cron Jobs

| Schedule | Job | Description |
|----------|-----|-------------|
| Every 3 hours | `fetchFIRMSData` | Pull latest NASA FIRMS VIIRS/MODIS hotspots for Jordan |
| Every 1 hour | `updateFireRisk` | Recalculate FWI risk scores for all 8 forests |

Both jobs are skipped in demo mode (simulated data is used instead).

---

## SDG Alignment

ForestGuard AI aligns with three UN Sustainable Development Goals:

1. **SDG 9: Industry, Innovation & Infrastructure** - Building resilient monitoring infrastructure using satellite-AI fusion.
2. **SDG 13: Climate Action** - Early detection and response to climate-driven wildfires.
3. **SDG 15: Life on Land** - Protecting Jordan's terrestrial ecosystems, forests, and biodiversity.

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

---

Developed for the AI for Good Global Competition | IEEE YESIST12 | Jordan 2026
