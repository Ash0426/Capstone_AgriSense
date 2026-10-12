// farm settings
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { parseTime } = require('../lib/automation');

const router = express.Router();

// lifecycle

router.get('/lifecycle', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM lifecycle WHERE id = 1').get();
  res.json({ ageDays: row.age_days, updatedAt: row.updated_at });
});

router.patch('/lifecycle', requireAuth, (req, res) => {
  const { ageDays } = req.body;
  if (typeof ageDays !== 'number' || ageDays < 1) return res.status(400).json({ error: 'ageDays must be a number >= 1' });

  db.prepare("UPDATE lifecycle SET age_days = ?, updated_at = datetime('now') WHERE id = 1").run(Math.round(ageDays));
  const row = db.prepare('SELECT * FROM lifecycle WHERE id = 1').get();
  res.json({ ageDays: row.age_days, updatedAt: row.updated_at });
});

// automation limits

function publicLimits(row) {
  return { soilMoistureLimit: row.soil_moisture_limit, tempLimit: row.temp_limit, overrideAmountLiters: row.override_amount_liters };
}

router.get('/automation-limits', requireAuth, (req, res) => {
  res.json(publicLimits(db.prepare('SELECT * FROM automation_limits WHERE id = 1').get()));
});

router.patch('/automation-limits', requireAuth, (req, res) => {
  const current = db.prepare('SELECT * FROM automation_limits WHERE id = 1').get();
  const { soilMoistureLimit, tempLimit, overrideAmountLiters } = req.body;

  db.prepare(
    "UPDATE automation_limits SET soil_moisture_limit = ?, temp_limit = ?, override_amount_liters = ?, updated_at = datetime('now') WHERE id = 1"
  ).run(
    soilMoistureLimit ?? current.soil_moisture_limit,
    tempLimit ?? current.temp_limit,
    overrideAmountLiters ?? current.override_amount_liters
  );

  res.json(publicLimits(db.prepare('SELECT * FROM automation_limits WHERE id = 1').get()));
});

// watering schedule

router.get('/watering-schedule', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM watering_schedule').all();
  const result = {};
  rows.forEach((r) => (result[r.day] = { time: r.time, amountLiters: r.amount_liters }));
  res.json(result);
});

const VALID_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

router.patch('/watering-schedule/:day', requireAuth, (req, res) => {
  const { day } = req.params;
  if (!VALID_DAYS.includes(day)) return res.status(400).json({ error: `Unknown day: ${day}` });

  const { time, amountLiters } = req.body;
  if (typeof time !== 'string' || typeof amountLiters !== 'number' || amountLiters < 0) {
    return res.status(400).json({ error: 'time (string) and amountLiters (number >= 0) are required' });
  }
  if (parseTime(time) == null) {
    return res.status(400).json({ error: 'Time must look like 06:00, 18:30 or 6:30 PM' });
  }
  // this also resets last_run_date

  db.prepare('INSERT OR REPLACE INTO watering_schedule (day, time, amount_liters) VALUES (?, ?, ?)').run(day, time, amountLiters);
  res.json({ day, time, amountLiters });
});

// sensor calibration

const VALID_SENSOR_KEYS = ['heatIndex', 'soilMoisture', 'airTemp', 'waterLevel'];

router.get('/calibration', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM sensor_calibration').all();
  const result = {};
  rows.forEach((r) => (result[r.sensor_key] = { min: r.min, max: r.max }));
  res.json(result);
});

router.patch('/calibration/:key', requireAuth, (req, res) => {
  const { key } = req.params;
  if (!VALID_SENSOR_KEYS.includes(key)) return res.status(400).json({ error: `Unknown sensor key: ${key}` });

  const { min, max } = req.body;
  if (typeof min !== 'number' || typeof max !== 'number' || min >= max) {
    return res.status(400).json({ error: 'min and max must be numbers, with min < max' });
  }

  db.prepare('INSERT OR REPLACE INTO sensor_calibration (sensor_key, min, max) VALUES (?, ?, ?)').run(key, min, max);
  res.json({ key, min, max });
});

// notifications

function publicNotification(r) {
  return {
    id: r.id,
    category: r.category,
    icon: r.icon,
    iconBg: r.icon_bg,
    title: r.title,
    desc: r.desc,
    time: new Date(r.created_at).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: 'numeric', minute: '2-digit' }).replace(',', ' ·'),
  };
}

const VALID_CATEGORIES = ['watered', 'tank-low', 'limit-exceeded', 'daily-status', 'lifecycle-change'];

router.get('/notifications', requireAuth, (req, res) => {
  const limit = Number(req.query.limit) || 50;
  const rows = db.prepare('SELECT * FROM notifications ORDER BY id DESC LIMIT ?').all(limit);
  res.json(rows.map(publicNotification));
});

router.post('/notifications', requireAuth, (req, res) => {
  const { category, icon, iconBg, title, desc } = req.body;
  if (!VALID_CATEGORIES.includes(category) || !icon || !iconBg || !title || !desc) {
    return res.status(400).json({ error: 'category, icon, iconBg, title, and desc are required' });
  }

  const result = db
    .prepare('INSERT INTO notifications (category, icon, icon_bg, title, desc) VALUES (?, ?, ?, ?, ?)')
    .run(category, icon, iconBg, title, desc);

  res.status(201).json(publicNotification(db.prepare('SELECT * FROM notifications WHERE id = ?').get(result.lastInsertRowid)));
});

module.exports = router;
