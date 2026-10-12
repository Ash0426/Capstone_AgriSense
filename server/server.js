require('dotenv').config();
const express = require('express');
const cors = require('cors');

require('./db'); // setup tables first

const authRoutes = require('./routes/auth');
const sensorRoutes = require('./routes/sensors');
const switchRoutes = require('./routes/switches');
const logRoutes = require('./routes/logs');
const userRoutes = require('./routes/users');
const healthRoutes = require('./routes/health');
const farmRoutes = require('./routes/farm');
const deviceRoutes = require('./routes/device');
const valve = require('./lib/valve');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/switches', switchRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/users', userRoutes);
app.use('/api', healthRoutes);
app.use('/api', farmRoutes);
app.use('/api', deviceRoutes);

valve.startTimer();
require('./lib/automation').startScheduler();

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`AgriSense server running on http://0.0.0.0:${PORT}`);
  console.log('Find your computer\'s local IP (e.g. 192.168.x.x) and put it in config.js on the frontend.');
});
