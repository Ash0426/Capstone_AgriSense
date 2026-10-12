// sensor readings
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { requireDevice } = require('../middleware/device');
const { getSettings, rawToPercent } = require('../lib/settings');
const automation = require('../lib/automation');

const router = express.Router();

function ranges() {
  const out = {};
  db.prepare('SELECT * FROM sensor_calibration').all().forEach((r) => (out[r.sensor_key] = { min: r.min, max: r.max }));
  return out;
}

function tempStatus(v, r = ranges().airTemp) {
  if (r && v > r.max) return { status: 'danger', label: 'Too Hot' };
  if (r && v < r.min) return { status: 'warn', label: 'Too Cold' };
  return { status: 'ok', label: 'Normal' };
}
function humidityStatus(v) {
  return v >= 60 && v <= 80 ? { status: 'ok', label: 'Normal' } : { status: 'warn', label: v < 60 ? 'Too Dry' : 'Too Humid' };
}
function soilStatus(v, r = ranges().soilMoisture) {
  if (r && v < r.min) return { status: 'warn', label: 'Dry' };
  if (r && v > r.max) return { status: 'warn', label: 'Too Wet' };
  return { status: 'ok', label: 'Good' };
}
function rainStatus(v, s = getSettings()) {
  return v >= s.rainThreshold ? { status: 'ok', label: 'Raining' } : { status: 'ok', label: 'No Rain' };
}

// min change before logging
const SHIFT_THRESHOLDS = { soilMoisture: 5, airTemp: 2, waterLevel: 5 };

function logSensorShift(key, value) {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const date = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  db.prepare('INSERT INTO logs (type, payload) VALUES (?, ?)').run(`sensor-${key}`, JSON.stringify({ value, time, date }));
}

// sqlite time is utc, add Z
function sqliteUtcToIso(text) {
  return text ? `${text.replace(' ', 'T')}Z` : text;
}

// GET /api/sensors/latest
router.get('/latest', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM sensor_readings ORDER BY id DESC LIMIT 1').get();
  if (!row) return res.status(404).json({ error: 'No sensor readings yet' });

  let waterLevel = row.water_level;
  if (waterLevel == null) {
    const last = db.prepare('SELECT water_level FROM sensor_readings WHERE water_level IS NOT NULL ORDER BY id DESC LIMIT 1').get();
    waterLevel = last?.water_level ?? 0;
  }

  const t = tempStatus(row.air_temp);
  const h = humidityStatus(row.air_humidity);
  const s = soilStatus(row.soil_moisture);
  const r = rainStatus(row.rain);

  res.json({
    airTemp: row.air_temp, airTempStatus: t.status, airTempLabel: t.label,
    airHumidity: row.air_humidity, airHumidityStatus: h.status, airHumidityLabel: h.label,
    soilMoisture: row.soil_moisture, soilMoistureStatus: s.status, soilMoistureLabel: s.label,
    rain: row.rain, rainStatus: r.status, rainLabel: r.label,
    waterLevel,
    updatedAt: sqliteUtcToIso(row.recorded_at),
  });
});

// POST /api/sensors (from esp32)
const PERCENT_FIELDS = { airTemp: 'air_temp', airHumidity: 'air_humidity', soilMoisture: 'soil_moisture', rain: 'rain', waterLevel: 'water_level' };
const RAW_FIELDS = ['soilRaw', 'waterRaw', 'rainRaw'];

router.post('/', requireDevice, (req, res) => {
  const body = req.body || {};
  for (const k of [...Object.keys(PERCENT_FIELDS), ...RAW_FIELDS]) {
    if (body[k] !== undefined && (typeof body[k] !== 'number' || !Number.isFinite(body[k]))) {
      return res.status(400).json({ error: `${k} must be a number if provided` });
    }
  }

  // convert raw to %
  const cal = getSettings();
  const measured = {};
  for (const k of Object.keys(PERCENT_FIELDS)) if (body[k] !== undefined) measured[k] = body[k];
  if (body.soilRaw !== undefined) measured.soilMoisture = rawToPercent(body.soilRaw, cal.soilDryRaw, cal.soilWetRaw);
  if (body.waterRaw !== undefined) measured.waterLevel = rawToPercent(body.waterRaw, cal.waterEmptyRaw, cal.waterFullRaw);
  if (body.rainRaw !== undefined) measured.rain = rawToPercent(body.rainRaw, cal.rainDryRaw, cal.rainWetRaw);

  if (Object.keys(measured).length === 0) {
    return res.status(400).json({ error: 'Send at least one of: ' + [...RAW_FIELDS, ...Object.keys(PERCENT_FIELDS)].join(', ') });
  }

  db.prepare('UPDATE device_status SET soil_raw = COALESCE(?, soil_raw), water_raw = COALESCE(?, water_raw), rain_raw = COALESCE(?, rain_raw) WHERE id = 1').run(
    body.soilRaw ?? null, body.waterRaw ?? null, body.rainRaw ?? null
  );

  const prev = db.prepare('SELECT * FROM sensor_readings ORDER BY id DESC LIMIT 1').get();
  const pick = (k, fallback) => measured[k] ?? prev?.[PERCENT_FIELDS[k]] ?? fallback;
  const airTemp = pick('airTemp', 0);
  const airHumidity = pick('airHumidity', 0);
  const soilMoisture = pick('soilMoisture', 0);
  const rain = pick('rain', 0);
  const waterLevel = measured.waterLevel ?? null;

  db.prepare(
    'INSERT INTO sensor_readings (air_temp, air_humidity, soil_moisture, rain, water_level) VALUES (?, ?, ?, ?, ?)'
  ).run(airTemp, airHumidity, soilMoisture, rain, waterLevel);

  if (prev) {
    if (Math.abs(soilMoisture - prev.soil_moisture) >= SHIFT_THRESHOLDS.soilMoisture) logSensorShift('soilMoisture', soilMoisture);
    if (Math.abs(airTemp - prev.air_temp) >= SHIFT_THRESHOLDS.airTemp) logSensorShift('airTemp', airTemp);
    if (waterLevel != null && prev.water_level != null && Math.abs(waterLevel - prev.water_level) >= SHIFT_THRESHOLDS.waterLevel) {
      logSensorShift('waterLevel', waterLevel);
    }
  }

  // history logs
  const now = new Date();
  const time = now.toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', ' ·');
  const t = tempStatus(airTemp);
  const s = soilStatus(soilMoisture);
  db.prepare('INSERT INTO logs (type, payload) VALUES (?, ?)').run(
    'temp_humidity',
    JSON.stringify({ time, temp: `${airTemp}°C`, humidity: `${airHumidity}%`, status: t.label, statusType: t.status })
  );
  db.prepare('INSERT INTO logs (type, payload) VALUES (?, ?)').run(
    'soil',
    JSON.stringify({ time, moisture: `${soilMoisture}%`, status: s.label, statusType: s.status })
  );

  // run automation
  automation.onReading({
    soilMoisture: measured.soilMoisture,
    airTemp: measured.airTemp,
    rain: measured.rain,
    waterLevel: measured.waterLevel,
  });

  res.status(201).json({ message: 'Reading stored', soilMoisture: measured.soilMoisture, waterLevel: measured.waterLevel, rain: measured.rain });
});

module.exports = router;
