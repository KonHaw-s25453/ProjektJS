const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  const host = process.env.DB_HOST || '127.0.0.1';
  const user = process.env.DB_USER || 'root';
  const pass = process.env.DB_PASS || '';
  const db = process.env.DB_NAME || 'vcv';

  const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined;
  const connOpts = { host, user, password: pass, multipleStatements: true };
  if (port) connOpts.port = port;
  const conn = await mysql.createConnection(connOpts);
  try {
    console.log('Creating database if not exists:', db);
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${db}\`;`);
    await conn.query(`USE \`${db}\`;`);
    console.log('Running schema.sql...');
    await conn.query(sql);
    console.log('Schema applied successfully.');
  } catch (err) {
    console.error('Error running migrations:', err);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

run();
