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

  CREATE TABLE IF NOT EXISTS schedule (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    morning_time TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,           -- 'temp_humidity' | 'soil' | 'valve' | 'roof'
    payload TEXT NOT NULL,        -- JSON string, shape depends on type
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    icon TEXT NOT NULL,
    icon_bg TEXT NOT NULL,
    title TEXT NOT NULL,
    desc TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Seed default switches + schedule row if empty (first run only)
const switchDefaults = { roof: 1, valve: 0, timer: 1, notifications: 1, skipRain: 1 };
const insertSwitch = db.prepare('INSERT OR IGNORE INTO switches (key, value) VALUES (?, ?)');
for (const [key, value] of Object.entries(switchDefaults)) insertSwitch.run(key, value);

db.prepare('INSERT OR IGNORE INTO schedule (id, morning_time, duration_minutes) VALUES (1, ?, ?)').run('06:03', 12);

// Seed one sensor reading + a demo user so the app has something to show on first run
const readingCount = db.prepare('SELECT COUNT(*) AS c FROM sensor_readings').get().c;
if (readingCount === 0) {
  db.prepare(
    'INSERT INTO sensor_readings (air_temp, air_humidity, soil_moisture, rain) VALUES (?, ?, ?, ?)'
  ).run(35.2, 72, 48, 0.0);
}

const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
if (userCount === 0) {
  const hash = bcrypt.hashSync('password123', 10);
  db.prepare(
    'INSERT INTO users (name, email, password_hash, role, color) VALUES (?, ?, ?, ?, ?)'
  ).run('Farmer', 'farmer@agrisense.app', hash, 'Administrator', '#3d9970');
  console.log('Seeded demo user -> email: farmer@agrisense.app  password: password123');
}

// Seed a few demo log rows + notifications so the History and Notification screens
// aren't empty before any real ESP32 readings come in. Safe to delete these rows any time.
const logCount = db.prepare('SELECT COUNT(*) AS c FROM logs').get().c;
if (logCount === 0) {
  const insertLog = db.prepare('INSERT INTO logs (type, payload) VALUES (?, ?)');
  insertLog.run('temp_humidity', JSON.stringify({ time: 'Jun 22 · 08:30', temp: '35.2°C', humidity: '72%', status: 'Too Hot', statusType: 'danger' }));
  insertLog.run('temp_humidity', JSON.stringify({ time: 'Jun 22 · 07:30', temp: '29.4°C', humidity: '76%', status: 'Normal', statusType: 'ok' }));
  insertLog.run('soil', JSON.stringify({ time: 'Jun 22 · 08:30', moisture: '48%', status: 'Dry', statusType: 'warn' }));
  insertLog.run('valve', JSON.stringify({ time: 'Jun 22 · 08:32', action: 'Opened', duration: '—', reason: 'Soil too dry (below 55%)', statusType: 'ok' }));
  insertLog.run('roof', JSON.stringify({ time: 'Jun 22 · 08:31', action: 'Closed', tempGauge: '35.2°C', statusType: 'danger' }));
}

const notificationCount = db.prepare('SELECT COUNT(*) AS c FROM notifications').get().c;
if (notificationCount === 0) {
  const insertNotif = db.prepare('INSERT INTO notifications (icon, icon_bg, title, desc) VALUES (?, ?, ?, ?)');
  insertNotif.run('thermometer', 'amber', 'High temperature alert', 'Air temperature reached 35.2°C');
  insertNotif.run('water', 'blue', 'Watering started', 'Soil moisture dropped below 55% threshold');
  insertNotif.run('home', 'green', 'Roof closed automatically', 'Triggered by high temperature');
}

module.exports = db;
