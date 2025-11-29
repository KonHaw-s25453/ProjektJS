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

  // Helper: attempt connection with retries to handle transient errors (ECONNRESET)
  const maxAttempts = 5;
  let attempt = 0;
  let conn = null;
  const connOpts = { host, user, password: pass, database: db, multipleStatements: true, connectTimeout: 10000 };

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      console.log(`Attempt ${attempt} - connecting to ${host}:${process.env.DB_PORT || 3306} as ${user}`);
      conn = await mysql.createConnection(connOpts);
      break;
    } catch (err) {
      console.error(`Connection attempt ${attempt} failed:`, err.code || err.message);
      if (attempt >= maxAttempts) {
        console.error('Exceeded maximum connection attempts. Giving up.');
        process.exit(1);
      }
      // wait before retrying
      await new Promise(r => setTimeout(r, 1500 * attempt));
    }
  }

  try {
    console.log('Applying seeds...');
    await conn.query(sql);
    console.log('Seeds applied successfully.');
  } catch (err) {
    console.error('Error applying seeds:', err);
    process.exit(1);
  } finally {
    try { if (conn) await conn.end(); } catch (e) {}
  }
}

run();
