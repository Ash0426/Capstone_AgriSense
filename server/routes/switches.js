// server/routes/switches.js
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const VALID_KEYS = ['roof', 'valve', 'timer', 'notifications', 'skipRain'];

// GET /api/switches
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT key, value FROM switches').all();
  const result = {};
  rows.forEach((r) => (result[r.key] = !!r.value));
  res.json(result);
});

// PATCH /api/switches/:key
router.patch('/:key', requireAuth, (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  if (!VALID_KEYS.includes(key)) return res.status(400).json({ error: `Unknown switch key: ${key}` });
  if (typeof value !== 'boolean') return res.status(400).json({ error: 'value must be a boolean' });

  db.prepare('UPDATE switches SET value = ? WHERE key = ?').run(value ? 1 : 0, key);

  if (key === 'roof' || key === 'valve') {
    const time = new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', ' ·');
    if (key === 'roof') {
      db.prepare('INSERT INTO logs (type, payload) VALUES (?, ?)').run(
        'roof',
        JSON.stringify({ time, action: value ? 'Open' : 'Closed', statusType: value ? 'ok' : 'danger' })
      );
    } else {
      db.prepare('INSERT INTO logs (type, payload) VALUES (?, ?)').run(
        'valve',
        JSON.stringify({ time, action: value ? 'Opened' : 'Closed', duration: '—', reason: 'Manual override', statusType: 'ok' })
      );
    }
  }

  res.json({ key, value });
});

module.exports = router;
