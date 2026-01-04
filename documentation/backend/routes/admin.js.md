# Dokumentacja: routes/admin.js

## Opis ogólny
Plik `routes/admin.js` zawiera endpointy administracyjne dla zarządzania użytkownikami, logami i patchami. Używa middleware autoryzacji i loguje akcje adminów.

## Struktura pliku
- Importy: express, getDb, requireAuth, requireRole, fs, path.
- Funkcja pomocnicza: logAdminAction.
- Endpointy: GET /users, GET /admins, POST /users/:id/promote, POST /users/:id/demote, GET /logs, GET /users/:id, GET /patches/:id, DELETE /users/:id.
- Eksport: router.

## Szczegółowe wyjaśnienia linii/fragmentów

### Linie 1-6: Importy
```javascript
// Endpointy administracyjne: /admin/users, /admin/logs, /users/:id
const express = require('express');
const router = express.Router();
const { getDb } = require('../models/user');
const { requireAuth, requireRole } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
```
- Komentarz opisuje endpointy.
- Importy dla express, DB, auth middleware, fs dla logów.

### Linie 8-14: logAdminAction
```javascript
// Funkcja do logowania akcji admina
function logAdminAction(action, details) {
  const logEntry = `${new Date().toISOString()} - ${action}: ${details}\n`;
  const logFile = path.join(__dirname, '..', 'logs.txt');
  fs.appendFile(logFile, logEntry, (err) => {
    if (err) console.error('Error logging admin action:', err);
  });
}
```
- Funkcja loguje akcje adminów do pliku logs.txt.
- Format: timestamp - action: details.
- Używa fs.appendFile asynchronicznie.

### Linie 16-20: GET /users
```javascript
// GET /admin/users - lista użytkowników (tylko admin)
router.get('/users', requireAuth, requireRole('admin'), async (req, res) => {
  const db = await getDb();
  const [users] = await db.execute('SELECT id, username, display_name, role FROM users');
  res.json({ users });
});
```
- Wymaga logowania i roli admin.
- Zwraca listę wszystkich użytkowników z id, username, display_name, role.

### Linie 22-26: GET /admins
```javascript
// GET /admin/admins - lista adminów (tylko admin)
router.get('/admins', requireAuth, requireRole('admin'), async (req, res) => {
  const db = await getDb();
  const [admins] = await db.execute('SELECT id, username, display_name, role FROM users WHERE role = "admin"');
  res.json({ admins });
});
```
- Podobnie, lista adminów.

### Linie 28-34: POST /users/:id/promote
```javascript
// POST /admin/users/:id/promote - nadaj rolę admin (tylko owner)
router.post('/users/:id/promote', requireAuth, requireRole('owner'), async (req, res) => {
  const db = await getDb();
  const userId = req.params.id;
  await db.execute('UPDATE users SET role = "admin" WHERE id = ?', [userId]);
  logAdminAction('PROMOTE_USER', `User ${userId} promoted to admin by ${req.user.username}`);
  res.json({ message: 'User promoted to admin' });
});
```
- Wymaga roli owner.
- Aktualizuje rolę na "admin".
- Loguje akcję.

### Linie 36-42: POST /users/:id/demote
```javascript
// POST /admin/users/:id/demote - usuń rolę admin (tylko owner)
router.post('/users/:id/demote', requireAuth, requireRole('owner'), async (req, res) => {
  const db = await getDb();
  const userId = req.params.id;
  await db.execute('UPDATE users SET role = "user" WHERE id = ?', [userId]);
  logAdminAction('DEMOTE_USER', `User ${userId} demoted from admin by ${req.user.username}`);
  res.json({ message: 'Admin demoted' });
});
```
- Podobnie, demote do "user".

### Linie 44-51: GET /logs
```javascript
// GET /admin/logs - logi zmian (tylko właściciel)
router.get('/logs', requireAuth, requireRole('owner'), async (req, res) => {
  const logFile = path.join(__dirname, '..', 'logs.txt');
  if (!fs.existsSync(logFile)) {
    return res.json({ logs: [] });
  }
  const logs = fs.readFileSync(logFile, 'utf-8').split('\n').filter(line => line.trim()).reverse();
  res.json({ logs });
});
```
- Wymaga owner.
- Czyta logs.txt, dzieli na linie, filtruje puste, odwraca kolejność (najnowsze pierwsze).

### Linie 53-64: GET /users/:id
```javascript
// GET /users/:id - szczegóły użytkownika (admin lub sam użytkownik)
router.get('/users/:id', requireAuth, async (req, res) => {
  const db = await getDb();
  const userId = req.params.id;
  // Admin może pobrać dowolnego, user tylko siebie
  if (req.user.role !== 'admin' && req.user.id != userId) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  const [users] = await db.execute('SELECT id, username, role FROM users WHERE id = ?', [userId]);
  if (!users || !users.length) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(users[0]);
});
```
- Wymaga logowania.
- Admin może zobaczyć dowolnego, user tylko siebie.
- Zwraca szczegóły usera.

### Linie 65-75: GET /patches/:id
```javascript
// GET /patches/:id - szczegóły patcha (admin lub właściciel)
router.get('/patches/:id', requireAuth, async (req, res) => {
  const db = await getDb();
  const patchId = req.params.id;
  const [patches] = await db.execute('SELECT * FROM patches WHERE id = ?', [patchId]);
  if (!patches || !patches.length) {
    return res.status(404).json({ error: 'Patch not found' });
  }
  // Możesz dodać dodatkową autoryzację jeśli potrzeba
  res.json({ patch: patches[0] });
});
```
- Wymaga logowania.
- Zwraca szczegóły patcha (brak dodatkowej autoryzacji).

### Linie 77-95: DELETE /users/:id
```javascript
// DELETE /users/:id - usuń użytkownika (tylko admin lub właściciel)
router.delete('/users/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const db = await getDb();
  const userId = req.params.id;
  // Nie pozwól usunąć siebie lub ostatniego właściciela
  if (userId == req.user.id) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }
  const [owners] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role = "owner"');
  const [userRole] = await db.execute('SELECT role FROM users WHERE id = ?', [userId]);
  if (userRole && userRole[0].role === 'owner' && owners[0].count <= 1) {
    return res.status(400).json({ error: 'Cannot delete the last owner' });
  }
  await db.execute('DELETE FROM users WHERE id = ?', [userId]);
  logAdminAction('DELETE_USER', `User ${userId} deleted by ${req.user.username}`);
  res.json({ message: 'User deleted' });
});
```
- Wymaga admin.
- Nie pozwala usunąć siebie ani ostatniego ownera.
- Usuwa usera, loguje.

### Linie 97-105: Eksport
```javascript
module.exports = router;
```
- Eksportuje router.

## Użycie
- Mountowany w app.js jako app.use('/admin', adminRouter).
- Używany przez adminów do zarządzania użytkownikami i przeglądania logów.

## Potencjalne problemy
- Role: Zakłada stringi "admin", "owner", ale w innych miejscach mogą być numery.
- Logi: Plik logs.txt może rosnąć bez ograniczeń.
- DELETE: requireRole('admin'), ale komentarz mówi admin lub właściciel – niezgodność.
- Brak walidacji userId: Może być nieprawidłowe.
- SQL injection: Bezpieczne z prepared statements.</content>
<parameter name="filePath">c:\Users\konhaw\Desktop\Uczelnia\JS\ProjektJS\documentation\backend\routes\admin.js.md