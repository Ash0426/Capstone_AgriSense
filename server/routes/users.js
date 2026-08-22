// server/routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, color: u.color };
}

// Full record shown in the admin Users list — includes the hashed password, on purpose.
function adminUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    password_hash: u.password_hash,
    disabled: !!u.disabled,
    created_at: u.created_at,
  };
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

// ---- Admin-only user management ----

// GET /api/users  (admin)
router.get('/', requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM users ORDER BY id ASC').all();
  res.json(rows.map(adminUser));
});

// POST /api/users  (admin)
router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) return res.status(409).json({ error: 'A user with that email already exists' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name.trim(), email.toLowerCase().trim(), hash, role === 'Administrator' ? 'Administrator' : 'User');

  db.prepare('INSERT INTO user_activity (user_id, action) VALUES (?, ?)').run(req.userId, `Created user: ${name.trim()}`);

  const created = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(adminUser(created));
});

// PATCH /api/users/:id  (admin)
router.patch('/:id', requireAuth, requireAdmin, (req, res) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });

  const { name, email, role, disabled } = req.body;
  const nextName = name ?? target.name;
  const nextEmail = (email ?? target.email).toLowerCase().trim();
  const nextRole = role ?? target.role;
  const nextDisabled = typeof disabled === 'boolean' ? (disabled ? 1 : 0) : target.disabled;

  db.prepare('UPDATE users SET name = ?, email = ?, role = ?, disabled = ? WHERE id = ?').run(
    nextName, nextEmail, nextRole, nextDisabled, target.id
  );

  db.prepare('INSERT INTO user_activity (user_id, action) VALUES (?, ?)').run(
    req.userId,
    `${typeof disabled === 'boolean' ? (disabled ? 'Disabled' : 'Enabled') : 'Updated'} user: ${nextName}`
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(target.id);
  res.json(adminUser(updated));
});

// DELETE /api/users/:id  (admin)
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.userId) return res.status(400).json({ error: "You can't delete your own account" });

  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
  if (!target) return res.status(404).json({ error: 'User not found' });

  // user_activity/health_logs reference this user via a foreign key — clear the target's
  // own rows first (their audit trail goes with them) so the delete itself doesn't fail.
  const deleteUser = db.transaction(() => {
    db.prepare('DELETE FROM user_activity WHERE user_id = ?').run(targetId);
    db.prepare('DELETE FROM health_logs WHERE user_id = ?').run(targetId);
    db.prepare('DELETE FROM users WHERE id = ?').run(targetId);
    db.prepare('INSERT INTO user_activity (user_id, action) VALUES (?, ?)').run(req.userId, `Deleted user: ${target.name}`);
  });
  deleteUser();

  res.json({ message: 'User deleted' });
});

module.exports = router;
