// server/db.js
// Opens (and creates, if missing) agrisense.db, then makes sure every table exists.
// This runs once when the server starts — it's the "database initialization" step,
// so it must run before any route tries to query a table.
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'agrisense.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Administrator',
    color TEXT NOT NULL DEFAULT '#3d9970',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS otps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sensor_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    air_temp REAL NOT NULL,
    air_humidity REAL NOT NULL,
    soil_moisture REAL NOT NULL,
    rain REAL NOT NULL,
    recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS switches (
    key TEXT PRIMARY KEY,
    value INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,           -- 'temp_humidity' | 'soil' | 'valve' | 'roof'
    payload TEXT NOT NULL,        -- JSON string, shape depends on type
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Farmer-submitted lettuce health ratings, each paired with a snapshot of the sensor
  -- reading at that moment. This is the labeled training data for the heat-stress model
  -- in routes/health.js — "stressed" is derived from the rating (Dried out/Drooping = 1).
  CREATE TABLE IF NOT EXISTS health_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    rating TEXT NOT NULL,
    stressed INTEGER NOT NULL,
    air_temp REAL,
    air_humidity REAL,
    soil_moisture REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Single-row settings tables (id=1 enforced by the CHECK) — lifecycle age and the water
  -- automation limits each only ever have one current value, edited in place.
  CREATE TABLE IF NOT EXISTS lifecycle (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    age_days INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS automation_limits (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    soil_moisture_limit REAL NOT NULL DEFAULT 40,
    temp_limit REAL NOT NULL DEFAULT 32,
    override_amount_liters REAL NOT NULL DEFAULT 2,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- One row per day of the week (Mon..Sun) — independent watering time + amount, editable
  -- from the Weekly Weather page.
  CREATE TABLE IF NOT EXISTS watering_schedule (
    day TEXT PRIMARY KEY,
    time TEXT NOT NULL,
    amount_liters REAL NOT NULL
  );

  -- One row per sensor key — the safe min/max range that triggers the Dashboard alert banner.
  CREATE TABLE IF NOT EXISTS sensor_calibration (
    sensor_key TEXT PRIMARY KEY,
    min REAL NOT NULL,
    max REAL NOT NULL
  );

  -- Live notification feed (crop watered, tank low, limit exceeded, daily status, lifecycle
  -- change) — farm-wide, not per-user, same as sensor_readings/switches/logs.
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    icon TEXT NOT NULL,
    icon_bg TEXT NOT NULL,
    title TEXT NOT NULL,
    desc TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Add the "water_level" column to an already-existing sensor_readings table — nullable since
// hardware may not report it yet; /sensors/latest falls back to the last known value.
const sensorColumns = db.prepare('PRAGMA table_info(sensor_readings)').all();
if (!sensorColumns.some((c) => c.name === 'water_level')) {
  db.exec('ALTER TABLE sensor_readings ADD COLUMN water_level REAL');
}

// An older "notifications" table (pre-dating the category-aware one above) may already exist
// from before — CREATE TABLE IF NOT EXISTS is a no-op against it, so add the missing column
// directly and clear its stale rows (icon/title copy that doesn't match today's 5 categories).
const notificationColumns = db.prepare('PRAGMA table_info(notifications)').all();
if (!notificationColumns.some((c) => c.name === 'category')) {
  db.exec("ALTER TABLE notifications ADD COLUMN category TEXT NOT NULL DEFAULT 'daily-status'");
  db.exec('DELETE FROM notifications');
}

// Add the "disabled" column to an already-existing users table (CREATE TABLE IF NOT EXISTS
// above won't add columns to a table that already exists from before this change).
const userColumns = db.prepare('PRAGMA table_info(users)').all();
if (!userColumns.some((c) => c.name === 'disabled')) {
  db.exec('ALTER TABLE users ADD COLUMN disabled INTEGER NOT NULL DEFAULT 0');
}

// Seed default switches if empty (first run only)
const switchDefaults = { roof: 1, valve: 0, timer: 1, notifications: 1, skipRain: 1 };
const insertSwitch = db.prepare('INSERT OR IGNORE INTO switches (key, value) VALUES (?, ?)');
for (const [key, value] of Object.entries(switchDefaults)) insertSwitch.run(key, value);

db.prepare('INSERT OR IGNORE INTO lifecycle (id, age_days) VALUES (1, 1)').run();
db.prepare(
  'INSERT OR IGNORE INTO automation_limits (id, soil_moisture_limit, temp_limit, override_amount_liters) VALUES (1, 40, 32, 2)'
).run();

const wateringDefaults = {
  Mon: { time: '06:00', amountLiters: 2 },
  Tue: { time: '06:00', amountLiters: 2 },
  Wed: { time: '06:00', amountLiters: 2 },
  Thu: { time: '06:00', amountLiters: 2 },
  Fri: { time: '06:00', amountLiters: 2 },
  Sat: { time: '06:30', amountLiters: 1.5 },
  Sun: { time: '06:30', amountLiters: 1.5 },
};
const insertWatering = db.prepare('INSERT OR IGNORE INTO watering_schedule (day, time, amount_liters) VALUES (?, ?, ?)');
for (const [day, { time, amountLiters }] of Object.entries(wateringDefaults)) insertWatering.run(day, time, amountLiters);

const calibrationDefaults = {
  heatIndex: { min: 15, max: 35 },
  soilMoisture: { min: 30, max: 70 },
  airTemp: { min: 18, max: 30 },
  waterLevel: { min: 20, max: 100 },
};
const insertCalibration = db.prepare('INSERT OR IGNORE INTO sensor_calibration (sensor_key, min, max) VALUES (?, ?, ?)');
for (const [key, { min, max }] of Object.entries(calibrationDefaults)) insertCalibration.run(key, min, max);

// Seed one sensor reading + a demo user so the app has something to show on first run
const readingCount = db.prepare('SELECT COUNT(*) AS c FROM sensor_readings').get().c;
if (readingCount === 0) {
  db.prepare(
    'INSERT INTO sensor_readings (air_temp, air_humidity, soil_moisture, rain, water_level) VALUES (?, ?, ?, ?, ?)'
  ).run(35.2, 72, 48, 0.0, 72);
}

const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
if (userCount === 0) {
  const hash = bcrypt.hashSync('password123', 10);
  db.prepare(
    'INSERT INTO users (name, email, password_hash, role, color) VALUES (?, ?, ?, ?, ?)'
  ).run('Farmer', 'trinove.corp@gmail.com', hash, 'Administrator', '#3d9970');
  console.log('Seeded demo user -> email: trinove.corp@gmail.com  password: password123');
}

// Seed a few demo log rows so the History screen isn't empty before any real ESP32
// readings come in. Safe to delete these rows any time.
const logCount = db.prepare('SELECT COUNT(*) AS c FROM logs').get().c;
if (logCount === 0) {
  const insertLog = db.prepare('INSERT INTO logs (type, payload) VALUES (?, ?)');
  insertLog.run('temp_humidity', JSON.stringify({ time: 'Jun 22 · 08:30', temp: '35.2°C', humidity: '72%', status: 'Too Hot', statusType: 'danger' }));
  insertLog.run('temp_humidity', JSON.stringify({ time: 'Jun 22 · 07:30', temp: '29.4°C', humidity: '76%', status: 'Normal', statusType: 'ok' }));
  insertLog.run('soil', JSON.stringify({ time: 'Jun 22 · 08:30', moisture: '48%', status: 'Dry', statusType: 'warn' }));
  insertLog.run('valve', JSON.stringify({ time: 'Jun 22 · 08:32', action: 'Opened', duration: '—', reason: 'Soil too dry (below 55%)', statusType: 'ok' }));
  insertLog.run('roof', JSON.stringify({ time: 'Jun 22 · 08:31', action: 'Closed', tempGauge: '35.2°C', statusType: 'danger' }));
}

module.exports = db;
