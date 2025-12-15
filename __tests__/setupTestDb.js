console.log("SETUP TEST DB FILE VERSION: 2025-12-14");
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');


// Fabryka danych testowych
function testDataFactory() {
  return {
    categories: [
      { id: 1, name: 'Testowa kategoria' }
    ],
    users: [
      { id: 999, username: 'test-integration', display_name: 'Test Integration', password_hash: 'test', role: 1 }
    ]
  };
}

async function setupTestDb() {
  const dbName = process.env.DB_NAME || 'vcv';
  const adminConn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    multipleStatements: true
  });
  await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
  await adminConn.query(`USE \`${dbName}\`;`);
  const schema = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  await adminConn.query(schema);

  // Dodaj dane testowe
  const data = testDataFactory();
  for (const cat of data.categories) {
    await adminConn.query('INSERT IGNORE INTO categories (id, name) VALUES (?, ?)', [cat.id, cat.name]);
  }
  for (const user of data.users) {
    await adminConn.query('INSERT IGNORE INTO users (id, username, display_name, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [user.id, user.username, user.display_name, user.password_hash, user.role]);
  }
  await adminConn.end();
}


// Przykładowy test, aby plik nie był pusty
describe('setupTestDb', () => {
  it('should be a function', () => {
    expect(typeof setupTestDb).toBe('function');
  });
});

module.exports = setupTestDb;
