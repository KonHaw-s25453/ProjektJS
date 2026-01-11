const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const db = await mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'vcv',
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('Adding count column to patch_modules table...');

    // Add count column to patch_modules table
    await db.execute('ALTER TABLE patch_modules ADD COLUMN count INT NOT NULL DEFAULT 1');

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await db.end();
  }
}

if (require.main === module) {
  migrate();
}

module.exports = { migrate };