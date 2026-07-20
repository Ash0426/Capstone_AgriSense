// server/routes/sensors.js
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function tempStatus(v) {
  if (v > 24) return { status: 'danger', label: 'Too Hot' };
  if (v < 20) return { status: 'warn', label: 'Too Cold' };
  return { status: 'ok', label: 'Normal' };
}
function humidityStatus(v) {
  return v >= 60 && v <= 80 ? { status: 'ok', label: 'Normal' } : { status: 'warn', label: v < 60 ? 'Too Dry' : 'Too Humid' };
}
function soilStatus(v) {
  return v < 55 ? { status: 'warn', label: 'Dry' } : { status: 'ok', label: 'Good' };
}
function rainStatus(v) {
  return v > 0 ? { status: 'ok', label: 'Raining' } : { status: 'ok', label: 'No Rain' };
}

// GET /api/sensors/latest
router.get('/latest', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM sensor_readings ORDER BY id DESC LIMIT 1').get();
  if (!row) return res.status(404).json({ error: 'No sensor readings yet' });

  const t = tempStatus(row.air_temp);
  const h = humidityStatus(row.air_humidity);
  const s = soilStatus(row.soil_moisture);
  const r = rainStatus(row.rain);

  res.json({
    airTemp: row.air_temp, airTempStatus: t.status, airTempLabel: t.label,
    airHumidity: row.air_humidity, airHumidityStatus: h.status, airHumidityLabel: h.label,
    soilMoisture: row.soil_moisture, soilMoistureStatus: s.status, soilMoistureLabel: s.label,
    rain: row.rain, rainStatus: r.status, rainLabel: r.label,
    updatedAt: row.recorded_at,
  });
});

// POST /api/sensors  (ESP32 pushes a new reading here)
router.post('/', (req, res) => {
  const { airTemp, airHumidity, soilMoisture, rain } = req.body;
  if ([airTemp, airHumidity, soilMoisture, rain].some((v) => typeof v !== 'number')) {
    return res.status(400).json({ error: 'airTemp, airHumidity, soilMoisture, and rain must all be numbers' });
  }
  db.prepare(
    'INSERT INTO sensor_readings (air_temp, air_humidity, soil_moisture, rain) VALUES (?, ?, ?, ?)'
  ).run(airTemp, airHumidity, soilMoisture, rain);

  // Also log temp/humidity + soil rows so the History tabs stay populated
  const now = new Date();
  const time = now.toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', ' ·');
  db.prepare('INSERT INTO logs (type, payload) VALUES (?, ?)').run(
    'temp_humidity',
    JSON.stringify({ time, temp: `${airTemp}°C`, humidity: `${airHumidity}%`, status: tempStatus(airTemp).label, statusType: tempStatus(airTemp).status })
  );
  db.prepare('INSERT INTO logs (type, payload) VALUES (?, ?)').run(
    'soil',
    JSON.stringify({ time, moisture: `${soilMoisture}%`, status: soilStatus(soilMoisture).label, statusType: soilStatus(soilMoisture).status })
  );

  res.status(201).json({ message: 'Reading stored' });
});

module.exports = router;
