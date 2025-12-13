// Endpointy API: /api/user, /api/patch/:id
const express = require('express');
const router = express.Router();
const { getDb } = require('../models/user');
const { requireAuth } = require('../middleware/auth');

// POST /api/user - tworzy użytkownika
router.post('/api/user', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const db = await getDb();
  const [users] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
  if (users.length) return res.status(409).json({ error: 'Username already exists' });
  await db.execute('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [username, password, 'user']);
  const [created] = await db.execute('SELECT id, username, role FROM users WHERE username = ?', [username]);
  res.status(201).json({ user: created[0] });
});

// GET /api/user - zwraca dane zalogowanego użytkownika
router.get('/api/user', requireAuth, async (req, res) => {
  const db = await getDb();
  const [users] = await db.execute('SELECT id, username, role FROM users WHERE id = ?', [req.user.id]);
  if (!users.length) return res.status(404).json({ error: 'User not found' });
  res.json(users[0]);
});

// GET /api/patch/:id - zwraca patch o danym id (jeśli istnieje)
router.get('/api/patch/:id', async (req, res) => {
  const db = await getDb();
  const patchId = req.params.id;
  const [rows] = await db.execute('SELECT * FROM patches WHERE id = ?', [patchId]);
  if (!rows.length) return res.status(404).json({ error: 'Patch not found' });
  res.json({ patch: rows[0] });
});

module.exports = router;
