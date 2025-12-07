require('dotenv').config();
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const zlib = require('zlib');

let dbPool = null;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const app = express();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100, // limit 100 żądań na IP
});
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));



async function getDb() {
  if (!dbPool) {
    dbPool = await require('mysql2/promise').createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'vcv',
    });
    global.dbPool = dbPool;
  }
  return dbPool;
}


app.post('/upload', upload.single('vcv'), limiter, async (req, res) => {
    console.log('DEBUG Multer:', { file: req.file, files: req.files, body: req.body, headers: req.headers });
  try {
    const file = req.file;
    if (!file) {
      console.error('No file uploaded:', req.body, req.headers);
      return res.status(400).json({ error: 'No file uploaded (field name "vcv")' });
    }
    // Validate file extension
    if (!file.originalname.toLowerCase().endsWith('.vcv')) {
      console.error('Invalid file extension:', file.originalname);
      return res.status(400).json({ error: 'Invalid file extension. Only .vcv files are allowed.' });
    }
    const { category = null, description = null } = req.body;
    const authUser = req.user && req.user.username ? req.user.username : null;
    if (!authUser) {
      console.error('Authentication required for upload:', req.user);
      return res.status(401).json({ error: 'Authentication required for upload' });
    }
    let buffer;
    try {
      buffer = fs.readFileSync(file.path);
    } catch (e) {
      console.error('Failed to read uploaded file:', file.path, e);
      return res.status(500).json({ error: 'Failed to read uploaded file', details: String(e) });
    }
    let parsed;
    try {
      // Rozpakuj plik .vcv (zlib) z limitem rozmiaru
      const MAX_UNZIPPED_SIZE = 20 * 1024 * 1024; // 20 MB
      const decompressed = zlib.inflateSync(buffer);
      if (decompressed.length > MAX_UNZIPPED_SIZE) {
        throw new Error('Unzipped file too large');
      }
      const jsonText = decompressed.toString('utf-8');
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.error('Failed to decompress or parse VCV file:', e);
      return res.status(400).json({ error: 'Failed to decompress or parse VCV file', details: String(e) });
    }
    let modules;
    try {
      modules = extractModules(parsed);
    } catch (e) {
      console.error('Failed to extract modules:', e);
      modules = [];
    }
    const db = await getDb();
    let patchId = null;
    if (db) {
      let conn;
      try {
        conn = await db.getConnection();
        try {
          const [[dbInfo]] = await conn.execute("SELECT DATABASE() AS dbname");
          console.log('App connection DATABASE():', dbInfo && dbInfo.dbname);
        } catch (e) {
          console.log('Could not query DATABASE() on connection', e && e.message);
        }
        await conn.beginTransaction();
        const [result] = await conn.execute(
          'INSERT INTO patches (user_name, category_id, file_path, description, uploaded_at) VALUES (?, ?, ?, ?, NOW())',
          [authUser, category, file.path, description]
        );
        patchId = result.insertId;
        console.log('Inserted patch id:', patchId);
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
        try { await conn.rollback(); } catch (e) { console.error('Rollback failed', e); }
        console.error('DB transaction failed:', err);
        if (conn) try { conn.release(); } catch (e) { /* ignore */ }
        return res.status(500).json({ error: 'DB transaction failed', details: String(err) });
      } finally {
        if (conn) try { conn.release(); } catch (e) { /* ignore */ }
      }
    }
    res.json({ ok: true, parsed: !!parsed, modules, patchId, path: file.path });
  } catch (err) {
    console.error('Upload handler failed:', err);
    res.status(500).json({ error: 'Upload failed', details: String(err) });
  }
});

// Multer / upload error handler
app.use((err, req, res, next) => {
  if (!err) return next();
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large' });
    return res.status(400).json({ error: err.message });
  }
  // custom fileFilter error comes here as generic Error
  if (err && String(err.message).toLowerCase().includes('invalid file type')) {
    return res.status(400).json({ error: err.message });
  }
  console.error('Unhandled error middleware:', err);
  res.status(500).json({ error: 'Server error', details: String(err) });
});

app.get('/patches', async (req, res) => {
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

  // optional tag filter: if provided, narrow results to patches that have the tag
  if (req.query.tag) {
    const tagName = req.query.tag;
    // find tag id
    const [[tagRow]] = await db.execute('SELECT id FROM tags WHERE name = ? LIMIT 1', [tagName]);
    if (!tagRow) return res.json({ patches: [] });
    const [ptRows] = await db.execute('SELECT patch_id FROM patch_tags WHERE tag_id = ?', [tagRow.id]);
    const allowed = new Set(ptRows.map(r => String(r.patch_id)));
    const filtered = rows.filter(r => allowed.has(String(r.id)));
    return res.json({ patches: filtered });
  }

  res.json({ patches: rows });
});

// Note: limiter applied to upload route above. If you want global limits,
// consider `app.use(limiter)` or `app.use('/api', limiter)` as appropriate.

app.get('/patches/:id', async (req, res) => {
  const id = req.params.id;
  const db = await getDb();
  if (!db) return res.json({ error: 'DB not configured' });
  const [[patch]] = await db.execute('SELECT * FROM patches WHERE id = ? LIMIT 1', [id]);
  if (!patch) return res.status(404).json({ error: 'Not found' });
  const [mods] = await db.execute(
    `SELECT m.plugin, m.model, CONCAT('https://vcvrack.com/plugins.html?plugin=', m.plugin) AS link
     FROM modules m JOIN patch_modules pm ON m.id = pm.module_id WHERE pm.patch_id = ?`,
    [id]
  );
  // fetch tags for this patch (if DB supports it)
  let tags = [];
  try {
    const [trows] = await db.execute(
      `SELECT t.name FROM tags t JOIN patch_tags pt ON t.id = pt.tag_id WHERE pt.patch_id = ?`,
      [id]
    );
    tags = (trows || []).map(r => r.name);
  } catch (e) {
    tags = [];
  }
  res.json({ patch, modules: mods, tags });
});



// Add tags to a patch
app.post('/patches/:id/tags', async (req, res) => {
  const id = req.params.id;
  const { tags } = req.body || {};
  if (!Array.isArray(tags) || !tags.length) return res.status(400).json({ error: 'Provide tags array in body' });
  const db = await getDb();
  if (!db) return res.status(500).json({ error: 'DB not configured' });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    for (const name of tags) {
      const [rows] = await conn.execute('SELECT id FROM tags WHERE name = ? LIMIT 1', [name]);
      let tagId;
      if (rows.length) tagId = rows[0].id;
      else {
        const [r2] = await conn.execute('INSERT INTO tags (name) VALUES (?)', [name]);
        tagId = r2.insertId;
      }
      await conn.execute('INSERT INTO patch_tags (patch_id, tag_id) VALUES (?, ?)', [id, tagId]);
    }
    await conn.commit();
    res.json({ ok: true, tags });
  } catch (err) {
    await conn.rollback();
    console.error('Tag transaction failed', err);
    res.status(500).json({ error: 'Failed to add tags' });
  } finally {
    conn.release();
  }
});

app.get('/patches/:id/tags', async (req, res) => {
  const id = req.params.id;
  const db = await getDb();
  if (!db) return res.status(500).json({ error: 'DB not configured' });
  const [trows] = await db.execute('SELECT t.name FROM tags t JOIN patch_tags pt ON t.id = pt.tag_id WHERE pt.patch_id = ?', [id]);
  res.json({ tags: (trows || []).map(r => r.name) });
});

app.get('/download/:id', async (req, res) => {
  const id = req.params.id;
  const db = await getDb();
  if (!db) return res.status(500).json({ error: 'DB not configured' });
  const [[patch]] = await db.execute('SELECT file_path, description FROM patches WHERE id = ? LIMIT 1', [id]);
  if (!patch) return res.status(404).json({ error: 'Not found' });
  res.download(patch.file_path);
});

// Add a .close() method for Jest test cleanup
app.close = async function() {
  if (dbPool && typeof dbPool.end === 'function') {
    try {
      await dbPool.end();
    } catch (e) {
      // ignore errors during cleanup
    }
    dbPool = null;
  }
};
app.getDb = getDb;
module.exports = app;
