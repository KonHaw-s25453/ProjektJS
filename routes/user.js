const express = require('express');
const router = express.Router();
const { getUserByName, addUser } = require('../models/user');

// Przykładowa trasa pobierania użytkownika po nazwie
router.get('/user/:name', (req, res) => {
  const user = getUserByName(req.params.name);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Przykładowa trasa dodawania użytkownika
router.post('/user', (req, res) => {
  const { name, passwordHash } = req.body;
  const user = addUser({ name, passwordHash });
  res.status(201).json(user);
});

module.exports = router;
