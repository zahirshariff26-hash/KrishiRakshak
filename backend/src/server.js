require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { sequelize } = require('./config/database');

const authRoutes = require('./routes/auth');
const predictRoutes = require('./routes/predict');
const diagnosesRoutes = require('./routes/diagnoses');
const communityRoutes = require('./routes/community');
const reportsRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

const explicitOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://krishi-rakshak-orpin.vercel.app',
];

if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach(o => {
    const trimmed = o.trim();
    if (trimmed) explicitOrigins.push(trimmed);
  });
}

const dedupedOrigins = [...new Set(explicitOrigins)];

const VercelPreviewRe = /^https:\/\/krishi-rakshak-[a-zA-Z0-9_-]+\.vercel\.app$/;

console.log('[CORS] Explicit origins:', dedupedOrigins);
console.log('[CORS] Vercel preview pattern: https://krishi-rakshak-*.vercel.app');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || dedupedOrigins.includes(origin) || VercelPreviewRe.test(origin)) {
      callback(null, true);
    } else {
      console.warn('[CORS] Rejected origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use('/api/auth', authRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/diagnoses', diagnosesRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/reports', reportsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'krishirakshak-backend' });
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

async function start() {
  try {
    await sequelize.authenticate();
    console.log('[DB] Connected');
    await sequelize.sync();
    console.log('[DB] Models synced');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[SERVER] Running on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('[DB] Failed to start:', err.message);
    console.error('[DB] Error name:', err.name);
    if (err.errors) {
      console.error('[DB] Validation errors:', JSON.stringify(err.errors.map(e => ({
        model: e.modelName || e.instance?.constructor?.name,
        path: e.path,
        type: e.type,
        message: e.message,
        value: e.value,
      })), null, 2));
    }
    console.error('[DB] Stack trace:', err.stack);
    process.exit(1);
  }
}

start();
