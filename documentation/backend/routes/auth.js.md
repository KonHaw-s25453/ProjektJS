# Dokumentacja: routes/auth.js

## Opis ogólny
Plik `routes/auth.js` definiuje endpointy dla rejestracji i logowania użytkowników. Używa Express router, bcrypt dla haszy haseł, JWT dla tokenów i MySQL dla bazy danych.

## Struktura pliku
- Importy: Express, bcrypt, jwt, getDb, JWT_SECRET.
- Router Express.
- Endpointy: POST /register, POST /auth/login.

## Szczegółowe wyjaśnienia linii/fragmentów

### Linie 1-15: Importy i konfiguracja
```javascript
const express = require('express');
const router = express.Router();
// Komentowane: logger dla routera
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../models/user');
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
```
- `express.Router()`: Tworzy instancję routera dla grupowania endpointów.
- `bcrypt`: Do haszowania haseł.
- `jsonwebtoken`: Do generowania JWT tokenów.
- `getDb`: Funkcja do połączenia z DB z models/user.js.
- `JWT_SECRET`: Sekret dla JWT.

### Linie 17-37: POST /register
```javascript
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
});
```
- Asynchroniczny handler dla POST /register.
- Loguje request body.
- Waliduje obecność username i password (400 jeśli brak).
- Pobiera połączenie DB.
- Sprawdza, czy username już istnieje (SELECT id FROM users WHERE username = ?).
- Jeśli istnieje, 409 Conflict.
- Haszuje password z bcrypt (salt rounds 10).
- Wstawia nowego użytkownika (INSERT INTO users), domyślna rola 1 (user).
- Zwraca { ok: true }.
- Catch: loguje błąd, 500 Internal Server Error.

### Linie 39-51: POST /auth/login
```javascript
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
```
- Handler dla POST /auth/login.
- Waliduje username/password.
- Pobiera DB, SELECT * FROM users WHERE username = ?.
- Jeśli brak użytkownika, 401 Unauthorized.
- Porównuje hasło z bcrypt.compare.
- Jeśli nieprawidłowe, 401.
- Generuje JWT token z payload { id, username, role }, expiresIn '12h'.
- Zwraca { token, user: { id, username, role } }.

## Użycie
- Mountowany w app.js jako `app.use(authRouter)`.
- Endpointy: POST /register, POST /auth/login.

## Potencjalne problemy
- SQL injection: Używa prepared statements (? placeholders), bezpieczne.
- Błędy DB: Obsługiwane przez try/catch.
- JWT_SECRET: Powinien być w .env, nie hardcoded.
- Role: Domyślna 1, ale może wymagać mapowania (np. 1=user, 2=admin).