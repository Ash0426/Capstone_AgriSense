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

module.exports = router;
