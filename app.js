const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const UPLOAD_DIR = path.join(__dirname, 'uploads', 'patches');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const id = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${id}-${file.originalname}`);
  }
});

// Accept only .vcv files and limit size to 5 MB
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (ext !== '.vcv') return cb(new Error('Invalid file type, only .vcv allowed'));
    cb(null, true);
  }
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let dbPool = null;
const MOCK_DB = process.env.MOCK_DB === '1' || process.env.MOCK_DB === 'true';
let currentDbName = process.env.DB_NAME || null;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Rate limiter config (can be tuned via env vars)
const RATE_WINDOW_MS = process.env.RATE_WINDOW_MS ? parseInt(process.env.RATE_WINDOW_MS, 10) : 60 * 1000; // default 1 minute
const RATE_MAX = process.env.RATE_MAX ? parseInt(process.env.RATE_MAX, 10) : 10; // default max requests per window
const limiter = rateLimit({
  windowMs: RATE_WINDOW_MS,
  max: RATE_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' }
});

// Simple file-backed mock DB for testing without MySQL
const MOCK_DB_FILE = path.join(__dirname, 'data', 'mock_db.json');
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
function loadMock() {
  if (fs.existsSync(MOCK_DB_FILE)) {
    try { return JSON.parse(fs.readFileSync(MOCK_DB_FILE, 'utf8')); } catch (e) { }
  }
  return { patches: [], modules: [], patch_modules: [], categories: [], users: [], tags: [], patch_tags: [] };
}
function saveMock(state) { fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(state, null, 2)); }

async function getDb() {
  if (MOCK_DB) {
    const state = loadMock();
    return {
      execute: async (sql, params = []) => {
        const s = sql.trim().toUpperCase();
        // handle module list for a given patch (JOIN query)
        if (s.indexOf('FROM MODULES') !== -1 && s.indexOf('JOIN PATCH_MODULES') !== -1) {
          const patchId = params[0];
          const moduleIds = state.patch_modules.filter(pm => String(pm.patch_id) === String(patchId)).map(pm => pm.module_id);
          const mods = state.modules.filter(m => moduleIds.includes(m.id)).map(m => ({ plugin: m.plugin, model: m.model, link: 'https://vcvrack.com/plugins.html?plugin=' + m.plugin }));
          return [mods, null];
        }
        // SELECT file_path, description FROM patches WHERE id = ?
        if (s.startsWith('SELECT FILE_PATH') && s.indexOf('FROM PATCHES') !== -1 && s.indexOf('WHERE') !== -1) {
          const id = params[0];
          const patch = state.patches.find(p => String(p.id) === String(id));
          if (patch) return [[{ file_path: patch.file_path, description: patch.description }], null];
          return [[null], null];
        }

        if (s.startsWith('SELECT * FROM PATCHES')) {
          const id = params[0];
          const patch = state.patches.find(p => String(p.id) === String(id));
          return [[patch || null], null];
        }

              if (s.indexOf('FROM PATCHES P WHERE') !== -1) {
                let rows = state.patches.slice().sort((a,b)=> new Date(b.uploaded_at) - new Date(a.uploaded_at));
                if (params && params.length) {
                  if (params[0]) rows = rows.filter(r => r.user_name === params[0]);
                  if (params[1]) rows = rows.filter(r => String(r.category_id) === String(params[1]));
                  if (params[2]) rows = rows.filter(r => new Date(r.uploaded_at) >= new Date(params[2]));
                }
                const enriched = rows.map(r => ({ ...r, module_count: state.patch_modules.filter(pm => String(pm.patch_id) === String(r.id)).length }));
                return [enriched.slice(0,200), null];
              }
        if (s.startsWith('SELECT ID FROM MODULES WHERE')) {
          const [plugin, model] = params;
          const m = state.modules.find(x => x.plugin === plugin && x.model === model);
          return [[...(m ? [{ id: m.id }] : [])], null];
        }
        // tags JOIN patch_tags for a given patch
        if (s.indexOf('FROM TAGS') !== -1 && s.indexOf('JOIN PATCH_TAGS') !== -1) {
          const patchId = params[0];
          const tagIds = state.patch_tags.filter(pt => String(pt.patch_id) === String(patchId)).map(pt => pt.tag_id);
          const tags = state.tags.filter(t => tagIds.includes(t.id)).map(t => ({ name: t.name }));
          return [tags, null];
        }
        // select patch_id from patch_tags by tag_id
        if (s.startsWith('SELECT PATCH_ID FROM PATCH_TAGS')) {
          const tagId = params[0];
          const rows = state.patch_tags.filter(pt => String(pt.tag_id) === String(tagId)).map(pt => ({ patch_id: pt.patch_id }));
          return [rows, null];
        }
        // select id from tags where name = ?
        if (s.startsWith('SELECT ID FROM TAGS WHERE')) {
          const name = params[0];
          const t = state.tags.find(x => x.name === name);
          return [[...(t ? [{ id: t.id }] : [])], null];
        }
        return [[], null];
      },
      getConnection: async () => ({
        beginTransaction: async () => {},
        commit: async () => {},
        rollback: async () => {},
        release: () => {},
        execute: async (sql, params = []) => {
          const s = sql.trim().toUpperCase();
          // handle module list for a given patch (JOIN query)
          if (s.indexOf('FROM MODULES') !== -1 && s.indexOf('JOIN PATCH_MODULES') !== -1) {
            const patchId = params[0];
            const moduleIds = state.patch_modules.filter(pm => String(pm.patch_id) === String(patchId)).map(pm => pm.module_id);
            const mods = state.modules.filter(m => moduleIds.includes(m.id)).map(m => ({ plugin: m.plugin, model: m.model, link: 'https://vcvrack.com/plugins.html?plugin=' + m.plugin }));
            return [mods, null];
          }
          if (s.startsWith('INSERT INTO PATCHES')) {
            const [user, category_id, file_path, description] = params;
            const id = state.patches.length ? Math.max(...state.patches.map(p=>p.id)) + 1 : 1;
            const uploaded_at = new Date().toISOString();
            const p = { id, user_name: user, category_id: category_id || null, file_path, description, uploaded_at };
            state.patches.push(p);
            saveMock(state);
            return [{ insertId: id }, null];
          }
          if (s.startsWith('INSERT INTO MODULES')) {
            const [plugin, model] = params;
            const id = state.modules.length ? Math.max(...state.modules.map(m=>m.id)) + 1 : 1;
            state.modules.push({ id, plugin, model });
            saveMock(state);
            return [{ insertId: id }, null];
          }
          // INSERT INTO tags (name)
          if (s.startsWith('INSERT INTO TAGS')) {
            const [name] = params;
            const id = state.tags.length ? Math.max(...state.tags.map(t=>t.id)) + 1 : 1;
            state.tags.push({ id, name });
            saveMock(state);
            return [{ insertId: id }, null];
          }
          // SELECT id FROM tags WHERE name = ?
          if (s.startsWith('SELECT ID FROM TAGS WHERE')) {
            const [name] = params;
            const t = state.tags.find(x => x.name === name);
            return [[...(t ? [{ id: t.id }] : [])], null];
          }
          if (s.startsWith('INSERT INTO PATCH_MODULES')) {
            const [patch_id, module_id] = params;
            state.patch_modules.push({ patch_id, module_id });
            saveMock(state);
            return [{ affectedRows: 1 }, null];
          }
          // INSERT INTO PATCH_TAGS (patch_id, tag_id)
          if (s.startsWith('INSERT INTO PATCH_TAGS')) {
            const [patch_id, tag_id] = params;
            state.patch_tags.push({ patch_id, tag_id });
            saveMock(state);
            return [{ affectedRows: 1 }, null];
          }
          return [[], null];
        }
      })
    };
  }

  if (dbPool) return dbPool;
  // If DB_NAME changed after a pool was created in a different test/setup,
  // recreate the pool so tests that set env before requiring app work correctly.
  if (!process.env.DB_HOST) return null;
  if (currentDbName && process.env.DB_NAME && currentDbName !== process.env.DB_NAME) {
    try {
      await dbPool.end();
    } catch (e) { /* ignore */ }
    dbPool = null;
  }
  const dbHost = process.env.DB_HOST ? String(process.env.DB_HOST).trim() : '127.0.0.1';
  const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined;
  const poolConfig = {
    host: dbHost,
    user: process.env.DB_USER ? String(process.env.DB_USER).trim() : 'root',
    password: process.env.DB_PASS ? String(process.env.DB_PASS).trim() : '',
    database: process.env.DB_NAME || 'vcv',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
  if (dbPort) poolConfig.port = dbPort;
  dbPool = await mysql.createPool(poolConfig);
  console.log('Created DB pool with config:', { host: poolConfig.host, port: poolConfig.port, database: poolConfig.database, user: poolConfig.user });
  currentDbName = poolConfig.database;
  return dbPool;
}

function tryParseVCV(buffer) {
  try {
    const inflated = zlib.inflateSync(buffer);
    const text = inflated.toString('utf8');
    try {
      return JSON.parse(text);
    } catch (e) {
      return { raw: text };
    }
  } catch (e) {
    try {
      const text = buffer.toString('utf8');
      return JSON.parse(text);
    } catch (err) {
      return null;
    }
  }
}

// --- Authentication helpers ---
async function findUserByUsername(db, username) {
  if (MOCK_DB) {
    const state = loadMock();
    const u = (state.users || []).find(x => String(x.username) === String(username));
    return u ? { id: u.id, username: u.username, password_hash: u.password_hash, role: u.role } : null;
  }
  const [[row]] = await db.execute('SELECT id, username, password_hash, role FROM users WHERE username = ? LIMIT 1', [username]);
  return row || null;
}

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
}

function requireAuth(req, res, next) {
  const auth = req.headers && req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing Authorization Bearer token' });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, username: payload.username, role: payload.role };
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(minRole) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if ((req.user.role || 0) < minRole) return res.status(403).json({ error: 'Insufficient role' });
    return next();
  };
}

function allowOwnerOrAdmin(getOwnerUsername) {
  return async (req, res, next) => {
    // must be authenticated
    const auth = req.headers && req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
    try {
      const payload = jwt.verify(auth.slice(7), JWT_SECRET);
      req.user = { id: payload.id, username: payload.username, role: payload.role };
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const owner = await getOwnerUsername(req);
    if (!owner) return res.status(404).json({ error: 'Resource owner not found' });
    if (req.user.role >= 2 || req.user.username === owner) return next();
    return res.status(403).json({ error: 'Forbidden' });
  };
}

// Auth routes
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Provide username and password' });
  const db = await getDb();
  if (!db) return res.status(500).json({ error: 'DB not configured' });
  try {
    const user = await findUserByUsername(db, username);
    if (!user || !user.password_hash) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken(user);
    res.json({ ok: true, token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (e) {
    console.error('Login failed', e);
    res.status(500).json({ error: 'Login failed' });
  }
});

// List users (admin+)
app.get('/users', requireAuth, requireRole(2), async (req, res) => {
  const db = await getDb();
  if (!db) return res.status(500).json({ error: 'DB not configured' });
  if (MOCK_DB) {
    const state = loadMock();
    return res.json({ users: state.users || [] });
  }
  const [rows] = await db.execute('SELECT id, username, display_name, role, created_at FROM users');
  res.json({ users: rows });
});

// Promote/demote user (owner only)
app.post('/users/:username/role', requireAuth, async (req, res) => {
  if ((req.user || {}).role !== 3) return res.status(403).json({ error: 'Owner role required' });
  const target = req.params.username;
  const { role } = req.body || {};
  if (typeof role !== 'number' || role < 0 || role > 3) return res.status(400).json({ error: 'Invalid role' });
  const db = await getDb();
  if (!db) return res.status(500).json({ error: 'DB not configured' });
  if (MOCK_DB) {
    const state = loadMock();
    const u = state.users.find(x => x.username === target);
    if (!u) return res.status(404).json({ error: 'User not found' });
    u.role = role; saveMock(state); return res.json({ ok: true, user: u });
  }
  await db.execute('UPDATE users SET role = ? WHERE username = ?', [role, target]);
  res.json({ ok: true });
});

// Delete user (admin or owner)
app.delete('/users/:username', requireAuth, async (req, res) => {
  const requester = req.user;
  const targetName = req.params.username;
  const db = await getDb();
  if (!db) return res.status(500).json({ error: 'DB not configured' });
  // find target
  let target;
  if (MOCK_DB) {
    const state = loadMock();
    target = state.users.find(u => u.username === targetName);
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (requester.role === 2 && target.role >= 2) return res.status(403).json({ error: 'Admins cannot delete other admins or owner' });
    if (requester.role < 2) return res.status(403).json({ error: 'Admin or owner required' });
    // owner can delete admins too
    state.users = state.users.filter(u => u.username !== targetName);
    saveMock(state);
    return res.json({ ok: true });
  }
  const [[trow]] = await db.execute('SELECT id, role FROM users WHERE username = ? LIMIT 1', [targetName]);
  if (!trow) return res.status(404).json({ error: 'User not found' });
  if (requester.role === 2 && trow.role >= 2) return res.status(403).json({ error: 'Admins cannot delete other admins or owner' });
  if (requester.role < 2) return res.status(403).json({ error: 'Admin or owner required' });
  await db.execute('DELETE FROM users WHERE username = ?', [targetName]);
  res.json({ ok: true });
});

function extractModules(parsed) {
  const modules = [];
  if (!parsed) return modules;
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj.plugin && obj.model) { modules.push({ plugin: obj.plugin, model: obj.model }); }
    for (const k of Object.keys(obj)) walk(obj[k]);
  }
  walk(parsed);
  const seen = new Set();
  return modules.filter(m => {
    const key = `${m.plugin}::${m.model}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// apply limiter to upload route
app.post('/upload', limiter, upload.single('vcv'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded (field name "vcv")' });
    const { category = null, description = null, user = null } = req.body;
    // prefer authenticated user if present
    const authUser = req.user && req.user.username ? req.user.username : user;
    const buffer = fs.readFileSync(file.path);
    const parsed = tryParseVCV(buffer);
    const modules = extractModules(parsed);
    const db = await getDb();
    let patchId = null;
    if (db) {
      const conn = await db.getConnection();
      try {
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
        console.error('DB transaction failed', err);
        conn.release();
        return res.status(500).json({ error: 'DB transaction failed', details: String(err) });
      } finally {
        // release only if not released above
        try { conn.release(); } catch (e) { /* ignore */ }
      }
    }
    res.json({ ok: true, parsed: !!parsed, modules, patchId, path: file.path });
  } catch (err) {
    console.error(err);
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

// Delete a patch (owner or admin)
app.delete('/patches/:id', allowOwnerOrAdmin(async (req) => {
  const id = req.params.id;
  const db = await getDb();
  if (MOCK_DB) {
    const state = loadMock();
    const p = state.patches.find(x => String(x.id) === String(id));
    return p ? p.user_name : null;
  }
  const [[row]] = await db.execute('SELECT user_name FROM patches WHERE id = ? LIMIT 1', [id]);
  return row ? row.user_name : null;
}), async (req, res) => {
  const id = req.params.id;
  const db = await getDb();
  if (MOCK_DB) {
    const state = loadMock();
    state.patches = state.patches.filter(x => String(x.id) !== String(id));
    state.patch_modules = state.patch_modules.filter(pm => String(pm.patch_id) !== String(id));
    state.patch_tags = state.patch_tags.filter(pt => String(pt.patch_id) !== String(id));
    saveMock(state);
    return res.json({ ok: true });
  }
  await db.execute('DELETE FROM patch_tags WHERE patch_id = ?', [id]);
  await db.execute('DELETE FROM patch_modules WHERE patch_id = ?', [id]);
  await db.execute('DELETE FROM patches WHERE id = ?', [id]);
  res.json({ ok: true });
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

module.exports = app;
// export helper functions for unit testing
module.exports.tryParseVCV = tryParseVCV;
module.exports.extractModules = extractModules;
// graceful shutdown helper for tests/CI
module.exports.close = async () => {
  try {
    if (dbPool) {
      await dbPool.end();
      dbPool = null;
    }
  } catch (e) {
    console.error('Error closing DB pool', e);
  }
};
