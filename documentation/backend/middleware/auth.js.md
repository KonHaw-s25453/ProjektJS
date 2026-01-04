# Dokumentacja: middleware/auth.js

## Opis ogólny
Plik `middleware/auth.js` zawiera middleware dla autoryzacji użytkowników przy użyciu JWT tokenów. Obejmuje sprawdzanie tokenów, wymaganie logowania i sprawdzanie ról.

## Struktura pliku
- Importy: jsonwebtoken, JWT_SECRET.
- Funkcje: authMiddleware, requireAuth, requireRole.
- Eksport: Wszystkie funkcje.

## Szczegółowe wyjaśnienia linii/fragmentów

### Linie 1-3: Importy
```javascript
// Middleware do autoryzacji JWT i ról użytkowników
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
```
- Komentarz opisuje cel.
- Importuje jsonwebtoken dla obsługi JWT.
- JWT_SECRET: Sekret z env lub domyślny.

### Linie 5-15: authMiddleware
```javascript
// Sprawdza JWT w nagłówku Authorization: Bearer <token>
function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return next();
  try {
    const token = auth.slice(7);
    req.user = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    req.user = null;
  }
  next();
}
```
- Middleware do sprawdzania JWT.
- Sprawdza nagłówek Authorization na obecność Bearer token.
- Jeśli brak, przechodzi dalej bez ustawiania req.user.
- Wyciąga token, weryfikuje z jwt.verify.
- Jeśli sukces, ustawia req.user na payload JWT.
- Jeśli błąd, ustawia req.user = null.
- Zawsze wywołuje next().

### Linie 17-25: requireAuth
```javascript
// Wymaga zalogowania
function requireAuth(req, res, next) {
  console.log('REQUIRE AUTH: req.user', req.user);
  if (!req.user) {
    console.log('REQUIRE AUTH: No user, returning 401');
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}
```
- Middleware wymagający logowania.
- Loguje req.user.
- Jeśli req.user nie istnieje, zwraca 401 Unauthorized.
- W przeciwnym razie przechodzi dalej.

### Linie 27-35: requireRole
```javascript
// Wymaga określonej roli (np. 'admin', 'owner')
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || !req.user.role || req.user.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
```
- Funkcja zwracająca middleware dla wymagania roli.
- Przyjmuje parametr role.
- Zwraca funkcję middleware, która sprawdza, czy req.user.role === role.
- Jeśli nie, 403 Forbidden.
- Jeśli tak, next().

### Linie 37: Eksport
```javascript
module.exports = { authMiddleware, requireAuth, requireRole };
```
- Eksportuje wszystkie funkcje.

## Użycie
- authMiddleware: Używany w app.js do sprawdzania tokenów na wszystkich requestach.
- requireAuth: Na endpointach wymagających logowania.
- requireRole('admin'): Na endpointach tylko dla adminów.

## Potencjalne problemy
- JWT_SECRET: Domyślny 'secret' jest niebezpieczny w produkcji.
- Token expiration: jwt.verify nie sprawdza expiration automatycznie? Nie, verify sprawdza.
- Role jako string: W kodzie role to number (1=user), ale tutaj porównuje z string, może niezgodność.
- Brak obsługi refresh tokenów: Tokeny wygasają po czasie, bez odświeżania.</content>
<parameter name="filePath">c:\Users\konhaw\Desktop\Uczelnia\JS\ProjektJS\documentation\backend\middleware\auth.js.md