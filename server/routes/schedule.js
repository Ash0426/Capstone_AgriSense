// server/routes/schedule.js
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/schedule
router.get('/', requireAuth, (req, res) => {
  const row = db.prepare('SELECT morning_time, duration_minutes FROM schedule WHERE id = 1').get();
  res.json({ morningTime: row.morning_time, durationMinutes: row.duration_minutes });
});

// PUT /api/schedule
router.put('/', requireAuth, (req, res) => {
  const { morningTime, durationMinutes } = req.body;
  if (!morningTime || typeof durationMinutes !== 'number') {
    return res.status(400).json({ error: 'morningTime (string) and durationMinutes (number) are required' });
  }
  db.prepare('UPDATE schedule SET morning_time = ?, duration_minutes = ? WHERE id = 1').run(morningTime, durationMinutes);
  res.json({ morningTime, durationMinutes });
});

module.exports = router;
