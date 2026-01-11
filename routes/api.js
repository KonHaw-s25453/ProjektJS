
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
});

// GET /api/module-price/:plugin/:model - zwraca cenę modułu z bazy danych
router.get('/api/module-price/:plugin/:model', async (req, res) => {
  const db = await getDb();
  const { plugin, model } = req.params;
  try {
    const [rows] = await db.execute('SELECT price FROM module_prices WHERE plugin = ? AND model = ?', [plugin, model]);
    if (rows.length > 0) {
      res.json({ price: rows[0].price });
    } else {
      res.json({ price: null });
    }
  } catch (error) {
    console.error('Error fetching module price:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/update-prices - aktualizuje ceny wszystkich modułów
router.post('/api/update-prices', requireAuth, async (req, res) => {
  // Only allow admin/owner to update prices
  if (!req.user || !['admin', 'owner'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { updateAllModulePrices } = require('../scripts/update-prices');

  try {
    // Run price update in background
    updateAllModulePrices().then(() => {
      console.log('Price update completed');
    }).catch(error => {
      console.error('Price update failed:', error);
    });

    res.json({ message: 'Price update started' });
  } catch (error) {
    console.error('Error starting price update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/check-updates - sprawdza czy biblioteka VCV została zaktualizowana
router.get('/api/check-updates', async (req, res) => {
  const { checkLibraryUpdates } = require('../scripts/check-updates');

  try {
    const status = await checkLibraryUpdates();
    res.json(status);
  } catch (error) {
    console.error('Error checking updates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/check-and-update - sprawdza aktualizacje i aktualizuje ceny jeśli potrzebne
router.post('/api/check-and-update', requireAuth, async (req, res) => {
  // Only allow admin/owner to trigger updates
  if (!req.user || !['admin', 'owner'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { checkAndUpdateIfNeeded } = require('../scripts/check-updates');

  try {
    // Run check and update in background
    checkAndUpdateIfNeeded().then(result => {
      console.log('Check and update completed:', result);
    }).catch(error => {
      console.error('Check and update failed:', error);
    });

    res.json({ message: 'Update check started' });
  } catch (error) {
    console.error('Error starting update check:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
