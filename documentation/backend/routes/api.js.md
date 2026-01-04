# Dokumentacja: routes/api.js

## Opis ogólny
Plik `routes/api.js` definiuje endpointy API dla użytkowników i patchów. Zawiera tymczasowe endpointy testowe oraz główne endpointy dla tworzenia użytkowników, pobierania danych użytkownika i patchów.

## Struktura pliku
- Importy: express, getDb, requireAuth.
- Router Express.
- Tymczasowe endpointy: POST /user, GET /user.
- Główne endpointy: POST /api/user, GET /api/user, GET /api/patch/:id.
- Eksport: router.

## Szczegółowe wyjaśnienia linii/fragmentów

### Linie 1-9: Importy i tymczasowe endpointy
```javascript
const express = require('express');
const router = express.Router();
// Tymczasowe endpointy do testów (jeśli baza nie działa)
router.post('/user', (req, res) => {
  res.status(201).json({ user: { id: 1, username: req.body.username } });
});

router.get('/user', (req, res) => {
  res.status(200).json({ user: { id: 1, username: 'testuser' } });
});
```
- Import express i tworzenie routera.
- Komentarz o tymczasowych endpointach dla testów.
- POST /user: Zwraca przykładowego usera z id 1 i username z request body.
- GET /user: Zwraca statycznego usera 'testuser'.

### Linie 11-12: Importy DB i auth
```javascript
const { getDb } = require('../models/user');
const { requireAuth } = require('../middleware/auth');
```
- Import getDb dla dostępu do DB.
- Import requireAuth dla middleware autoryzacji.

### Linie 14-22: POST /api/user
```javascript
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
```
- Komentarz opisuje endpoint.
- Wyciąga username, password, role z req.body.
- Waliduje obecność username i password (400 jeśli brak).
- Pobiera DB.
- Sprawdza istniejącego użytkownika (SELECT id).
- Jeśli istnieje, 409 Conflict.
- Ustawia rolę: jeśli podana i prawidłowa, używa jej, inaczej 'user'.
- Wstawia użytkownika (INSERT), ale password nie jest haszowane! (problem).
- Pobiera utworzonego użytkownika (SELECT).
- Zwraca 201 z userem.

### Linie 24-33: GET /api/user
```javascript
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
```
- Komentarz.
- Komentarze o testach.
- Pobiera DB.
- Jeśli req.user nie istnieje (brak tokena), zwraca przykładowego usera.
- W przeciwnym razie SELECT po id z req.user.id.
- Jeśli nie znaleziono, 404.
- Zwraca dane usera.

### Linie 35-44: GET /api/patch/:id
```javascript
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
```
- Komentarz.
- Pobiera DB.
- Wyciąga patchId z params.
- Waliduje, czy patchId jest liczbą całkowitą (regex /^[0-9]+$/).
- Jeśli nie, 404.
- SELECT * FROM patches WHERE id = ?.
- Jeśli brak, 404.
- Zwraca patch.

### Linie 46-52: Eksport
```javascript
module.exports = router;
```
- Eksportuje router.

## Użycie
- Mountowany w app.js jako app.use('/api', apiRouter).
- Endpointy: POST /api/user, GET /api/user, GET /api/patch/:id, oraz tymczasowe /user.

## Potencjalne problemy
- POST /api/user: Password nie jest haszowany przed INSERT, co jest poważnym błędem bezpieczeństwa.
- Role: W DB role to prawdopodobnie number, ale tutaj string, niezgodność typów.
- Tymczasowe endpointy: Mogą powodować zamieszanie, powinny być usunięte w produkcji.
- Brak autoryzacji: Endpointy nie używają requireAuth, więc publiczne.
- SQL injection: Używa prepared statements, bezpieczne.</content>
<parameter name="filePath">c:\Users\konhaw\Desktop\Uczelnia\JS\ProjektJS\documentation\backend\routes\api.js.md