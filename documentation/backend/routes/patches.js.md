# Dokumentacja: routes/patches.js

## Opis ogólny
Plik `routes/patches.js` definiuje router Express dla zarządzania patchami VCV Rack. Obsługuje upload plików .vcv, parsowanie (JSON/zlib/zstd), ekstrakcję modułów, obliczanie cen, listowanie patchy, pobieranie szczegółów, tagowanie i inne operacje. Używa Multer do uploadu, zlib/@mongodb-js/zstd do dekompresji, oraz MySQL do przechowywania danych.

## Struktura pliku
- Importy: Express, Multer, fs, zlib, decompress, path, middleware, models.
- Konfiguracja: tmpUploadsDir, upload Multer.
- Router: express.Router().
- Middleware: Logowanie wejść.
- Endpointy: /upload (główny), /upload/test (testowy), / (lista patchy), /:id (szczegóły), /:id/tag (tagowanie), /:id/download (pobieranie).
- Funkcje pomocnicze: extractModules, uploadSingleWithLog.

## Szczegółowe wyjaśnienia linii/fragmentów

### Linie 1-10: Importy
```javascript
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const zlib = require('zlib');
const { decompress } = require('@mongodb-js/zstd');
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const { getDb } = require('../models/user');
```
- Import Express dla routera.
- Multer: Obsługa uploadu plików.
- fs, zlib, decompress: Odczyt plików, dekompresja (zlib dla gzip, zstd dla skompresowanych .vcv).
- path: Ścieżki plików.
- requireAuth: Middleware autentyfikacji.
- getDb: Funkcja do połączenia z DB.

### Linie 12-15: Konfiguracja Multer
```javascript
const tmpUploadsDir = path.join(__dirname, '..', 'tmp_uploads');
const upload = multer({ dest: tmpUploadsDir, limits: { fileSize: 10 * 1024 * 1024 } });
```
- tmpUploadsDir: Katalog tymczasowy dla uploadów (tmp_uploads/).
- upload: Konfiguracja Multer z limitem 10MB.

### Linie 17-22: Inicjalizacja routera i middleware
```javascript
const router = express.Router();
router.use((req, res, next) => {
  console.log('PATCHES ROUTER: wejście', req.method, req.url);
  next();
});
```
- Router Express.
- Middleware logujące każde wejście do routera.

### Linie 24-140+: Endpoint POST /upload
Główny endpoint do uploadu patchy .vcv. Wymaga autentyfikacji, używa Multer, parsuje plik (JSON/zlib/zstd), ekstrahuje moduły, oblicza cenę, zapisuje w DB.

- **Walidacja**: Sprawdza użytkownika, plik, rozszerzenie .vcv.
- **Odczyt i parsowanie**: Próbuje JSON, potem zlib, potem zstd.
- **Ekstrakcja modułów**: Funkcja extractModules wyciąga listę modułów z parsed JSON.
- **Opis automatyczny**: Jeśli nie podano, generuje na podstawie modułów.
- **Cena**: Sumuje ceny płatnych modułów z tabeli module_prices.
- **Zapis w DB**: Transakcja INSERT do patches, modules, patch_modules.

### Linie 142-160: Endpoint POST /upload/test
Testowy endpoint do debugowania uploadu. Używa Multer bez autentyfikacji, zwraca potwierdzenie pliku.

### Linie 162-200+: Funkcja uploadSingleWithLog
Wrapper dla Multer.single(), loguje błędy i callbacki.

### Linie 200+: Endpoint GET /
Zwraca listę patchy z paginacją, filtrami (kategoria, użytkownik), dołącza moduły i tagi.

### Linie 300+: Endpoint GET /:id
Zwraca szczegóły patcha po ID, dołącza moduły, tagi, cenę.

### Linie 350+: Endpoint POST /:id/tag
Dodaje tag do patcha (wymaga autentyfikacji właściciela lub admina).

### Linie 400+: Endpoint GET /:id/download
Pobiera plik patcha.

## Użycie
- Mountowany w app.js jako /patches.
- Przykład: POST /patches/upload z plikiem .vcv i opcjonalnymi polami (category, description).
- Używany przez frontend do uploadu, przeglądania i tagowania patchy.

## Potencjalne problemy
- Dekompresja: Pliki mogą być uszkodzone lub zbyt duże (limit 20MB po dekompresji).
- DB: Transakcje mogą się nie powieść – obsługiwane przez rollback.
- Parsowanie: Jeśli plik nie jest JSON ani skompresowanym JSON, błąd 400.
- Uprawnienia: Tagowanie tylko przez właściciela lub admina.
- Wydajność: Duże pliki mogą obciążać serwer – limit 10MB.</content>
<parameter name="filePath">c:\Users\konhaw\Desktop\Uczelnia\JS\ProjektJS\documentation\backend\routes\patches.js.md