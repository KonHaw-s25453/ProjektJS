// Endpointy administracyjne: /admin/users, /admin/logs, /users/:id
const express = require('express');
const router = express.Router();
const { getDb } = require('../models/user');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /admin/users - lista użytkowników (tylko admin)
router.get('/admin/users', requireAuth, requireRole('admin'), async (req, res) => {
  const db = await getDb();
  const [users] = await db.execute('SELECT id, username, role FROM users');
  res.json(users);
});

// GET /admin/logs - przykładowe logi (tylko owner)
router.get('/admin/logs', requireAuth, requireRole('owner'), async (req, res) => {
  // Zwraca przykładową listę logów
  res.json([
    { id: 1, message: 'Log 1', date: new Date().toISOString() },
    { id: 2, message: 'Log 2', date: new Date().toISOString() }
  ]);
});

// GET /users/:id - szczegóły użytkownika (admin lub sam użytkownik)
router.get('/users/:id', requireAuth, async (req, res) => {
  const db = await getDb();
  const userId = req.params.id;
  // Admin może pobrać dowolnego, user tylko siebie
  if (req.user.role !== 'admin' && req.user.id != userId) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  const [users] = await db.execute('SELECT id, username, role FROM users WHERE id = ?', [userId]);
  if (!users.length) return res.status(404).json({ error: 'User not found' });
  res.json(users[0]);
});

module.exports = router;
