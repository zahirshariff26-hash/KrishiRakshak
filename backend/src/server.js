require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./config/database');

const authRoutes = require('./routes/auth');
const predictRoutes = require('./routes/predict');
const diagnosesRoutes = require('./routes/diagnoses');
const communityRoutes = require('./routes/community');
const reportsRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

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
