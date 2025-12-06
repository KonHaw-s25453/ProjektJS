const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

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
  await adminConn.end();
}

module.exports = setupTestDb;
