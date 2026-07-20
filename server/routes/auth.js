// server/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { sendOtpEmail } = require('../utils/mailer');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  db.prepare('INSERT INTO user_activity (user_id, action) VALUES (?, ?)').run(user.id, 'Logged in');

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, color: user.color },
  });
});

// POST /api/auth/forgot-password/request
router.post('/forgot-password/request', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  // Always respond 200 even if the user doesn't exist, so we don't leak which emails are registered.
  if (!user) return res.json({ message: 'OTP sent' });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO otps (email, code, expires_at) VALUES (?, ?, ?)').run(user.email, code, expiresAt);

  try {
    await sendOtpEmail(user.email, code);
  } catch (err) {
    console.error('Failed to send OTP email:', err.message);
    return res.status(500).json({ error: 'Could not send OTP email. Check server SMTP settings.' });
  }

  res.json({ message: 'OTP sent' });
});

// POST /api/auth/forgot-password/reset
router.post('/forgot-password/reset', (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ error: 'Email, otp, and newPassword are required' });

  const record = db
    .prepare('SELECT * FROM otps WHERE email = ? AND code = ? AND used = 0 ORDER BY id DESC LIMIT 1')
    .get(email.toLowerCase().trim(), otp);

  if (!record || new Date(record.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(hash, email.toLowerCase().trim());
  db.prepare('UPDATE otps SET used = 1 WHERE id = ?').run(record.id);

  res.json({ message: 'Password updated' });
});

module.exports = router;
