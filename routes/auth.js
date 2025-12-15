// Endpointy rejestracji i logowania użytkowników
const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../models/user');
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// POST /register { username, password }
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const db = await getDb();
  const [users] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
  if (users.length) return res.status(409).json({ error: 'Username already exists' });
  const hash = await bcrypt.hash(password, 8);
  await db.execute('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [username, hash, 'user']);
  res.json({ ok: true });
});

// POST /auth/login { username, password }
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const db = await getDb();
  const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
  if (!users.length) return res.status(401).json({ error: 'Invalid credentials' });
  const user = users[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

module.exports = router;