// server/middleware/device.js
// requireDevice protects the routes the ESP32 calls. The board sends the shared secret from
// DEVICE_API_KEY (server/.env) in an "X-Device-Key" header — the same value goes in the
// sketch's DEVICE_KEY. Phones use JWT logins instead; this is only for the hardware.
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

  // Remember when the board last checked in so the app can show Online/Offline.
  db.prepare("UPDATE device_status SET last_seen = ?, ip = ? WHERE id = 1").run(new Date().toISOString(), req.ip);
  next();
}

module.exports = { requireDevice };
