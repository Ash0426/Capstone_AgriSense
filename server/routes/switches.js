const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const valve = require('../lib/valve');
const automation = require('../lib/automation');

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

  if (key === 'valve') {
    // valve
    const actor = db.prepare('SELECT name FROM users WHERE id = ?').get(req.userId);
    if (value) valve.openManual(actor?.name ?? 'Unknown');
    else valve.closeValve('Manual override', actor?.name ?? 'Unknown');
    return res.json({ key, value });
  }

  if (key === 'roof') {
    // manual roof turns off auto mode
    const actor = db.prepare('SELECT name FROM users WHERE id = ?').get(req.userId);
    db.prepare("UPDATE hardware_settings SET roof_mode = 'manual' WHERE id = 1").run();
    automation.setRoof(value, actor?.name ?? 'Unknown', 'Manual');
    return res.json({ key, value });
  }

  db.prepare('UPDATE switches SET value = ? WHERE key = ?').run(value ? 1 : 0, key);

  res.json({ key, value });
});

module.exports = router;
