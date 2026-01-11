const express = require('express');
const multer = require('multer');
const fs = require('fs');
const zlib = require('zlib');
const { decompress } = require('@mongodb-js/zstd');
const tar = require('tar-stream');
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const { getDb } = require('../models/user');

// Deklaracje upload i tmpUploadsDir na górze pliku
const tmpUploadsDir = path.join(__dirname, '..', 'tmp_uploads');
const upload = multer({ dest: tmpUploadsDir, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

const router = express.Router();
// Inicjalizacja routera musi być przed użyciem

// Log na wejściu do routera
router.use((req, res, next) => {
  // ...existing code...
  next();
});

// GŁÓWNY ENDPOINT UPLOAD PATCHA (.vcv) – przywrócenie poprzedniej logiki
router.post('/api/upload', requireAuth, uploadSingleWithLog('vcv'), async (req, res) => {
  console.log('UPLOAD: function start');
  let db;
  try {
    db = await getDb();
    console.log('UPLOAD: db obtained:', !!db);
  } catch (dbErr) {
    console.error('UPLOAD: Błąd getDb:', dbErr);
    return res.status(500).json({ error: 'Database connection failed', details: String(dbErr) });
  }
  try {
    console.log('UPLOAD: db in try:', !!db);
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
    const { category = null } = req.body;
    let categoryId = null;
    if (category && !isNaN(category)) {
      // Sprawdź czy category jest prawidłowym id (liczbą)
      const catId = parseInt(category, 10);
      const [catRows] = await db.execute('SELECT id FROM categories WHERE id = ?', [catId]);
      if (catRows.length) categoryId = catId;
    }
    console.log('UPLOAD: category input:', category, 'categoryId:', categoryId);
    let description = req.body.description || null;
    const authUser = req.user.username;
    let buffer;
    try {
      buffer = fs.readFileSync(file.path);
    } catch (e) {
      console.error('UPLOAD: Błąd odczytu pliku:', e);
      return res.status(500).json({ error: 'Failed to read uploaded file', details: String(e) });
    }
    // Próba parsowania pliku VCV - może być JSON, gzip+JSON, zstd+tar+JSON, lub binarny
    let parsed = null;
    let modules = [];
    try {
      // Najpierw sprawdź czy to gzip (magic bytes 0x1f 0x8b)
      if (buffer.length > 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) {
        console.log('UPLOAD: Wykryto gzip, rozpakowuję...');
        const decompressed = zlib.gunzipSync(buffer);
        parsed = JSON.parse(decompressed.toString('utf-8'));
        console.log('UPLOAD: Rozpakowano gzip i sparsowano JSON');
      } else {
        // Spróbuj jako zwykły JSON
        parsed = JSON.parse(buffer.toString('utf-8'));
        console.log('UPLOAD: Sparsowano jako JSON');
      }
      modules = extractModules(parsed);
    } catch (e) {
      console.log('UPLOAD: Nie udało się sparsować jako JSON lub gzip+JSON, próbuję zstd+tar...');
      try {
        // Spróbuj zstd dekompresję
        const zstdDecompressed = await decompress(buffer);
        console.log('UPLOAD: Rozpakowano zstd, sprawdzam czy to tar...');
        
        // Spróbuj wyciągnąć JSON z tar
        parsed = await extractJsonFromTar(zstdDecompressed);
        if (parsed) {
          console.log('UPLOAD: Wyciągnięto JSON z tar');
          modules = extractModules(parsed);
        } else {
          throw new Error('No JSON found in tar');
        }
      } catch (e2) {
        console.log('UPLOAD: Nie udało się sparsować jako zstd+tar+JSON, traktuję jako binarny:', e.message);
        parsed = null;
        modules = [];
      }
    }
    // Automatyczne generowanie opisu jeśli nie podano
    console.log('UPLOAD: before description, db:', !!db);
    if (!description || description.trim() === '') {
      const totalModules = modules.reduce((sum, m) => sum + m.count, 0);
      const moduleList = modules.map(m => `${m.plugin} ${m.model} (${m.count})`).join(', ');
      description = `Patch zawiera ${totalModules} modułów: ${moduleList}.`;
    }
    // Oblicz cenę sumaryczną płatnych modułów
    let totalPrice = 0;
    console.log('UPLOAD: calculating price, db:', !!db, typeof db);
    console.log('db methods:', Object.getOwnPropertyNames(db.__proto__));
    for (const mod of modules) {
      const [prices] = await db.execute('SELECT price FROM module_prices WHERE plugin = ? AND model = ?', [mod.plugin, mod.model]);
      if (prices.length && parseFloat(prices[0].price) > 0) {
        totalPrice += parseFloat(prices[0].price);
      }
    }
    let patchId = null;
    try {
      const db = await getDb();
      if (db) {
        let conn;
        try {
          conn = await db.getConnection();
          await conn.beginTransaction();
          console.log('UPLOAD: inserting with categoryId:', categoryId);
          const [result] = await conn.execute(
            'INSERT INTO patches (user_name, category_id, file_path, description, total_price, uploaded_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [authUser, categoryId, file.path, description, totalPrice]
          );
          patchId = result.insertId;
          for (const m of modules) {
            const [rows] = await conn.execute('SELECT id FROM modules WHERE plugin = ? AND model = ?', [m.plugin, m.model]);
            let moduleId;
            if (rows.length) moduleId = rows[0].id;
            else {
              const [r2] = await conn.execute('INSERT INTO modules (plugin, model) VALUES (?, ?)', [m.plugin, m.model]);
              moduleId = r2.insertId;
            }
            // Sprawdź czy już istnieje w patch_modules
            const [existing] = await conn.execute('SELECT count FROM patch_modules WHERE patch_id = ? AND module_id = ?', [patchId, moduleId]);
            if (existing.length) {
              // UPDATE
              await conn.execute('UPDATE patch_modules SET count = count + ? WHERE patch_id = ? AND module_id = ?', [m.count, patchId, moduleId]);
            } else {
              // INSERT
              await conn.execute('INSERT INTO patch_modules (patch_id, module_id, count) VALUES (?, ?, ?)', [patchId, moduleId, m.count]);
            }
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
    console.log('UPLOAD: Success, sending response', { ok: true, parsed: !!parsed, modules, patchId, path: file.path });
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

// Endpoint to get categories
router.get('/api/categories', async (req, res) => {
  try {
    const db = await getDb();
    const [rows] = await db.execute('SELECT id, name FROM categories ORDER BY name');
    res.json({ categories: rows });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
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
  
  // Pobierz patch
  const [patchRows] = await db.execute('SELECT * FROM patches WHERE id = ?', [patchId]);
  if (!patchRows.length) return res.status(404).json({ error: 'Patch not found' });
  const patch = patchRows[0];
  
  // Pobierz moduły
  const [moduleRows] = await db.execute(`
    SELECT m.plugin, m.model, pm.count, COALESCE(mp.price, 0) as price
    FROM patch_modules pm
    JOIN modules m ON pm.module_id = m.id
    LEFT JOIN module_prices mp ON mp.plugin = m.plugin AND mp.model = m.model
    WHERE pm.patch_id = ?
  `, [patchId]);
  
  // Pobierz notatki
  const [noteRows] = await db.execute(`
    SELECT n.content as note, n.created_at, u.username
    FROM notes n
    JOIN users u ON n.user_id = u.id
    WHERE n.patch_id = ?
    ORDER BY n.created_at DESC
  `, [patchId]);
  
  // Pobierz tagi
  const [tagRows] = await db.execute(`
    SELECT t.name as tag
    FROM patch_tags pt
    JOIN tags t ON pt.tag_id = t.id
    WHERE pt.patch_id = ?
    ORDER BY t.name
  `, [patchId]);
  
  // Pobierz kategorię
  let categoryName = null;
  if (patch.category_id) {
    const [catRows] = await db.execute('SELECT name FROM categories WHERE id = ?', [patch.category_id]);
    if (catRows.length) categoryName = catRows[0].name;
  }
  
  res.json({ 
    patch: {
      ...patch,
      category_name: categoryName
    },
    modules: moduleRows,
    notes: noteRows,
    tags: tagRows
  });
});

// GET /patches/:id/download - pobierz plik .vcv
router.get('/patches/:id/download', requireAuth, async (req, res) => {
  const patchId = req.params.id;
  const db = await getDb();
  if (!db) return res.status(500).json({ error: 'DB not configured' });
  
  // Sprawdź czy patch istnieje
  const [patchRows] = await db.execute('SELECT file_path FROM patches WHERE id = ?', [patchId]);
  if (!patchRows.length) return res.status(404).json({ error: 'Patch not found' });
  
  const filePath = patchRows[0].file_path;
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Ustaw headers dla download
  res.setHeader('Content-Disposition', `attachment; filename="patch_${patchId}.vcv"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  
  // Stream plik
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
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
    let modules = [];
    try {
      // Najpierw sprawdź czy to gzip (magic bytes 0x1f 0x8b)
      if (buffer.length > 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) {
        console.log('ANALYZE: Wykryto gzip, rozpakowuję...');
        const decompressed = zlib.gunzipSync(buffer);
        parsed = JSON.parse(decompressed.toString('utf-8'));
        console.log('ANALYZE: Rozpakowano gzip i sparsowano JSON');
      } else {
        // Spróbuj jako zwykły JSON
        parsed = JSON.parse(buffer.toString('utf-8'));
        console.log('ANALYZE: Sparsowano jako JSON');
      }
      modules = extractModules(parsed);
    } catch (e) {
      console.log('ANALYZE: Nie udało się sparsować jako JSON lub gzip+JSON, próbuję zstd+tar...');
      try {
        // Spróbuj zstd dekompresję
        const zstdDecompressed = await decompress(buffer);
        console.log('ANALYZE: Rozpakowano zstd, sprawdzam czy to tar...');
        
        // Spróbuj wyciągnąć JSON z tar
        parsed = await extractJsonFromTar(zstdDecompressed);
        if (parsed) {
          console.log('ANALYZE: Wyciągnięto JSON z tar');
          modules = extractModules(parsed);
        } else {
          throw new Error('No JSON found in tar');
        }
      } catch (e2) {
        console.log('ANALYZE: Nie udało się sparsować pliku VCV, zwracam pustą listę');
        modules = [];
      }
    }
    if (modules.length === 0) {
      return res.json({ paidModules: [], totalPrice: 0 });
    }
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
  if (!parsed) return [];
  // uproszczona logika: szukaj modules lub plugins
  let mods = [];
  if (Array.isArray(parsed.modules)) {
    mods = parsed.modules.map(m => ({ plugin: m.plugin || '', model: m.model || '' }));
  } else if (Array.isArray(parsed.plugins)) {
    mods = parsed.plugins.map(m => ({ plugin: m.plugin || '', model: m.model || '' }));
  }
  // Zlicz wystąpienia
  const countMap = {};
  for (const m of mods) {
    const key = `${m.plugin}:${m.model}`;
    countMap[key] = (countMap[key] || 0) + 1;
  }
  return Object.entries(countMap).map(([key, count]) => {
    const [plugin, model] = key.split(':');
    return { plugin, model, count };
  });
}

// Funkcja do ekstrakcji JSON z tar stream lub bezpośredniego
async function extractJsonFromTar(tarBuffer) {
  try {
    // Najpierw spróbuj sparsować jako JSON bezpośrednio
    return JSON.parse(tarBuffer.toString('utf-8'));
  } catch (e) {
    // Jeśli nie, spróbuj tar
    return new Promise((resolve, reject) => {
      const extract = tar.extract();
      let jsonContent = null;

      extract.on('entry', (header, stream, next) => {
        if (header.name.endsWith('.json') || header.name === 'patch.json') {
          let chunks = [];
          stream.on('data', chunk => chunks.push(chunk));
          stream.on('end', () => {
            try {
              jsonContent = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
            } catch (e) {
              // ignoruj błędy parsowania pojedynczych plików
            }
            next();
          });
        } else {
          stream.on('end', () => next());
        }
        stream.resume();
      });

      extract.on('finish', () => resolve(jsonContent));
      extract.on('error', reject);

      extract.end(tarBuffer);
    });
  }
}

// Upload patcha (.vcv)
// --- SZABLONY ENDPOINTÓW ---

// Pobierz listę patchy (można filtrować po user, category, module, since)
router.get('/patches', async (req, res) => {
  // Przykładowa implementacja uproszczona
  const { user, category, module, since } = req.query;
  const db = await getDb();
  if (!db) return res.json({ error: 'DB not configured', patches: [] });
  let sql = `SELECT p.id, p.user_name, p.category_id, c.name as category_name, p.file_path, p.description, p.uploaded_at, p.total_price,
    (SELECT COUNT(*) FROM patch_modules pm WHERE pm.patch_id = p.id) AS module_count,
    GROUP_CONCAT(DISTINCT m.plugin SEPARATOR ', ') AS producers,
    GROUP_CONCAT(DISTINCT m.model SEPARATOR ', ') AS types,
    GROUP_CONCAT(DISTINCT t.name SEPARATOR ', ') AS tags
    FROM patches p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN patch_modules pm ON p.id = pm.patch_id
    LEFT JOIN modules m ON pm.module_id = m.id
    LEFT JOIN patch_tags pt ON p.id = pt.patch_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    WHERE 1=1`;
  const params = [];
  if (user) { sql += ' AND p.user_name = ?'; params.push(user); }
  if (category) { sql += ' AND p.category_id = ?'; params.push(category); }
  if (since) { sql += ' AND p.uploaded_at >= ?'; params.push(since); }
  sql += ' GROUP BY p.id ORDER BY p.uploaded_at DESC LIMIT 200';
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

// POST /patches/:id/notes - dodaj notatkę do patcha (zalogowany użytkownik)
router.post('/patches/:id/notes', requireAuth, async (req, res) => {
  const db = await getDb();
  const patchId = req.params.id;
  const { content } = req.body;
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'Content is required' });
  }
  // Sprawdź czy patch istnieje
  const [patches] = await db.execute('SELECT id FROM patches WHERE id = ?', [patchId]);
  if (!patches || !patches.length) {
    return res.status(404).json({ error: 'Patch not found' });
  }
  // Dodaj notatkę
  await db.execute('INSERT INTO notes (patch_id, user_id, content) VALUES (?, ?, ?)', [patchId, req.user.id, content.trim()]);
  res.json({ message: 'Note added' });
});

// POST /patches/:id/tags - dodaj tag do patcha (zalogowany użytkownik)
router.post('/patches/:id/tags', requireAuth, async (req, res) => {
  const db = await getDb();
  const patchId = req.params.id;
  const { tag } = req.body;
  if (!tag || typeof tag !== 'string' || tag.trim().length === 0) {
    return res.status(400).json({ error: 'Tag is required' });
  }
  // Sprawdź czy patch istnieje
  const [patches] = await db.execute('SELECT id FROM patches WHERE id = ?', [patchId]);
  if (!patches || !patches.length) {
    return res.status(404).json({ error: 'Patch not found' });
  }
  // Znajdź lub utwórz tag
  let [tags] = await db.execute('SELECT id FROM tags WHERE name = ?', [tag.trim()]);
  let tagId;
  if (tags && tags.length) {
    tagId = tags[0].id;
  } else {
    const [result] = await db.execute('INSERT INTO tags (name) VALUES (?)', [tag.trim()]);
    tagId = result.insertId;
  }
  // Dodaj powiązanie, jeśli nie istnieje
  await db.execute('INSERT IGNORE INTO patch_tags (patch_id, tag_id) VALUES (?, ?)', [patchId, tagId]);
  res.json({ message: 'Tag added' });
});

// DELETE /patches/:id - usuń patcha (właściciel lub admin)
router.delete('/patches/:id', requireAuth, async (req, res) => {
  const db = await getDb();
  const patchId = req.params.id;
  // Sprawdź czy patch istnieje i czy użytkownik ma prawo
  const [patches] = await db.execute('SELECT user_name FROM patches WHERE id = ?', [patchId]);
  if (!patches || !patches.length) {
    return res.status(404).json({ error: 'Patch not found' });
  }
  const patchOwner = patches[0].user_name;
  if (req.user.username !== patchOwner && req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  // Usuń plik
  const filePath = path.join(__dirname, '..', 'uploads', `patch-${patchId}.vcv`); // zakładając nazwę pliku
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  // Usuń z bazy (cascade usunie powiązania)
  await db.execute('DELETE FROM patches WHERE id = ?', [patchId]);
  // Loguj akcję
  const fs = require('fs');
  const logEntry = `${new Date().toISOString()} - DELETE_PATCH: Patch ${patchId} deleted by ${req.user.username}\n`;
  fs.appendFile(path.join(__dirname, '..', 'logs.txt'), logEntry, (err) => {
    if (err) console.error('Error logging delete patch:', err);
  });
  res.json({ message: 'Patch deleted' });
});

module.exports = router;
