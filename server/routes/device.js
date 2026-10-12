// device and valve routes
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { requireDevice } = require('../middleware/device');
const valve = require('../lib/valve');
const { getSettings, updateSettings } = require('../lib/settings');

const router = express.Router();

const OFFLINE_AFTER_MS = 30 * 1000;

// esp32 polls this
router.get('/device/commands', requireDevice, (req, res) => {
  const state = valve.getState();
  const s = getSettings();
  const roofOpen = !!db.prepare("SELECT value FROM switches WHERE key = 'roof'").get()?.value;
  res.json({
    valveOpen: !!state.is_open,
    valveSecondsLeft: valve.secondsLeft(state),
    roofOpen,
    roofAngle: roofOpen ? s.servoOpenAngle : s.servoClosedAngle,
    sensorIntervalSec: s.sensorIntervalSec,
  });
});

router.get('/device/status', requireAuth, (req, res) => {
  const d = db.prepare('SELECT * FROM device_status WHERE id = 1').get();
  const state = valve.getState();
  const online = !!d.last_seen && Date.now() - new Date(d.last_seen).getTime() < OFFLINE_AFTER_MS;
  res.json({
    online,
    lastSeen: d.last_seen,
    valveOpen: !!state.is_open,
    valveSecondsLeft: valve.secondsLeft(state),
    valveReason: state.is_open ? state.reason : null,
    raw: { soil: d.soil_raw, water: d.water_raw, rain: d.rain_raw },
  });
});

router.get('/hardware-settings', requireAuth, (req, res) => {
  res.json(getSettings());
});

router.patch('/hardware-settings', requireAuth, (req, res) => {
  const result = updateSettings(req.body || {});
  if (result.error) return res.status(400).json({ error: result.error });

  db.prepare('INSERT INTO user_activity (user_id, action) VALUES (?, ?)').run(
    req.userId,
    `Changed hardware settings: ${Object.keys(req.body).join(', ')}`
  );
  res.json(result.settings);
});

router.post('/valve/run', requireAuth, (req, res) => {
  const limits = db.prepare('SELECT override_amount_liters FROM automation_limits WHERE id = 1').get();
  const liters = typeof req.body?.liters === 'number' && req.body.liters > 0 ? req.body.liters : limits.override_amount_liters;
  const actor = db.prepare('SELECT name FROM users WHERE id = ?').get(req.userId);

  const result = valve.startWatering(liters, 'Water now (manual)', actor?.name ?? 'Unknown');
  if (result === 'running') return res.status(409).json({ error: 'Valve is already running' });
  if (result === 'tank-low') {
    return res.status(409).json({ error: `Water tank is below your minimum of ${getSettings().tankMinLevel}% — refill it first` });
  }
  res.status(201).json({ liters, seconds: valve.litersToSeconds(liters) });
});

router.post('/valve/stop', requireAuth, (req, res) => {
  const actor = db.prepare('SELECT name FROM users WHERE id = ?').get(req.userId);
  valve.closeValve('Stopped from app', actor?.name ?? 'Unknown');
  res.json({ valveOpen: false });
});

module.exports = router;
