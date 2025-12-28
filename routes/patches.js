const express = require('express');
const multer = require('multer');
const fs = require('fs');
const zlib = require('zlib');
const { decompress } = require('@mongodb-js/zstd');
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const { getDb } = require('../models/user');

// Deklaracje upload i tmpUploadsDir na górze pliku
const tmpUploadsDir = path.join(__dirname, '..', 'tmp_uploads');
const upload = multer({ dest: tmpUploadsDir, limits: { fileSize: 10 * 1024 * 1024 } });

const router = express.Router();
// Inicjalizacja routera musi być przed użyciem

// Log na wejściu do routera
router.use((req, res, next) => {
  // ...existing code...
  next();
});

// GŁÓWNY ENDPOINT UPLOAD PATCHA (.vcv) – przywrócenie poprzedniej logiki
router.post('/upload', requireAuth, uploadSingleWithLog('vcv'), async (req, res) => {
  try {
    if (!req.user) {
      console.error('UPLOAD: Brak użytkownika JWT');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const file = req.file;
    if (!file) {
      console.error('UPLOAD: brak pliku!');
      return res.status(400).json({ error: 'No file uploaded (field name "vcv")' });
    }
    if (!file.originalname.toLowerCase().endsWith('.vcv')) {
      console.error('UPLOAD: Zły typ pliku:', file.originalname);
      return res.status(400).json({ error: 'Invalid file extension. Only .vcv files are allowed.' });
    }
    const { category = null, description = null } = req.body;
    const authUser = req.user.username;
    let buffer;
    try {
      buffer = fs.readFileSync(file.path);
    } catch (e) {
      console.error('UPLOAD: Błąd odczytu pliku:', e);
      return res.status(500).json({ error: 'Failed to read uploaded file', details: String(e) });
    }
    let parsed = null;
    let parseError = null;
    try {
      parsed = JSON.parse(buffer.toString('utf-8'));
    } catch (e) {
      parseError = e;
      console.error('UPLOAD: Błąd parsowania JSON:', e);
    }
    if (!parsed) {
      try {
        const MAX_UNZIPPED_SIZE = 20 * 1024 * 1024; // 20 MB
        let decompressed;
        try {
          decompressed = zlib.inflateSync(buffer);
        } catch (zerr) {
          console.error('UPLOAD: Błąd dekompresji zlib:', zerr);
          try {
            decompressed = await decompress(buffer);
          } catch (zstderr) {
            console.error('UPLOAD: Błąd dekompresji zstd:', zstderr);
            return res.status(400).json({ error: 'Failed to decompress VCV file with zlib or zstd', details: String(zstderr) });
          }
        }
        if (decompressed.length > MAX_UNZIPPED_SIZE) throw new Error('Unzipped file too large');
        try {
          parsed = JSON.parse(decompressed.toString('utf-8'));
        } catch (jerr) {
          console.error('UPLOAD: Błąd parsowania JSON po dekompresji:', jerr);
          return res.status(400).json({ error: 'Failed to parse decompressed VCV file as JSON', details: String(jerr) });
        }
      } catch (e) {
        console.error('UPLOAD: Błąd parsowania VCV:', parseError || e);
        return res.status(400).json({ error: 'Failed to parse VCV file as JSON, zlib, or zstd-compressed JSON', details: String(parseError || e) });
      }
    }
    let modules;
    try {
      modules = extractModules(parsed);
    } catch (e) {
      modules = [];
      console.error('UPLOAD: Błąd extractModules:', e);
    }
    let patchId = null;
    try {
      const db = await getDb();
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
          console.error('UPLOAD: Błąd transakcji DB:', err);
          try { await conn.rollback(); } catch (e) { console.error('UPLOAD: Błąd rollback:', e); }
          return res.status(500).json({ error: 'DB transaction failed', details: String(err) });
        } finally {
          if (conn) try { conn.release(); } catch (e) { console.error('UPLOAD: Błąd release:', e); }
        }
      }
    } catch (dbErr) {
      console.error('UPLOAD: błąd getDb lub transakcji:', dbErr);
      return res.status(500).json({ error: 'DB error', details: String(dbErr) });
    }
    res.json({ ok: true, parsed: !!parsed, modules, patchId, path: file.path });
  } catch (err) {
    console.error('UPLOAD: Błąd uploadu (uncaught):', err);
    if (!res.headersSent) res.status(500).json({ error: 'Upload failed (uncaught)', details: String(err) });
  }
});
// Log na wejściu do routera
router.use((req, res, next) => {
  console.log('PATCHES ROUTER: wejście', req.method, req.url);
  next();
});


// Endpointy do uploadu patchy, pobierania, notatek, tagów
console.log('PATCHES ROUTER LOADED');
// Minimal upload test endpoint for isolated debugging (właściwe miejsce)


router.post('/upload/test', upload.single('file'), (req, res) => {
  try {
    console.log('UPLOAD TEST HANDLER REACHED');
    if (!req.file) {
      console.error('UPLOAD TEST: brak pliku!');
      return res.status(400).json({ ok: false, error: 'No file uploaded' });
    }
    console.log('UPLOAD TEST: req.file', req.file);
    res.json({ ok: true, file: !!req.file });
  } catch (err) {
    console.error('UPLOAD TEST: uncaught error', err);
    res.status(500).json({ ok: false, error: String(err) });
	}
});

// Wrapper middleware logujący wejście i błędy Multer
function uploadSingleWithLog(field) {
  return function (req, res, next) {
    console.log('UPLOAD WRAPPER: ====> wejście do uploadSingleWithLog', {
      method: req.method,
      url: req.url,
      headers: req.headers
    });
    let finished = false;
    req.on('error', err => {
      if (!finished) {
        finished = true;
        console.error('UPLOAD WRAPPER: req error', err);
        if (!res.headersSent) res.status(500).json({ error: 'Request stream error', details: String(err) });
      }
    });
    res.on('error', err => {
      if (!finished) {
        finished = true;
        console.error('UPLOAD WRAPPER: res error', err);
      }
    });
    try {
      upload.single(field)(req, res, function (err) {
        console.log('UPLOAD WRAPPER: callback Multer single');
        if (err) {
          finished = true;
          console.error('UPLOAD WRAPPER: Multer error', err);
          if (err.stack) console.error(err.stack);
          if (!res.headersSent) return res.status(400).json({ error: 'Multer error', details: String(err) });
          return;
        }
        console.log('UPLOAD WRAPPER: upload.single zakończony sukcesem');
        finished = true;
        next();
      });
    } catch (e) {
      if (!finished) {
        finished = true;
        console.error('UPLOAD WRAPPER: wyjątek synchronizacyjny', e);
        if (!res.headersSent) res.status(500).json({ error: 'Upload wrapper sync error', details: String(e) });
      }
    }
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

// Endpoint do analizy patcha na płatne moduły
router.post('/analyze-patch', upload.single('vcv'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (!file.originalname.toLowerCase().endsWith('.vcv')) {
      return res.status(400).json({ error: 'Invalid file extension. Only .vcv files are allowed.' });
    }
    let buffer;
    try {
      buffer = fs.readFileSync(file.path);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to read file' });
    }
    let parsed = null;
    try {
      parsed = JSON.parse(buffer.toString('utf-8'));
    } catch (e) {
      try {
        const decompressed = zlib.inflateSync(buffer);
        parsed = JSON.parse(decompressed.toString('utf-8'));
      } catch (e2) {
        return res.status(400).json({ error: 'Failed to parse VCV file' });
      }
    }
    const modules = extractModules(parsed);
    const paidModules = [];
    let totalPrice = 0;
    for (const mod of modules) {
      try {
        const checkRes = await fetch(`http://localhost:3000/check-module/${mod.plugin}/${mod.model}`);
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.found) {
            paidModules.push({ plugin: mod.plugin, model: mod.model, price: parseInt(checkData.price) });
            totalPrice += parseInt(checkData.price);
          }
        }
      } catch (e) {
        console.error('Error checking module:', mod, e);
      }
    }
    // Usuń plik tymczasowy
    fs.unlinkSync(file.path);
    res.json({ paidModules, totalPrice });
  } catch (err) {
    res.status(500).json({ error: 'Analysis failed', details: String(err) });
  }
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

// Pobierz plik patcha (.vcv)
router.get('/download/:id', requireAuth, async (req, res) => {
  const db = await getDb();
  const patchId = req.params.id;
  const [patches] = await db.execute('SELECT file_path FROM patches WHERE id = ?', [patchId]);
  if (!patches || !patches.length) {
    return res.status(404).json({ error: 'Patch not found' });
  }
  const filePath = patches[0].file_path;
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.download(filePath, `patch-${patchId}.vcv`);
});

module.exports = router;
