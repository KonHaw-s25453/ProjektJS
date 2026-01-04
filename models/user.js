// Model użytkownika i dostęp do bazy
const mysql = require('mysql2/promise');

let dbPool = null;
async function getDb() {
  if (!dbPool) {
    try {
      dbPool = await mysql.createPool({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'vcv',
        port: process.env.DB_PORT || 3306,
      });
      global.dbPool = dbPool;
      console.log('Database pool created successfully');
    } catch (error) {
      console.error('Error creating database pool:', error);
      throw error;
    }
  }
  return dbPool;
}

module.exports = { getDb };