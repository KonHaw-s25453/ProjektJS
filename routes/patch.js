const express = require('express');
const router = express.Router();
const { getPatchById, addPatch } = require('../models/patch');

// Przykładowa trasa pobierania patcha po ID
router.get('/patch/:id', (req, res) => {
  const patch = getPatchById(req.params.id);
  if (!patch) return res.status(404).json({ error: 'Patch not found' });
  res.json(patch);
});

// Przykładowa trasa dodawania patcha
router.post('/patch', (req, res) => {
  const { user_name, category_id, file_path, description } = req.body;
  const patch = addPatch({ user_name, category_id, file_path, description });
  res.status(201).json(patch);
});

module.exports = router;
