import express from 'express';
import runsRouter from './routes/runs.js';

const app = express();
const PORT = Number(process.env['PORT'] ?? 3000);

app.use(express.json());

// CORS — allow all origins for now (dashboard)
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/runs', runsRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Kairo API running on port ${PORT}`);
});

export default app;
