// checks the esp32 device key
const crypto = require('crypto');
const db = require('../db');

function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

function requireDevice(req, res, next) {
  const expected = process.env.DEVICE_API_KEY;
  if (!expected) {
    console.error('DEVICE_API_KEY is not set in server/.env — refusing all device requests.');
    return res.status(500).json({ error: 'Server has no DEVICE_API_KEY configured' });
  }

  const key = req.headers['x-device-key'];
  if (!key || !safeEqual(key, expected)) return res.status(401).json({ error: 'Invalid device key' });

  // last seen time
  db.prepare("UPDATE device_status SET last_seen = ?, ip = ? WHERE id = 1").run(new Date().toISOString(), req.ip);
  next();
}

module.exports = { requireDevice };
