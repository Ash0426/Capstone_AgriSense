// hardware settings
const db = require('../db');

// field -> column, min, max
const FIELDS = {
  soilDryRaw: { col: 'soil_dry_raw', min: 0, max: 4095, int: true },
  soilWetRaw: { col: 'soil_wet_raw', min: 0, max: 4095, int: true },
  waterEmptyRaw: { col: 'water_empty_raw', min: 0, max: 4095, int: true },
  waterFullRaw: { col: 'water_full_raw', min: 0, max: 4095, int: true },
  rainDryRaw: { col: 'rain_dry_raw', min: 0, max: 4095, int: true },
  rainWetRaw: { col: 'rain_wet_raw', min: 0, max: 4095, int: true },
  tankMinLevel: { col: 'tank_min_level', min: 0, max: 100 },
  rainThreshold: { col: 'rain_threshold', min: 0, max: 100 },
  roofMode: { col: 'roof_mode', oneOf: ['manual', 'auto'] },
  roofCloseTemp: { col: 'roof_close_temp', min: -10, max: 60 },
  roofCloseOnRain: { col: 'roof_close_on_rain', bool: true },
  servoOpenAngle: { col: 'servo_open_angle', min: 0, max: 180, int: true },
  servoClosedAngle: { col: 'servo_closed_angle', min: 0, max: 180, int: true },
  sensorIntervalSec: { col: 'sensor_interval_sec', min: 5, max: 3600, int: true },
};

function getSettings() {
  const row = db.prepare('SELECT * FROM hardware_settings WHERE id = 1').get();
  const out = {};
  for (const [key, f] of Object.entries(FIELDS)) out[key] = f.bool ? !!row[f.col] : row[f.col];
  return out;
}

// validate settings update
function validate(body) {
  const values = {};
  for (const [key, f] of Object.entries(FIELDS)) {
    if (body[key] === undefined) continue;
    const v = body[key];
    if (f.oneOf) {
      if (!f.oneOf.includes(v)) return { error: `${key} must be one of: ${f.oneOf.join(', ')}` };
      values[f.col] = v;
    } else if (f.bool) {
      if (typeof v !== 'boolean') return { error: `${key} must be true or false` };
      values[f.col] = v ? 1 : 0;
    } else {
      if (typeof v !== 'number' || !Number.isFinite(v)) return { error: `${key} must be a number` };
      if (v < f.min || v > f.max) return { error: `${key} must be between ${f.min} and ${f.max}` };
      values[f.col] = f.int ? Math.round(v) : v;
    }
  }
  return { values };
}

function updateSettings(body) {
  const { error, values } = validate(body);
  if (error) return { error };

  const merged = { ...getRaw(), ...values };
  if (merged.soil_dry_raw === merged.soil_wet_raw) return { error: 'Soil dry and wet values must be different' };
  if (merged.water_empty_raw === merged.water_full_raw) return { error: 'Water empty and full values must be different' };
  if (merged.rain_dry_raw === merged.rain_wet_raw) return { error: 'Rain dry and wet values must be different' };

  const cols = Object.keys(values);
  if (cols.length) {
    db.prepare(
      `UPDATE hardware_settings SET ${cols.map((c) => `${c} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = 1`
    ).run(...cols.map((c) => values[c]));
  }
  return { settings: getSettings() };
}

function getRaw() {
  return db.prepare('SELECT * FROM hardware_settings WHERE id = 1').get();
}

// raw reading to percent
function rawToPercent(raw, zeroRaw, fullRaw) {
  if (zeroRaw === fullRaw) return 0;
  const pct = ((raw - zeroRaw) / (fullRaw - zeroRaw)) * 100;
  return Math.round(Math.min(100, Math.max(0, pct)));
}

module.exports = { getSettings, updateSettings, rawToPercent, FIELDS };
