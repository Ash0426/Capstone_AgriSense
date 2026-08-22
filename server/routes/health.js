// server/routes/health.js
// Persists farmer-submitted lettuce health ratings (each paired with a sensor snapshot) and
// serves a Random Forest heat-stress prediction trained on that real, human-labeled data.
// No synthetic data — until enough ratings exist, /ml/heat-stress honestly reports that.
const express = require('express');
const { RandomForestClassifier } = require('ml-random-forest');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const RATINGS = ['Dried out', 'Drooping', 'Slight paleness', 'Good color and firmness', 'Vibrant green / firm and upright'];
const STRESSED_RATINGS = ['Dried out', 'Drooping'];

const MIN_TOTAL = 20;
const MIN_PER_CLASS = 5;
const FEATURE_NAMES = ['Air Temperature', 'Air Humidity', 'Soil Moisture'];

// POST /api/health-log
router.post('/health-log', requireAuth, (req, res) => {
  const { rating } = req.body;
  if (!RATINGS.includes(rating)) {
    return res.status(400).json({ error: `rating must be one of: ${RATINGS.join(', ')}` });
  }

  const latest = db.prepare('SELECT * FROM sensor_readings ORDER BY id DESC LIMIT 1').get();
  const stressed = STRESSED_RATINGS.includes(rating) ? 1 : 0;

  const result = db
    .prepare(
      'INSERT INTO health_logs (user_id, rating, stressed, air_temp, air_humidity, soil_moisture) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(req.userId, rating, stressed, latest?.air_temp ?? null, latest?.air_humidity ?? null, latest?.soil_moisture ?? null);

  db.prepare('INSERT INTO user_activity (user_id, action) VALUES (?, ?)').run(req.userId, `Logged lettuce health: ${rating}`);

  const row = db.prepare('SELECT * FROM health_logs WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

// GET /api/health-log
router.get('/health-log', requireAuth, (req, res) => {
  const limit = Number(req.query.limit) || 50;
  const rows = db.prepare('SELECT * FROM health_logs ORDER BY id DESC LIMIT ?').all(limit);
  res.json(rows);
});

// GET /api/ml/heat-stress
router.get('/ml/heat-stress', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      'SELECT rating, stressed, air_temp, air_humidity, soil_moisture FROM health_logs WHERE air_temp IS NOT NULL AND air_humidity IS NOT NULL AND soil_moisture IS NOT NULL'
    )
    .all();

  const total = rows.length;
  const stressedCount = rows.filter((r) => r.stressed === 1).length;
  const notStressedCount = total - stressedCount;

  if (total < MIN_TOTAL || stressedCount < MIN_PER_CLASS || notStressedCount < MIN_PER_CLASS) {
    return res.json({ status: 'insufficient-data', collected: total, required: MIN_TOTAL });
  }

  const latest = db.prepare('SELECT * FROM sensor_readings ORDER BY id DESC LIMIT 1').get();
  if (!latest) {
    return res.json({ status: 'insufficient-data', collected: total, required: MIN_TOTAL });
  }

  const X = rows.map((r) => [r.air_temp, r.air_humidity, r.soil_moisture]);
  const y = rows.map((r) => r.stressed);

  // Retrains on every request — the dataset stays small (one row per health check-in) so
  // this is fast and always reflects the latest ratings.
  // TODO: cache/retrain on a schedule instead if this dataset ever grows large.
  const rf = new RandomForestClassifier({ nEstimators: 50, seed: 42 });
  rf.train(X, y);

  const latestX = [latest.air_temp, latest.air_humidity, latest.soil_moisture];
  const probability = rf.predictProbability([latestX], 1)[0];

  let risk;
  if (probability < 0.33) risk = 'low';
  else if (probability < 0.66) risk = 'moderate';
  else risk = 'high';

  const importances = rf.featureImportance();
  const topIndex = importances.indexOf(Math.max(...importances));
  const topFactor = FEATURE_NAMES[topIndex] ?? FEATURE_NAMES[0];

  res.json({
    status: 'ok',
    risk,
    probability,
    trainedOn: total,
    topFactor,
    latestReading: { airTemp: latest.air_temp, airHumidity: latest.air_humidity, soilMoisture: latest.soil_moisture },
  });
});

module.exports = router;
