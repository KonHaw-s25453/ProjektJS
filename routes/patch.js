
const express = require('express');
const router = express.Router();
const { getPatchById, addPatch } = require('../models/patch');
const getDb = require('../app').getDb;

// Pobierz patch po ID (MySQL)
router.get('/patch/:id', async (req, res) => {
  try {
    const db = await getDb();
    const patch = await getPatchById(db, req.params.id);
    if (!patch) return res.status(404).json({ error: 'Patch not found' });
    res.json(patch);
  } catch (e) {
    res.status(500).json({ error: 'DB error', details: String(e) });
  }
});

// Dodaj patch (MySQL)
router.post('/patch', async (req, res) => {
  try {
    const { user_name, category_id, file_path, description } = req.body;
    const db = await getDb();
    const patch = await addPatch(db, { user_name, category_id, file_path, description });
    res.status(201).json(patch);
  } catch (e) {
    res.status(500).json({ error: 'DB error', details: String(e) });
  }
});

module.exports = router;
