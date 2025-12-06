
const express = require('express');
const router = express.Router();
const { getUserByName, addUser } = require('../models/user');
const getDb = require('../app').getDb;

// Pobierz użytkownika po nazwie (MySQL)
router.get('/user/:name', async (req, res) => {
  try {
    const db = await getDb();
    const user = await getUserByName(db, req.params.name);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'DB error', details: String(e) });
  }
});

// Dodaj użytkownika (MySQL)
router.post('/user', async (req, res) => {
  try {
    const { username, passwordHash, display_name, role } = req.body;
    const db = await getDb();
    const user = await addUser(db, { username, passwordHash, display_name, role });
    res.status(201).json(user);
  } catch (e) {
    res.status(500).json({ error: 'DB error', details: String(e) });
  }
});

module.exports = router;
