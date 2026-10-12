// valve control and timer
const db = require('../db');

function flowLpm() {
  const v = Number(process.env.VALVE_FLOW_LPM);
  return Number.isFinite(v) && v > 0 ? v : 2; // liters per min
}

function maxSeconds() {
  const v = Number(process.env.VALVE_MAX_SECONDS);
  return Number.isFinite(v) && v > 0 ? v : 600; // max seconds
}

function litersToSeconds(liters) {
  return Math.min(maxSeconds(), Math.max(1, Math.round((liters / flowLpm()) * 60)));
}

function logTime(d = new Date()) {
  return d.toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', ' ·');
}

function getState() {
  return db.prepare('SELECT * FROM valve_state WHERE id = 1').get();
}

function secondsLeft(state = getState()) {
  if (!state.is_open || !state.open_until) return 0;
  return Math.max(0, Math.ceil((new Date(state.open_until).getTime() - Date.now()) / 1000));
}

function addNotification(category, icon, iconBg, title, desc) {
  db.prepare('INSERT INTO notifications (category, icon, icon_bg, title, desc) VALUES (?, ?, ?, ?, ?)').run(
    category, icon, iconBg, title, desc
  );
}

function open(seconds, reason, by) {
  const now = new Date();
  const until = new Date(now.getTime() + seconds * 1000);
  db.prepare('UPDATE valve_state SET is_open = 1, opened_at = ?, open_until = ?, reason = ?, opened_by = ? WHERE id = 1').run(
    now.toISOString(), until.toISOString(), reason, by
  );
  db.prepare("UPDATE switches SET value = 1 WHERE key = 'valve'").run();
  db.prepare('INSERT INTO logs (type, payload) VALUES (?, ?)').run(
    'valve',
    JSON.stringify({ time: logTime(now), action: 'Opened', duration: `${seconds}s planned`, reason, statusType: 'ok', by })
  );
}

// water by liters
function startWatering(liters, reason, by = 'Automation') {
  if (getState().is_open) return 'running';

  const { tankMinLevel } = require('./settings').getSettings();
  const tank = db.prepare('SELECT water_level FROM sensor_readings WHERE water_level IS NOT NULL ORDER BY id DESC LIMIT 1').get();
  if (tank && tank.water_level < tankMinLevel) {
    db.prepare('INSERT INTO logs (type, payload) VALUES (?, ?)').run(
      'valve',
      JSON.stringify({ time: logTime(), action: 'Blocked', duration: '—', reason: `${reason} — tank at ${tank.water_level}% (min ${tankMinLevel}%)`, statusType: 'danger', by })
    );
    return 'tank-low';
  }

  const seconds = litersToSeconds(liters);
  open(seconds, reason, by);
  addNotification('watered', 'water', 'blue', 'Watering started', `${reason} — ${liters}L (~${seconds}s)`);
  return 'started';
}

// manual open from app
function openManual(by) {
  if (getState().is_open) return;
  open(maxSeconds(), 'Manual override', by);
}

function closeValve(reasonForLog, by = 'Automation') {
  const state = getState();
  if (!state.is_open) return false;

  const ranFor = Math.round((Date.now() - new Date(state.opened_at).getTime()) / 1000);
  db.prepare('UPDATE valve_state SET is_open = 0, open_until = NULL WHERE id = 1').run();
  db.prepare("UPDATE switches SET value = 0 WHERE key = 'valve'").run();
  db.prepare('INSERT INTO logs (type, payload) VALUES (?, ?)').run(
    'valve',
    JSON.stringify({ time: logTime(), action: 'Closed', duration: `${ranFor}s`, reason: reasonForLog, statusType: 'ok', by })
  );
  if (state.reason !== 'Manual override') {
    const finished = reasonForLog === 'Run finished';
    addNotification(
      'watered', 'water', 'blue',
      finished ? 'Crop watered' : 'Watering stopped early',
      `${state.reason} — valve ran ${ranFor}s${finished ? '' : ` (${reasonForLog}${by ? ` by ${by}` : ''})`}`
    );
  }
  return true;
}

// close valve when time is up
function tick() {
  const state = getState();
  if (state.is_open && secondsLeft(state) === 0) closeValve('Run finished');
}

function startTimer() {
  tick();
  setInterval(tick, 1000);
}

module.exports = { startWatering, openManual, closeValve, getState, secondsLeft, startTimer, litersToSeconds, flowLpm, addNotification };
