
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
}

// Async: pobierz użytkownika po nazwie z MySQL
async function getUserByName(db, username) {
  if (!db) return null;
  const [[row]] = await db.execute('SELECT id, username, password_hash, role FROM users WHERE username = ? LIMIT 1', [username]);
  return row || null;
}

// Async: dodaj użytkownika do MySQL
async function addUser(db, { username, passwordHash, display_name = null, role = 1 }) {
  if (!db) throw new Error('Brak połączenia z bazą');
  const [result] = await db.execute(
    'INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)',
    [username, passwordHash, display_name, role]
  );
  const id = result.insertId;
  return { id, username, passwordHash, display_name, role };
}


function tryParseVCV(buffer) {
  const zlib = require('zlib');
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


module.exports = {
  getUserByName,
  addUser,
  tryParseVCV,
  extractModules,
  signToken
};
