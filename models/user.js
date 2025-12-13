// Model użytkownika i dostęp do bazy
const mysql = require('mysql2/promise');

let dbPool = null;
async function getDb() {
  if (!dbPool) {
    dbPool = await mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'vcv',
    });
    global.dbPool = dbPool;
  }
  return dbPool;
}

module.exports = { getDb };