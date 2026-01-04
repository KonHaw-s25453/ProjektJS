# Dokumentacja: app.js

## Opis ogólny
Plik `app.js` to główny plik aplikacji backendowej w Node.js/Express. Konfiguruje serwer Express, middleware, połączenia z bazą danych, routing i obsługę błędów. Jest punktem wejścia dla API.

## Struktura pliku
- Obsługa błędów globalnych.
- Importy modułów.
- Konfiguracja Express.
- Middleware (JSON parsing, auth).
- Routing (mountowanie routerów).
- Endpointy główne (GET /, statystyki).
- Obsługa błędów.

## Szczegółowe wyjaśnienia linii/fragmentów

### Linie 1-9: Obsługa błędów globalnych
```javascript
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});
```
- `process.on('uncaughtException')`: Obsługuje niezłapane wyjątki, loguje i kończy proces z kodem 1.
- `process.on('unhandledRejection')`: Obsługuje niezłapane odrzucenia Promise, loguje i kończy proces.

### Linie 11-25: Importy
```javascript
const express = require('express');
// const rateLimit = require('express-rate-limit');
// const multer = require('multer');
const path = require('path');
// const cors = require('cors');
const fs = require('fs');
// const zlib = require('zlib');
require('dotenv').config();
// const cheerio = require('cheerio');
// // Konfiguracja Multer do uploadu plików
// const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit
```
- Import Express dla serwera.
- Komentowane importy dla rate limiting, multer (upload), cors, zlib (kompresja), cheerio (HTML parsing).
- `require('dotenv').config()`: Ładuje zmienne środowiskowe z .env.

### Linie 27-31: Importy własnych modułów
```javascript
const { authMiddleware } = require('./middleware/auth');
const authRouter = require('./routes/auth');
const patchesRouter = require('./routes/patches');
const adminRouter = require('./routes/admin');
const apiRouter = require('./routes/api');
```
- Import middleware autentyfikacji.
- Import routerów dla różnych endpointów.

### Linie 33-37: Zmienne globalne
```javascript
let dbPool = null;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const app = express();
```
- `dbPool`: Pula połączeń z bazą (inicjalizowana później).
- `JWT_SECRET`: Sekret dla JWT, z env lub domyślny.
- `app`: Instancja Express.

### Linie 39-58: Komentowane middleware (np. rate limiting, katalogi)
- Komentarze dla rate limiter (15 min, 100 żądań/IP).
- Tworzenie katalogów uploads/ i tmp_uploads/ jeśli nie istnieją.
- Logger żądań HTTP.

### Linie 60-67: Middleware JSON
```javascript
app.use((req, res, next) => { console.log('MIDDLEWARE: przed /auth json', req.method, req.url); next(); });
app.use('/auth', express.json());
app.use('/register', express.json());
app.use((req, res, next) => { console.log('MIDDLEWARE: po /auth json', req.method, req.url, 'body:', req.body); next(); });
```
- Logger przed/po parsowaniu JSON dla /auth i /register.
- `express.json()`: Parsuje JSON body tylko dla tych ścieżek.

### Linie 69-77: Globalne middleware i routing
```javascript
// Global auth middleware
app.use(authMiddleware);

// Mount routers for all main endpoints
console.log('Mounting routers...');
app.use(authRouter); // /register, /auth/login
console.log('authRouter mounted');
app.use('/api', apiRouter); // /api/user, /api/patch/:id
app.use('/admin', adminRouter); // /admin/users, /admin/logs, /admin/patches/:id, /admin/users/:id
app.use(patchesRouter); // /upload, /patches, ...
```
- `app.use(authMiddleware)`: Globalne middleware autentyfikacji dla wszystkich żądań.
- Mountowanie routerów: authRouter na /, apiRouter na /api, itp.

### Linie 79-100+: Endpoint główny GET /
```javascript
app.get('/', async (req, res) => {
  const db = await getDb();
  let stats = { patches: 0, users: 0, modules: 0 };
  // ... zapytania SQL dla statystyk
  res.json({ message: 'VCV Rack Patches API', stats });
});
```
- Asynchroniczny handler dla GET /.
- Pobiera połączenie z DB (`getDb()`).
- Inicjalizuje stats, wykonuje zapytania SQL dla liczby patchy, użytkowników, modułów.
- Zwraca JSON z wiadomością i statystykami.

### Reszta pliku: Dodatkowe endpointy, obsługa błędów
- Endpointy dla uploadu, pobierania plików.
- Middleware dla błędów 404 i 500.
- Funkcje pomocnicze jak `getDb()` dla połączenia z MySQL.

## Użycie
- Uruchamiany przez `server.js`: `node server.js`.
- Służy na porcie 3000 (lub env PORT).

## Potencjalne problemy
- Komentowane części (rate limit, multer) mogą wymagać odkomentowania dla pełnej funkcjonalności.
- Połączenie z DB może się nie powieść – obsługiwane przez `getDb()`.
- Middleware JSON tylko dla wybranych ścieżek – inne mogą wymagać własnego parsowania.