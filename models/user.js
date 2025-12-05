const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
}

const { loadMock, saveMock } = require('./mockDb');

function getUserByName(name) {
  const state = loadMock();
  return state.users.find(u => u.name === name) || null;
}

function addUser({ name, passwordHash }) {
  const state = loadMock();
  const id = state.users.length ? Math.max(...state.users.map(u => u.id)) + 1 : 1;
  const user = { id, name, passwordHash };
  state.users.push(user);
  saveMock(state);
  return user;
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

// Find user by username (for real DB, this should be async and use DB connection)
async function findUserByUsername(db, username) {
  if (!db) return null;
  const [[row]] = await db.execute('SELECT id, username, password_hash, role FROM users WHERE username = ? LIMIT 1', [username]);
  return row || null;
}

module.exports = {
  getUserByName,
  addUser,
  tryParseVCV,
  extractModules,
  findUserByUsername,
  signToken
};
