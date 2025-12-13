// Endpointy do uploadu patchy, pobierania, notatek, tagów
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
router.post('/upload', requireAuth, upload.single('vcv'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded (field name "vcv")' });
    if (!file.originalname.toLowerCase().endsWith('.vcv')) return res.status(400).json({ error: 'Invalid file extension. Only .vcv files are allowed.' });
    const { category = null, description = null } = req.body;
    const authUser = req.user.username;
    let buffer;
    try {
      buffer = fs.readFileSync(file.path);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to read uploaded file', details: String(e) });
    }
    let parsed = null;
    let parseError = null;
    // 1. Spróbuj odczytać jako czysty JSON
    try {
      parsed = JSON.parse(buffer.toString('utf-8'));
    } catch (e) {
      parseError = e;
    }
    // 2. Jeśli nie, spróbuj zlib
    if (!parsed) {
      try {
        const MAX_UNZIPPED_SIZE = 20 * 1024 * 1024; // 20 MB
        let decompressed;
        try {
          decompressed = zlib.inflateSync(buffer);
        } catch (zerr) {
          // 3. Jeśli zlib nie działa, spróbuj zstd
          try {
            decompressed = await decompress(buffer);
          } catch (zstderr) {
            return res.status(400).json({ error: 'Failed to decompress VCV file with zlib or zstd', details: String(zstderr) });
          }
        }
        if (decompressed.length > MAX_UNZIPPED_SIZE) throw new Error('Unzipped file too large');
        try {
          parsed = JSON.parse(decompressed.toString('utf-8'));
        } catch (jerr) {
          return res.status(400).json({ error: 'Failed to parse decompressed VCV file as JSON', details: String(jerr) });
        }
      } catch (e) {
        return res.status(400).json({ error: 'Failed to parse VCV file as JSON, zlib, or zstd-compressed JSON', details: String(parseError || e) });
      }
    }
    let modules;
    try { modules = extractModules(parsed); } catch (e) { modules = []; }
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
      } catch (err) {
        try { await conn.rollback(); } catch (e) {}
        return res.status(500).json({ error: 'DB transaction failed', details: String(err) });
      } finally { if (conn) try { conn.release(); } catch (e) {} }
    }
    res.json({ ok: true, parsed: !!parsed, modules, patchId, path: file.path });
  } catch (err) {
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
  // Wymaga pola note w body
  const { note } = req.body;
  const patchId = req.params.id;
  if (!note) return res.status(400).json({ error: 'Note required' });
  // Uproszczona logika: sprawdź czy user jest właścicielem patcha lub adminem
  // ...
  res.json({ ok: true, info: 'Notatka dodana (szablon)' });
});

// Dodaj tag do patcha (tylko właściciel patcha lub admin)
router.post('/patches/:id/tags', requireAuth, async (req, res) => {
  // Wymaga pola tag w body
  const { tag } = req.body;
  const patchId = req.params.id;
  if (!tag) return res.status(400).json({ error: 'Tag required' });
  // Uproszczona logika: sprawdź czy user jest właścicielem patcha lub adminem
  // ...
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
