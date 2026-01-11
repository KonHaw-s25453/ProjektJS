// Endpointy rejestracji i logowania użytkowników
const express = require('express');
const router = express.Router();

// // Log na wejściu do routera
// router.use((req, res, next) => {
//   console.log('AUTH ROUTER:', req.method, req.url);
//   next();
// });

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../models/user');
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// POST /register { username, password }
router.post('/register', async (req, res) => {
  try {
    console.log('REGISTER REQUEST:', req.body);
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    console.log('Getting DB connection...');
    const db = await getDb();
    console.log('Checking existing user...');
    const [users] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (users.length) return res.status(409).json({ error: 'Username already exists' });
    console.log('Hashing password...');
    const hash = await bcrypt.hash(password, 10);
    console.log('Inserting user...');
    await db.execute('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [username, hash, 1]);
    console.log('User registered successfully');
    res.json({ ok: true });
  } catch (error) {
    console.error('REGISTER ERROR:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});// POST /auth/login { username, password }
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

const { requireAuth } = require('../middleware/auth');

// GET /api/user - get current user info
router.get('/api/user', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const [users] = await db.execute('SELECT id, username, email, display_name, role FROM users WHERE id = ?', [req.user.id]);
    if (!users.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: users[0] });
  } catch (error) {
    console.error('GET USER ERROR:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;