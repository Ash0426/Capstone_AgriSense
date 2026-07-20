// server/routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, color: u.color };
}

// GET /api/users/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(publicUser(user));
});

// PATCH /api/users/me
router.patch('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { name, email, password, role, color } = req.body;
  const nextName = name ?? user.name;
  const nextEmail = (email ?? user.email).toLowerCase().trim();
  const nextRole = role ?? user.role;
  const nextColor = color ?? user.color;
  const nextHash = password ? bcrypt.hashSync(password, 10) : user.password_hash;

  db.prepare('UPDATE users SET name = ?, email = ?, password_hash = ?, role = ?, color = ? WHERE id = ?').run(
    nextName, nextEmail, nextHash, nextRole, nextColor, user.id
  );

  db.prepare('INSERT INTO user_activity (user_id, action) VALUES (?, ?)').run(user.id, 'Updated profile');

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  res.json(publicUser(updated));
});

// GET /api/users/me/activity
router.get('/me/activity', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM user_activity WHERE user_id = ? ORDER BY id DESC LIMIT 50')
    .all(req.userId);
  res.json(
    rows.map((r) => ({
      id: r.id,
      action: r.action,
      time: new Date(r.created_at).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: 'numeric', minute: '2-digit' }),
    }))
  );
});

module.exports = router;
