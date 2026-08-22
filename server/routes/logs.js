// server/routes/logs.js
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const TYPE_MAP = {
  'temp-humidity': 'temp_humidity',
  soil: 'soil',
  valve: 'valve',
  roof: 'roof',
  lifecycle: 'lifecycle',
  'sensor-heatIndex': 'sensor-heatIndex',
  'sensor-soilMoisture': 'sensor-soilMoisture',
  'sensor-airTemp': 'sensor-airTemp',
  'sensor-waterLevel': 'sensor-waterLevel',
};

// GET /api/logs/:type
router.get('/:type', requireAuth, (req, res) => {
  const dbType = TYPE_MAP[req.params.type];
  if (!dbType) return res.status(400).json({ error: `Unknown log type: ${req.params.type}` });

  const limit = Number(req.query.limit) || 50;
  const rows = db
    .prepare('SELECT payload FROM logs WHERE type = ? ORDER BY id DESC LIMIT ?')
    .all(dbType, limit);

  res.json(rows.map((r) => JSON.parse(r.payload)));
});

// POST /api/logs/lifecycle — the only client-writable log type (age/health-rating changes
// aren't tied to a sensor POST or a switch toggle, so nothing else creates these server-side).
router.post('/lifecycle', requireAuth, (req, res) => {
  const { action, statusType } = req.body;
  if (!action || !['ok', 'warn', 'danger'].includes(statusType)) {
    return res.status(400).json({ error: 'action (string) and statusType (ok|warn|danger) are required' });
  }

  const time = new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', hour: 'numeric', minute: '2-digit' }).replace(',', ' ·');
  db.prepare('INSERT INTO logs (type, payload) VALUES (?, ?)').run('lifecycle', JSON.stringify({ time, action, statusType }));

  res.status(201).json({ time, action, statusType });
});

module.exports = router;
