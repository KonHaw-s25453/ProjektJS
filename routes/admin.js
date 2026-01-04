// Endpointy administracyjne: /admin/users, /admin/logs, /users/:id
const express = require('express');
const router = express.Router();
const { getDb } = require('../models/user');
const { requireAuth, requireRole } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Funkcja do logowania akcji admina
function logAdminAction(action, details) {
  const logEntry = `${new Date().toISOString()} - ${action}: ${details}\n`;
  const logFile = path.join(__dirname, '..', 'logs.txt');
  fs.appendFile(logFile, logEntry, (err) => {
    if (err) console.error('Error logging admin action:', err);
  });
}

// GET /admin/users - lista użytkowników (tylko admin)
router.get('/users', requireAuth, requireRole('admin'), async (req, res) => {
  const db = await getDb();
  const [users] = await db.execute('SELECT id, username, display_name, role FROM users');
  res.json({ users });
});

// GET /admin/admins - lista adminów (tylko admin)
router.get('/admins', requireAuth, requireRole('admin'), async (req, res) => {
  const db = await getDb();
  const [admins] = await db.execute('SELECT id, username, display_name, role FROM users WHERE role = "admin"');
  res.json({ admins });
});

// POST /admin/users/:id/promote - nadaj rolę admin (tylko owner)
router.post('/users/:id/promote', requireAuth, requireRole('owner'), async (req, res) => {
  const db = await getDb();
  const userId = req.params.id;
  await db.execute('UPDATE users SET role = "admin" WHERE id = ?', [userId]);
  logAdminAction('PROMOTE_USER', `User ${userId} promoted to admin by ${req.user.username}`);
  res.json({ message: 'User promoted to admin' });
});

// POST /admin/users/:id/demote - usuń rolę admin (tylko owner)
router.post('/users/:id/demote', requireAuth, requireRole('owner'), async (req, res) => {
  const db = await getDb();
  const userId = req.params.id;
  await db.execute('UPDATE users SET role = "user" WHERE id = ?', [userId]);
  logAdminAction('DEMOTE_USER', `User ${userId} demoted from admin by ${req.user.username}`);
  res.json({ message: 'Admin demoted' });
});

// GET /admin/logs - logi zmian (tylko właściciel)
router.get('/logs', requireAuth, requireRole('owner'), async (req, res) => {
  const logFile = path.join(__dirname, '..', 'logs.txt');
  if (!fs.existsSync(logFile)) {
    return res.json({ logs: [] });
  }
  const logs = fs.readFileSync(logFile, 'utf-8').split('\n').filter(line => line.trim()).reverse();
  res.json({ logs });
});

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

module.exports = router;
