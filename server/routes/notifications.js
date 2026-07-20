// server/routes/notifications.js
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM notifications ORDER BY id DESC LIMIT 50').all();
  res.json(
    rows.map((r) => ({
      id: r.id,
      icon: r.icon,
      iconBg: r.icon_bg,
      title: r.title,
      desc: r.desc,
      time: new Date(r.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    }))
  );
});

module.exports = router;
