const express = require('express');
const cors = require('cors');
const { getDb, resetDatabase } = require('./database/db');
const simulationService = require('./services/simulationService');

// Routers
const shipmentsRouter = require('./routes/shipments');
const networkRouter = require('./routes/network');
const eventsRouter = require('./routes/events');
const syncRouter = require('./routes/sync');
const statsRouter = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database
try {
  getDb();
  console.log('✓ SQLite database connected and verified.');
} catch (err) {
  console.error('Database connection error:', err);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/api/health') {
      console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'UPS Delay Intelligence Backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount Routes
app.use('/api/shipments', shipmentsRouter);
app.use('/api/network', networkRouter);
app.use('/api/events', eventsRouter);
app.use('/api/sync', syncRouter);
app.use('/api/stats', statsRouter);

// Live Simulation Control
app.post('/api/simulation/start', (req, res) => {
  const result = simulationService.startSimulation(req.body?.interval || 3500);
  res.json({ success: true, ...result });
});

app.post('/api/simulation/stop', (req, res) => {
  const result = simulationService.stopSimulation();
  res.json({ success: true, ...result });
});

app.get('/api/simulation/status', (req, res) => {
  const status = simulationService.getSimulationStatus();
  res.json({ success: true, ...status });
});

// Reset Demo Data
app.post('/api/reset-demo', (req, res) => {
  try {
    const result = resetDatabase();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.url}` });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`✓ UPS Delay Intelligence Backend running on port ${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/api/health`);
  console.log(`========================================================`);
});
