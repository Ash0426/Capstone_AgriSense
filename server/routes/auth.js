// server/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { sendOtpEmail, sendLoginOtpEmail } = require('../utils/mailer');

const router = express.Router();

const STEP_UP_DAYS = 3;
const MAX_PIN_ATTEMPTS = 5;
const MAX_OTP_ATTEMPTS = 5;
// Step-up tokens use a different secret so they can never be used as a normal session token.
const stepUpSecret = () => `${process.env.JWT_SECRET}:stepup`;
const otpFailures = new Map(); // userId -> wrong-code count

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, color: u.color, hasPin: !!u.pin_hash };
}

// A login needs an emailed OTP when the device is new to this account, or the account hasn't
// logged in for STEP_UP_DAYS or more.
function needsStepUp(user, deviceId) {
  if (!deviceId) return true;
  const known = db.prepare('SELECT 1 FROM user_devices WHERE user_id = ? AND device_id = ?').get(user.id, deviceId);
  if (!known) return true;
  if (!user.last_login_at) return true;
  return Date.now() - new Date(user.last_login_at).getTime() >= STEP_UP_DAYS * 24 * 60 * 60 * 1000;
}

function issueSession(user, deviceId) {
  const now = new Date().toISOString();
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  db.prepare('UPDATE users SET last_login_at = ?, pin_attempts = 0 WHERE id = ?').run(now, user.id);
  if (deviceId) {
    db.prepare(
      'INSERT INTO user_devices (user_id, device_id, last_login_at) VALUES (?, ?, ?) ON CONFLICT(user_id, device_id) DO UPDATE SET last_login_at = excluded.last_login_at'
    ).run(user.id, deviceId, now);
  }
  db.prepare('INSERT INTO user_activity (user_id, action) VALUES (?, ?)').run(user.id, 'Logged in');
  return { token, user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(user.id)) };
}

async function emailLoginOtp(user) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO otps (email, code, expires_at) VALUES (?, ?, ?)').run(user.email, code, expiresAt);
  otpFailures.delete(user.id);
  await sendLoginOtpEmail(user.email, code);
}

// POST /api/auth/login
// Body: { email, password } or { email, pin }, plus deviceId. If the device is new or the account
// has been idle 3+ days, no session is issued yet: a code is emailed and a short-lived
// stepUpToken is returned to finish with /login/verify-otp.
router.post('/login', async (req, res) => {
  const { email, password, pin, deviceId } = req.body;
  if (!email || (!password && !pin)) return res.status(400).json({ error: 'Email and password (or PIN) are required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: pin ? 'Invalid email or PIN' : 'Invalid email or password' });

  if (pin) {
    if (!user.pin_hash) return res.status(401).json({ error: 'No PIN is set for this account. Log in with your password.' });
    if (user.pin_attempts >= MAX_PIN_ATTEMPTS) {
      return res.status(423).json({ error: 'PIN locked after too many attempts. Log in with your password.' });
    }
    if (!bcrypt.compareSync(String(pin), user.pin_hash)) {
      db.prepare('UPDATE users SET pin_attempts = pin_attempts + 1 WHERE id = ?').run(user.id);
      return res.status(401).json({ error: 'Incorrect PIN' });
    }
  } else if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.disabled) return res.status(401).json({ error: 'This account has been disabled' });

  if (needsStepUp(user, deviceId)) {
    try {
      await emailLoginOtp(user);
    } catch (err) {
      console.error('Failed to send login OTP email:', err.message);
      return res.status(500).json({ error: 'Could not send the verification email. Check server SMTP settings.' });
    }
    const stepUpToken = jwt.sign({ userId: user.id, deviceId: deviceId || null }, stepUpSecret(), { expiresIn: '10m' });
    return res.json({ requiresStepUp: true, stepUpToken });
  }

  res.json({ requiresStepUp: false, ...issueSession(user, deviceId) });
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
  // A reset also clears the PIN lockout.
  db.prepare('UPDATE users SET password_hash = ?, pin_attempts = 0 WHERE email = ?').run(hash, email.toLowerCase().trim());
  db.prepare('UPDATE otps SET used = 1 WHERE id = ?').run(record.id);

  res.json({ message: 'Password updated' });
});

function readStepUpToken(token) {
  try {
    const decoded = jwt.verify(token || '', stepUpSecret());
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);
    return user && !user.disabled ? { user, deviceId: decoded.deviceId } : null;
  } catch {
    return null;
  }
}

// POST /api/auth/login/request-otp  — resend the code for an in-progress login.
router.post('/login/request-otp', async (req, res) => {
  const ctx = readStepUpToken(req.body.stepUpToken);
  if (!ctx) return res.status(401).json({ error: 'Login session expired. Please log in again.' });
  try {
    await emailLoginOtp(ctx.user);
  } catch (err) {
    console.error('Failed to send login OTP email:', err.message);
    return res.status(500).json({ error: 'Could not send the verification email. Check server SMTP settings.' });
  }
  res.json({ message: 'OTP sent' });
});

// POST /api/auth/login/verify-otp  — finishes a step-up login and issues the session.
router.post('/login/verify-otp', (req, res) => {
  const { otp, stepUpToken } = req.body;
  const ctx = readStepUpToken(stepUpToken);
  if (!ctx || !otp) return res.status(401).json({ error: 'Login session expired. Please log in again.' });
  const { user, deviceId } = ctx;

  const record = db
    .prepare('SELECT * FROM otps WHERE email = ? AND code = ? AND used = 0 ORDER BY id DESC LIMIT 1')
    .get(user.email, String(otp));

  if (!record || new Date(record.expires_at) < new Date()) {
    const fails = (otpFailures.get(user.id) || 0) + 1;
    otpFailures.set(user.id, fails);
    if (fails >= MAX_OTP_ATTEMPTS) {
      db.prepare('UPDATE otps SET used = 1 WHERE email = ?').run(user.email);
      otpFailures.delete(user.id);
      return res.status(429).json({ error: 'Too many wrong codes. Log in again to get a new one.' });
    }
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  db.prepare('UPDATE otps SET used = 1 WHERE id = ?').run(record.id);
  otpFailures.delete(user.id);
  res.json(issueSession(user, deviceId));
});

module.exports = router;
