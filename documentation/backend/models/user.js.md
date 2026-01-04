# Dokumentacja: models/user.js

## Opis ogólny
Plik `models/user.js` zawiera funkcję do tworzenia i zarządzania pulą połączeń z bazą danych MySQL. Używa mysql2/promise dla asynchronicznych operacji.

## Struktura pliku
- Import: mysql2/promise.
- Zmienna globalna dbPool.
- Funkcja getDb(): Tworzy pulę połączeń jeśli nie istnieje.
- Eksport: { getDb }.

## Szczegółowe wyjaśnienia linii/fragmentów

### Linie 1-3: Import i zmienna globalna
```javascript
// Model użytkownika i dostęp do bazy
const mysql = require('mysql2/promise');

let dbPool = null;
```
- Komentarz opisuje cel pliku.
- Importuje mysql2/promise dla obsługi MySQL z promisami.
- dbPool: Zmienna do przechowywania puli połączeń, inicjalizowana jako null.

### Linie 4-20: Funkcja getDb
```javascript
async function getDb() {
  if (!dbPool) {
    try {
      dbPool = await mysql.createPool({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'vcv',
        port: process.env.DB_PORT || 3306,
      });
      global.dbPool = dbPool;
      console.log('Database pool created successfully');
    } catch (error) {
      console.error('Error creating database pool:', error);
      throw error;
    }
  }
  return dbPool;
}
```
- Asynchroniczna funkcja getDb().
- Sprawdza, czy dbPool już istnieje; jeśli nie, tworzy nową pulę.
- Używa zmiennych środowiskowych dla konfiguracji DB, z domyślnymi wartościami.
- Ustawia global.dbPool dla dostępu globalnego.
- Loguje sukces lub błąd.
- W przypadku błędu, rzuca wyjątek.
- Zwraca dbPool.

### Linie 22: Eksport
```javascript
module.exports = { getDb };
```
- Eksportuje funkcję getDb jako moduł.

## Użycie
- Importowany w routes/auth.js i innych miejscach dla dostępu do DB.
- Wywołanie: const db = await getDb(); następnie db.execute() itp.

## Potencjalne problemy
- Singleton pattern: dbPool jest globalny, co może powodować problemy w testach lub środowiskach wielowątkowych.
- Zmienne środowiskowe: Jeśli nie ustawione, używa domyślnych, co może być niebezpieczne w produkcji.
- Brak zamknięcia puli: Nie ma funkcji do zamknięcia puli, co może prowadzić do wycieków zasobów.
- Błędy połączenia: Jeśli DB niedostępna, aplikacja może się zawiesić przy pierwszym wywołaniu.</content>
<parameter name="filePath">c:\Users\konhaw\Desktop\Uczelnia\JS\ProjektJS\documentation\backend\models\user.js.md