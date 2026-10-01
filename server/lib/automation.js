// server/lib/automation.js
// Everything the hardware does on its own, driven only by values the farmer set in the app:
//
//   * onReading()     — after each ESP32 reading: tank-low warning, roof auto rules, and
//                       limit watering (soil below its limit / temperature above its limit)
//   * scheduleTick()  — every 20 s: runs each weekday's watering at the time + amount set on
//                       the Weekly Weather screen (if the Schedule switch is on)
//
// Nothing here is hard-coded: limits come from automation_limits, the schedule from
// watering_schedule, and tank/rain/roof rules from hardware_settings.
const db = require('../db');
const valve = require('./valve');
const { getSettings } = require('./settings');

const ROOF_TEMP_HYSTERESIS = 1; // °C — reopen only once it's 1°C below the close limit, so the roof doesn't flap
const SCHEDULE_WINDOW_MIN = 15; // run a missed schedule up to 15 min late (e.g. after a server restart)

let limitBreachActive = false;
let tankLowActive = false;

function switchOn(key) {
  return !!db.prepare('SELECT value FROM switches WHERE key = ?').get(key)?.value;
}

function logTime(d = new Date()) {
  return d.toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', ' ·');
}

function isRaining(reading, s = getSettings()) {
  return reading != null && reading.rain != null && reading.rain >= s.rainThreshold;
}

// Moves the roof (the ESP32 follows switches.roof on its next poll) and logs it.
function setRoof(open, by, reason) {
  if (switchOn('roof') === open) return false;
  db.prepare("UPDATE switches SET value = ? WHERE key = 'roof'").run(open ? 1 : 0);
  const latest = db.prepare('SELECT air_temp FROM sensor_readings ORDER BY id DESC LIMIT 1').get();
  db.prepare('INSERT INTO logs (type, payload) VALUES (?, ?)').run(
    'roof',
    JSON.stringify({
      time: logTime(),
      action: open ? 'Open' : 'Closed',
      tempGauge: latest ? `${latest.air_temp}°C` : '—',
      reason,
      statusType: open ? 'ok' : 'danger',
      by,
    })
  );
  return true;
}

function roofAuto(reading, s) {
  if (s.roofMode !== 'auto') return;
  const roofOpen = switchOn('roof');
  const raining = s.roofCloseOnRain && isRaining(reading, s);
  const hasTemp = reading.airTemp != null;
  const tooHot = hasTemp && reading.airTemp > s.roofCloseTemp;
  const coolEnough = !hasTemp || reading.airTemp <= s.roofCloseTemp - ROOF_TEMP_HYSTERESIS;

  if (roofOpen && (tooHot || raining)) {
    setRoof(false, 'Automation', tooHot ? `Temperature ${reading.airTemp}°C above ${s.roofCloseTemp}°C` : 'Rain detected');
  } else if (!roofOpen && !raining && coolEnough) {
    setRoof(true, 'Automation', 'Conditions back to normal');
  }
}

function tankCheck(reading, s) {
  if (reading.waterLevel == null) return;
  if (reading.waterLevel < s.tankMinLevel) {
    if (!tankLowActive) {
      tankLowActive = true;
      valve.addNotification('tank-low', 'alert-circle', 'amber', 'Water tank level low',
        `Tank at ${reading.waterLevel}% (your minimum is ${s.tankMinLevel}%) — refill soon. Watering is paused.`);
    }
  } else {
    tankLowActive = false;
  }
}

function limitWatering(reading) {
  const limits = db.prepare('SELECT * FROM automation_limits WHERE id = 1').get();
  const soilBreach = reading.soilMoisture != null && reading.soilMoisture < limits.soil_moisture_limit;
  const tempBreach = reading.airTemp != null && reading.airTemp > limits.temp_limit;

  if (!(soilBreach || tempBreach)) {
    limitBreachActive = false;
    return;
  }
  if (limitBreachActive) return; // water once per breach, not on every reading while it stays breached
  limitBreachActive = true;

  const reason = soilBreach
    ? `Soil moisture (${reading.soilMoisture}%) is below your ${limits.soil_moisture_limit}% limit`
    : `Temperature (${reading.airTemp}°C) is above your ${limits.temp_limit}°C limit`;
  valve.addNotification('limit-exceeded', 'warning', 'amber', 'Automation limit exceeded', reason);
  valve.startWatering(limits.override_amount_liters, reason, 'Automation');
}

// reading: only the values the board actually measured this time (others undefined).
function onReading(reading) {
  const s = getSettings();
  tankCheck(reading, s);
  roofAuto(reading, s);
  limitWatering(reading);
}

// ---- Weekly schedule ----

// Accepts "06:00", "6:00", "6:00 AM", "18:30", "6:30pm". Returns minutes after midnight or null.
function parseTime(text) {
  const m = String(text).trim().match(/^(\d{1,2}):(\d{2})\s*([aApP][mM])?$/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ampm = m[3]?.toLowerCase();
  if (min > 59 || h > 23 || (ampm && (h < 1 || h > 12))) return null;
  if (ampm === 'pm' && h !== 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;
  return h * 60 + min;
}

function localDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function scheduleTick(now = new Date()) {
  const day = now.toLocaleDateString('en-US', { weekday: 'short' }); // 'Mon'..'Sun' in the laptop's time zone
  const row = db.prepare('SELECT * FROM watering_schedule WHERE day = ?').get(day);
  if (!row) return;

  const at = parseTime(row.time);
  const today = localDate(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (at == null || row.last_run_date === today) return;
  if (nowMin < at || nowMin > at + SCHEDULE_WINDOW_MIN) return;

  const markDone = () => db.prepare('UPDATE watering_schedule SET last_run_date = ? WHERE day = ?').run(today, day);

  if (!switchOn('timer')) return; // schedule switched off in the app — don't mark, so turning it back on within the window still runs

  if (!(row.amount_liters > 0)) {
    markDone();
    return;
  }

  const latest = db.prepare('SELECT rain FROM sensor_readings ORDER BY id DESC LIMIT 1').get();
  if (switchOn('skipRain') && isRaining(latest)) {
    markDone();
    valve.addNotification('watered', 'rainy', 'blue', 'Scheduled watering skipped', `${day} ${row.time} — rain detected (${latest.rain}%)`);
    db.prepare('INSERT INTO logs (type, payload) VALUES (?, ?)').run(
      'valve',
      JSON.stringify({ time: logTime(now), action: 'Skipped', duration: '—', reason: `Scheduled ${row.time} — raining`, statusType: 'warn', by: 'Schedule' })
    );
    return;
  }

  const result = valve.startWatering(row.amount_liters, `Scheduled watering (${day} ${row.time})`, 'Schedule');
  if (result !== 'running') markDone(); // if another run is going, try again on the next tick
}

function startScheduler() {
  scheduleTick();
  setInterval(scheduleTick, 20 * 1000);
}

module.exports = { onReading, setRoof, startScheduler, scheduleTick, parseTime, isRaining };
