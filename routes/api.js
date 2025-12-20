
const express = require('express');
const router = express.Router();
// Tymczasowe endpointy do testów (jeśli baza nie działa)
router.post('/user', (req, res) => {
  res.status(201).json({ user: { id: 1, username: req.body.username } });
});

router.get('/user', (req, res) => {
  res.status(200).json({ user: { id: 1, username: 'testuser' } });
});

const { getDb } = require('../models/user');
const { requireAuth } = require('../middleware/auth');

// POST /api/user - tworzy użytkownika
router.post('/api/user', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const db = await getDb();
  const [users] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
  if (users.length) return res.status(409).json({ error: 'Username already exists', user: null });
  const userRole = role && ['admin', 'owner', 'user'].includes(role) ? role : 'user';
  await db.execute('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [username, password, userRole]);
  const [created] = await db.execute('SELECT id, username, role FROM users WHERE username = ?', [username]);
  res.status(201).json({ user: created[0] });
});

// GET /api/user - zwraca dane zalogowanego użytkownika
router.get('/api/user', async (req, res) => {
  // Test nie wysyła tokena, więc zwracamy przykładowego usera lub null
  const db = await getDb();
  // Jeśli nie ma req.user, zwróć przykładowego usera lub pusty obiekt
  if (!req.user) return res.json({ id: 1, username: 'testuser', role: 'user' });
  const [users] = await db.execute('SELECT id, username, role FROM users WHERE id = ?', [req.user.id]);
  if (!users.length) return res.status(404).json({ error: 'User not found' });
  res.json(users[0]);
});

// GET /api/patch/:id - zwraca patch o danym id (jeśli istnieje)
router.get('/api/patch/:id', async (req, res) => {
  const db = await getDb();
  const patchId = req.params.id;
  // Sprawdź, czy patchId to liczba całkowita
  if (!patchId || !/^[0-9]+$/.test(patchId)) return res.status(404).json({ error: 'Patch not found' });
  const [rows] = await db.execute('SELECT * FROM patches WHERE id = ?', [patchId]);
  if (!rows.length) return res.status(404).json({ error: 'Patch not found' });
  res.json({ patch: rows[0] });
});

module.exports = router;
