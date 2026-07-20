// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

require('./db'); // runs schema creation + seeding before anything else touches the DB

const authRoutes = require('./routes/auth');
const sensorRoutes = require('./routes/sensors');
const switchRoutes = require('./routes/switches');
const scheduleRoutes = require('./routes/schedule');
const logRoutes = require('./routes/logs');
const notificationRoutes = require('./routes/notifications');
const userRoutes = require('./routes/users');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/switches', switchRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

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
