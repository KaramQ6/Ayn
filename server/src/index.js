import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import http from 'http';
import cron from 'node-cron';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import apiRoutes from './routes/api.js';
import { fetchFIRMSData } from './services/firms.js';
import { updateFireRisk } from './services/weather.js';
import { initDatabase } from './models/database.js';
import { initBot } from './bot/telegramBot.js';
import { startDemo, stopDemo, isDemoActive, getScenarios, getActiveScenario } from './services/demoEngine.js';
import { seedDatabase } from './data/seedData.js';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV !== 'production';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://images.unsplash.com", "https://*.basemaps.cartocdn.com"],
      connectSrc: ["'self'", "ws:", "wss:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : (isDev ? ['http://localhost:5173', 'http://localhost:3000'] : []);
app.use(cors({
  origin: isDev ? true : allowedOrigins,
  credentials: true,
}));

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions, please slow down.' },
});
app.use('/api', globalLimiter);
app.use('/api/reports', writeLimiter);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize database
const db = initDatabase();

// Create HTTP server + WebSocket
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Store WebSocket connections
const wsClients = new Set();
wss.on('connection', (ws) => {
  wsClients.add(ws);
  ws.on('close', () => wsClients.delete(ws));
});

// Broadcast to all WebSocket clients
function broadcast(data) {
  const message = JSON.stringify(data);
  wsClients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

// Graceful shutdown
function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully...`);
  wss.close(() => console.log('  WebSocket server closed'));
  server.close(() => {
    console.log('  HTTP server closed');
    db.close();
    console.log('  Database connection closed');
    process.exit(0);
  });
  // Force exit after 10s if graceful shutdown hangs
  setTimeout(() => { console.error('  Forced exit after timeout'); process.exit(1); }, 10000);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Make db and broadcast available to routes
app.locals.db = db;
app.locals.broadcast = broadcast;

// API Routes
app.use('/api', apiRoutes);

  // Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'ForestGuard AI Server',
    demo: isDemoActive(),
    activeScenario: getActiveScenario(),
  });
});

// Demo mode routes (only available when DEMO_MODE is enabled)
if (process.env.DEMO_MODE === 'true') {
  // List available scenarios
  app.get('/api/demo/scenarios', (req, res) => {
    res.json({
      scenarios: getScenarios(),
      active: getActiveScenario(),
      isRunning: isDemoActive(),
    });
  });
  // Start a scenario (optional ?scenario=lebanon-cedar, default: ajloun)
  app.get('/api/demo/start', (req, res) => {
    const scenarioId = req.query.scenario || 'ajloun';
    const result = startDemo(db, broadcast, scenarioId);
    res.json(result);
  });
  app.get('/api/demo/stop', (req, res) => {
    const result = stopDemo();
    res.json(result);
  });
  app.get('/api/demo/seed', (req, res) => {
    seedDatabase(db);
    broadcast({ type: 'DEMO_STARTED', data: { seeded: true } });
    res.json({ success: true, message: 'Database seeded with multi-region demo data' });
  });
} else {
  app.get('/api/demo/*', (req, res) => {
    res.status(403).json({ error: 'Demo mode is disabled. Set DEMO_MODE=true to enable.' });
  });
}

// Serve static client build in production (MUST be after API/health routes)
if (!isDev) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const publicPath = path.join(__dirname, '..', 'public');
  app.use(express.static(publicPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// Cron Jobs
// Fetch NASA FIRMS data every 3 hours
cron.schedule('0 */3 * * *', async () => {
  console.log('🔥 Fetching NASA FIRMS data...');
  try {
    await fetchFIRMSData(db, broadcast);
  } catch (err) {
    console.error('FIRMS fetch error:', err.message);
  }
});

// Update fire risk every hour
cron.schedule('0 * * * *', async () => {
  console.log('🌡️ Updating fire risk scores...');
  try {
    await updateFireRisk(db, broadcast);
  } catch (err) {
    console.error('Weather fetch error:', err.message);
  }
});

// Initialize Telegram Bot
if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== 'your_telegram_bot_token_here') {
  initBot(db, broadcast);
  console.log('🤖 Telegram Bot initialized');
} else {
  console.log('⚠️ Telegram Bot not configured - set TELEGRAM_BOT_TOKEN in .env');
}

// Start server
server.listen(PORT, () => {
  console.log(`
  🌳 ForestGuard AI Server running!
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🌐 API:       http://localhost:${PORT}/api
  💚 Health:    http://localhost:${PORT}/health
  🔌 WebSocket: ws://localhost:${PORT}
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  // Demo mode: auto-seed and auto-start
  if (process.env.DEMO_MODE === 'true') {
    console.log('🎬 DEMO_MODE enabled — seeding database...');
    try {
      seedDatabase(db);
      console.log('✅ Demo data seeded successfully');
    } catch (err) {
      console.error('❌ Seed error:', err.message);
    }
    // Auto-start demo scenario after a short delay so clients can connect
    setTimeout(() => {
      console.log('🎬 Auto-starting demo scenario...');
      startDemo(db, broadcast);
    }, 3000);
  } else {
    // Normal mode: fetch real data
    console.log('📡 Running initial data fetch...');
    fetchFIRMSData(db, broadcast).catch(() => {});
    updateFireRisk(db, broadcast).catch(() => {});
  }
});
