const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const sqlPath = path.join(__dirname, '..', 'seeds.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('seeds.sql not found');
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const host = process.env.DB_HOST || '127.0.0.1';
  const user = process.env.DB_USER || 'root';
  const pass = process.env.DB_PASS || '';
  const db = process.env.DB_NAME || 'vcv';

  const conn = await mysql.createConnection({ host, user, password: pass, database: db, multipleStatements: true });
  try {
    console.log('Applying seeds...');
    await conn.query(sql);
    console.log('Seeds applied successfully.');
  } catch (err) {
    console.error('Error applying seeds:', err);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

run();
