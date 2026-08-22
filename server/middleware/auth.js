// server/middleware/auth.js
// requireAuth checks for "Authorization: Bearer <token>" and attaches the decoded user id to
// req.userId — also rejects if that user has since been disabled (closes the gap where an
// already-issued 7-day JWT would otherwise keep working after an admin disables the account).
// requireAdmin (run after requireAuth) further restricts a route to Administrator accounts.
const jwt = require('jsonwebtoken');
const db = require('../db');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT disabled FROM users WHERE id = ?').get(decoded.userId);
    if (!user || user.disabled) return res.status(401).json({ error: 'Account disabled' });
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId);
  if (!user || user.role !== 'Administrator') return res.status(403).json({ error: 'Admin access required' });
  next();
}

module.exports = { requireAuth, requireAdmin };
