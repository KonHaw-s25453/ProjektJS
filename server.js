const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

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

const upload = multer({ storage });

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let dbPool = null;
const MOCK_DB = process.env.MOCK_DB === '1' || process.env.MOCK_DB === 'true';

// Simple file-backed mock DB for testing without MySQL
const MOCK_DB_FILE = path.join(__dirname, 'data', 'mock_db.json');
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
function loadMock() {
  if (fs.existsSync(MOCK_DB_FILE)) {
    try { return JSON.parse(fs.readFileSync(MOCK_DB_FILE, 'utf8')); } catch (e) { }
  }
  return { patches: [], modules: [], patch_modules: [], categories: [], users: [] };
}
function saveMock(state) { fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(state, null, 2)); }

async function getDb() {
  if (MOCK_DB) {
    // lightweight mock interface used by handlers
    const state = loadMock();
    return {
      // emulate pool.execute returning [rows]
      execute: async (sql, params = []) => {
        const s = sql.trim().toUpperCase();
        // handle SELECT * FROM patches WHERE id = ? LIMIT 1
        if (s.startsWith('SELECT * FROM PATCHES')) {
          const id = params[0];
          const patch = state.patches.find(p => String(p.id) === String(id));
          return [[patch || null], null];
        }
        // handle SELECT p.id, p.user_name... FROM PATCHES p WHERE 1=1 ... ORDER BY
        if (s.indexOf('FROM PATCHES P WHERE') !== -1) {
          // apply very basic filters by user and category
          let rows = state.patches.slice().sort((a,b)=> new Date(b.uploaded_at) - new Date(a.uploaded_at));
          // very naive filtering by params order used in server.js
          // params may contain user, category, since in that order
          if (params && params.length) {
            if (params[0]) rows = rows.filter(r => r.user_name === params[0]);
            if (params[1]) rows = rows.filter(r => String(r.category_id) === String(params[1]));
            if (params[2]) rows = rows.filter(r => new Date(r.uploaded_at) >= new Date(params[2]));
          }
          // add module_count
          const enriched = rows.map(r => ({ ...r, module_count: state.patch_modules.filter(pm => pm.patch_id === r.id).length }));
          return [enriched.slice(0,200), null];
        }
        // SELECT id FROM modules WHERE plugin = ? AND model = ? LIMIT 1
        if (s.startsWith('SELECT ID FROM MODULES WHERE')) {
          const [plugin, model] = params;
          const m = state.modules.find(x => x.plugin === plugin && x.model === model);
          return [[...(m ? [{ id: m.id }] : [])], null];
        }
        // fallback empty
        return [[], null];
      },
      // simple connection emulation used in upload flow
      getConnection: async () => ({
        beginTransaction: async () => {},
        commit: async () => {},
        rollback: async () => {},
        release: () => {},
        execute: async (sql, params = []) => {
          const s = sql.trim().toUpperCase();
          // INSERT INTO patches ... VALUES (?, ?, ?, ?, NOW())
          if (s.startsWith('INSERT INTO PATCHES')) {
            const [user, category_id, file_path, description] = params;
            const id = state.patches.length ? Math.max(...state.patches.map(p=>p.id)) + 1 : 1;
            const uploaded_at = new Date().toISOString();
            const p = { id, user_name: user, category_id: category_id || null, file_path, description, uploaded_at };
            state.patches.push(p);
            saveMock(state);
            return [{ insertId: id }, null];
          }
          // INSERT INTO modules (plugin, model)
          if (s.startsWith('INSERT INTO MODULES')) {
            const [plugin, model] = params;
            const id = state.modules.length ? Math.max(...state.modules.map(m=>m.id)) + 1 : 1;
            state.modules.push({ id, plugin, model });
            saveMock(state);
            return [{ insertId: id }, null];
          }
          // INSERT INTO patch_modules (patch_id, module_id)
          if (s.startsWith('INSERT INTO PATCH_MODULES')) {
            const [patch_id, module_id] = params;
            state.patch_modules.push({ patch_id, module_id });
            saveMock(state);
            return [{ affectedRows: 1 }, null];
          }
          // SELECT id FROM modules handled above in pool.execute
          return [[], null];
        }
      })
    };
  }

  if (dbPool) return dbPool;
  if (!process.env.DB_HOST) return null;
  const dbHost = process.env.DB_HOST || '127.0.0.1';
  const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined;
  const poolConfig = {
    host: dbHost,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'vcv',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
  if (dbPort) poolConfig.port = dbPort;
  dbPool = await mysql.createPool(poolConfig);
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
    // Maybe it's already JSON
    try {
      const text = buffer.toString('utf8');
      return JSON.parse(text);
    } catch (err) {
      return null;
    }
  }
}

function extractModules(parsed) {
  const modules = [];
  if (!parsed) return modules;

  // heuristic: look for arrays/objects with plugin & model
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      obj.forEach(walk);
      return;
    }
    if (obj.plugin && obj.model) {
      modules.push({ plugin: obj.plugin, model: obj.model });
    }
    for (const k of Object.keys(obj)) walk(obj[k]);
  }
  walk(parsed);
  // dedupe
  const seen = new Set();
  return modules.filter(m => {
    const key = `${m.plugin}::${m.model}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

app.post('/upload', upload.single('vcv'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded (field name "vcv")' });

    const { category = null, description = null, user = null } = req.body;

    const buffer = fs.readFileSync(file.path);
    const parsed = tryParseVCV(buffer);
    const modules = extractModules(parsed);

    const db = await getDb();
    let patchId = null;
    if (db) {
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();
        const [result] = await conn.execute(
          'INSERT INTO patches (user_name, category_id, file_path, description, uploaded_at) VALUES (?, ?, ?, ?, NOW())',
          [user, category, file.path, description]
        );
        patchId = result.insertId;

        for (const m of modules) {
          // ensure module exists
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
        await conn.rollback();
        console.error('DB transaction failed', err);
      } finally {
        conn.release();
      }
    }

    res.json({ ok: true, parsed: !!parsed, modules, patchId, path: file.path });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed', details: String(err) });
  }
});

app.get('/patches', async (req, res) => {
  const { user, category, module, since } = req.query;
  const db = await getDb();
  if (!db) return res.json({ error: 'DB not configured', patches: [] });

  // basic query with optional filters
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
  res.json({ patch, modules: mods });
});

app.get('/download/:id', async (req, res) => {
  const id = req.params.id;
  const db = await getDb();
  if (!db) return res.status(500).json({ error: 'DB not configured' });
  const [[patch]] = await db.execute('SELECT file_path, description FROM patches WHERE id = ? LIMIT 1', [id]);
  if (!patch) return res.status(404).json({ error: 'Not found' });
  res.download(patch.file_path);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
