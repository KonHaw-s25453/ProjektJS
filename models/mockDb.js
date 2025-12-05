const fs = require('fs');
const path = require('path');

const MOCK_DB_FILE = path.join(__dirname, '../data', 'mock_db.json');

function loadMock() {
  if (fs.existsSync(MOCK_DB_FILE)) {
    try { return JSON.parse(fs.readFileSync(MOCK_DB_FILE, 'utf8')); } catch (e) { }
  }
  return { patches: [], modules: [], patch_modules: [], categories: [], users: [], tags: [], patch_tags: [] };
}

function saveMock(state) {
  fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(state, null, 2));
}

module.exports = {
  loadMock,
  saveMock,
  MOCK_DB_FILE
};
