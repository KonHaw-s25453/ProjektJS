// ...existing code...
// Endpointy do uploadu patchy, pobierania, notatek, tagów
console.log('PATCHES ROUTER LOADED');
// Minimal upload test endpoint for isolated debugging (właściwe miejsce)

const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const zlib = require('zlib');
const { decompress } = require('@mongodb-js/zstd');
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const { getDb } = require('../models/user');

const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

router.post('/upload/test', upload.single('file'), (req, res) => {
  console.log('UPLOAD TEST HANDLER REACHED');
  res.json({ ok: true, file: !!req.file });
});

// Wrapper middleware logujący wejście i błędy Multer
function uploadSingleWithLog(field) {
  return function (req, res, next) {
    console.log('UPLOAD WRAPPER: wejście do upload.single', {
      method: req.method,
      url: req.url,
      headers: req.headers
    });
    req.on('error', err => {
      console.error('UPLOAD WRAPPER: req error', err);
    });
    res.on('error', err => {
      console.error('UPLOAD WRAPPER: res error', err);
    });
    upload.single(field)(req, res, function (err) {
      if (err) {
        console.error('UPLOAD WRAPPER: Multer error', err);
        return next(err);
      }
      console.log('UPLOAD WRAPPER: upload.single zakończony sukcesem');
      next();
    });
  };
}

// Pobierz szczegóły patcha po ID
router.get('/patches/:id', async (req, res) => {
  const patchId = req.params.id;
  const db = await getDb();
  if (!db) return res.status(500).json({ error: 'DB not configured' });
  const [rows] = await db.execute('SELECT * FROM patches WHERE id = ?', [patchId]);
  if (!rows.length) return res.status(404).json({ error: 'Patch not found' });
  res.json({ patch: rows[0] });
});

// Pomocnicza funkcja do wyciągania modułów z patcha
function extractModules(parsed) {
  // uproszczona logika: szukaj modules lub plugins
  return Array.isArray(parsed.modules)
    ? parsed.modules.map(m => ({ plugin: m.plugin || '', model: m.model || '' }))
    : Array.isArray(parsed.plugins)
    ? parsed.plugins.map(m => ({ plugin: m.plugin || '', model: m.model || '' }))
    : [];
}

// Upload patcha (.vcv)
router.post('/upload', requireAuth, uploadSingleWithLog('vcv'), async (req, res) => {
  console.log('UPLOAD: wejście do handlera');
  try {
    console.log('UPLOAD: req.user', req.user);
    console.log('UPLOAD: req.file', req.file);
    console.log('UPLOAD: req.body', req.body);
    if (!req.user) {
      console.error('Brak użytkownika JWT');
      console.log('UPLOAD: return 401');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const file = req.file;
    if (!file) {
      console.error('Brak pliku w uploadzie');
      console.log('UPLOAD: return 400 brak pliku');
      return res.status(400).json({ error: 'No file uploaded (field name "vcv")' });
    }
    if (!file.originalname.toLowerCase().endsWith('.vcv')) {
      console.error('Zły typ pliku:', file.originalname);
      console.log('UPLOAD: return 400 zły typ pliku');
      return res.status(400).json({ error: 'Invalid file extension. Only .vcv files are allowed.' });
    }
    const { category = null, description = null } = req.body;
    const authUser = req.user.username;
    let buffer;
    try {
      buffer = fs.readFileSync(file.path);
      console.log('UPLOAD: odczytano plik, rozmiar:', buffer.length);
    } catch (e) {
      console.error('Błąd odczytu pliku:', e);
      console.log('UPLOAD: return 500 błąd odczytu pliku');
      return res.status(500).json({ error: 'Failed to read uploaded file', details: String(e) });
    }
    let parsed = null;
    let parseError = null;
    // 1. Spróbuj odczytać jako czysty JSON
    try {
      parsed = JSON.parse(buffer.toString('utf-8'));
      console.log('UPLOAD: plik to czysty JSON');
    } catch (e) {
      parseError = e;
      console.error('Błąd parsowania JSON:', e);
    }
    // 2. Jeśli nie, spróbuj zlib
    if (!parsed) {
      try {
        const MAX_UNZIPPED_SIZE = 20 * 1024 * 1024; // 20 MB
        let decompressed;
        try {
          decompressed = zlib.inflateSync(buffer);
          console.log('UPLOAD: plik zlib, rozmiar po dekompresji:', decompressed.length);
        } catch (zerr) {
          console.error('Błąd dekompresji zlib:', zerr);
          // 3. Jeśli zlib nie działa, spróbuj zstd
          try {
            decompressed = await decompress(buffer);
            console.log('UPLOAD: plik zstd, rozmiar po dekompresji:', decompressed.length);
          } catch (zstderr) {
            console.error('Błąd dekompresji zstd:', zstderr);
            return res.status(400).json({ error: 'Failed to decompress VCV file with zlib or zstd', details: String(zstderr) });
          }
        }
        if (decompressed.length > MAX_UNZIPPED_SIZE) throw new Error('Unzipped file too large');
        try {
          parsed = JSON.parse(decompressed.toString('utf-8'));
          console.log('UPLOAD: plik zlib/zstd jako JSON OK');
        } catch (jerr) {
          console.error('Błąd parsowania JSON po dekompresji:', jerr);
          return res.status(400).json({ error: 'Failed to parse decompressed VCV file as JSON', details: String(jerr) });
        }
      } catch (e) {
        console.error('Błąd parsowania VCV:', parseError || e);
        return res.status(400).json({ error: 'Failed to parse VCV file as JSON, zlib, or zstd-compressed JSON', details: String(parseError || e) });
      }
    }
    let modules;
    try { modules = extractModules(parsed); } catch (e) { modules = []; console.error('Błąd extractModules:', e); }
    console.log('UPLOAD: po extractModules', modules);
    const db = await getDb();
    let patchId = null;
    if (db) {
      let conn;
      try {
        conn = await db.getConnection();
        await conn.beginTransaction();
        const [result] = await conn.execute(
          'INSERT INTO patches (user_name, category_id, file_path, description, uploaded_at) VALUES (?, ?, ?, ?, NOW())',
          [authUser, category, file.path, description]
        );
        patchId = result.insertId;
        for (const m of modules) {
          const [rows] = await conn.execute('SELECT id FROM modules WHERE plugin = ? AND model = ? LIMIT 1', [m.plugin, m.model]);
          let moduleId;
          if (rows.length) moduleId = rows[0].id;
          else {
            const [r2] = await conn.execute('INSERT INTO modules (plugin, model) VALUES (?, ?)', [m.plugin, m.model]);
            moduleId = r2.insertId;
          }
          await conn.execute('INSERT INTO patch_modules (patch_id, module_id) VALUES (?, ?)', [patchId, moduleId]);
        }
        await conn.commit();
        console.log('UPLOAD: DB commit OK, patchId:', patchId);
      } catch (err) {
        console.error('Błąd transakcji DB:', err);
        try { await conn.rollback(); } catch (e) { console.error('Błąd rollback:', e); }
        return res.status(500).json({ error: 'DB transaction failed', details: String(err) });
      } finally { if (conn) try { conn.release(); } catch (e) { console.error('Błąd release:', e); } }
    }
    console.log('UPLOAD: sukces, wysyłam odpowiedź 200');
    res.json({ ok: true, parsed: !!parsed, modules, patchId, path: file.path });
  } catch (err) {
    console.error('Błąd uploadu (uncaught):', err);
    console.log('UPLOAD: return 500 uncaught');
    res.status(500).json({ error: 'Upload failed (uncaught)', details: String(err) });
  }
});


// --- SZABLONY ENDPOINTÓW ---

// Pobierz listę patchy (można filtrować po user, category, module, since)
router.get('/patches', async (req, res) => {
  // Przykładowa implementacja uproszczona
  const { user, category, module, since } = req.query;
  const db = await getDb();
  if (!db) return res.json({ error: 'DB not configured', patches: [] });
  let sql = `SELECT p.id, p.user_name, p.category_id, p.file_path, p.description, p.uploaded_at,
    (SELECT COUNT(*) FROM patch_modules pm WHERE pm.patch_id = p.id) AS module_count
    FROM patches p WHERE 1=1`;
  const params = [];
  if (user) { sql += ' AND p.user_name = ?'; params.push(user); }
  if (category) { sql += ' AND p.category_id = ?'; params.push(category); }
  if (since) { sql += ' AND p.uploaded_at >= ?'; params.push(since); }
  sql += ' ORDER BY p.uploaded_at DESC LIMIT 200';
  const [rows] = await db.execute(sql, params);
  res.json({ patches: rows });
});

// Dodaj notatkę do patcha (tylko właściciel patcha lub admin)
router.post('/patches/:id/notes', requireAuth, async (req, res) => {
  const { note } = req.body;
  const patchId = req.params.id;
  if (!note) return res.status(400).json({ error: 'Note required' });
  const db = await getDb();
  if (!db) return res.status(500).json({ error: 'DB not configured' });
  const [rows] = await db.execute('SELECT * FROM patches WHERE id = ?', [patchId]);
  if (!rows.length) return res.status(404).json({ error: 'Patch not found' });
  const patch = rows[0];
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (user.role !== 'admin' && patch.user_name !== user.username) {
    return res.status(403).json({ error: 'Forbidden: not owner or admin' });
  }
  // Tu można dodać logikę zapisu notatki do bazy
  res.json({ ok: true, info: 'Notatka dodana (szablon)' });
});

// Dodaj tag do patcha (tylko właściciel patcha lub admin)
router.post('/patches/:id/tags', requireAuth, async (req, res) => {
  const { tag } = req.body;
  const patchId = req.params.id;
  if (!tag) return res.status(400).json({ error: 'Tag required' });
  const db = await getDb();
  if (!db) return res.status(500).json({ error: 'DB not configured' });
  const [rows] = await db.execute('SELECT * FROM patches WHERE id = ?', [patchId]);
  if (!rows.length) return res.status(404).json({ error: 'Patch not found' });
  const patch = rows[0];
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (user.role !== 'admin' && patch.user_name !== user.username) {
    return res.status(403).json({ error: 'Forbidden: not owner or admin' });
  }
  // Tu można dodać logikę zapisu tagu do bazy
  res.json({ ok: true, info: 'Tag dodany (szablon)' });
});

// Pobierz oryginalny plik .vcv patcha
router.get('/patches/:id/download', async (req, res) => {
  const patchId = req.params.id;
  const db = await getDb();
  const [rows] = await db.execute('SELECT file_path FROM patches WHERE id = ?', [patchId]);
  if (!rows.length) return res.status(404).json({ error: 'Patch not found' });
  const filePath = rows[0].file_path;
  res.download(filePath);
});

module.exports = router;


// Usuwanie patcha (tylko właściciel lub admin)
router.delete('/patches/:id', requireAuth, async (req, res) => {
  const patchId = req.params.id;
  const db = await getDb();
  if (!db) return res.status(500).json({ error: 'DB not configured' });
  // Pobierz patcha
  const [rows] = await db.execute('SELECT * FROM patches WHERE id = ?', [patchId]);
  if (!rows.length) return res.status(404).json({ error: 'Patch not found' });
  const patch = rows[0];
  // Sprawdź uprawnienia: admin lub właściciel
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (user.role !== 'admin' && patch.user_name !== user.username) {
    return res.status(403).json({ error: 'Forbidden: not owner or admin' });
  }
  // Usuń patcha
  await db.execute('DELETE FROM patches WHERE id = ?', [patchId]);
  res.status(204).send();
});
