// Seed test users for permissions tests
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'vcv',
    multipleStatements: true
  });

  // Test users and roles
  const users = [
    {
      username: 'Własc',
      display_name: 'Właściciel',
      password: 'test123',
      role: 3
    },
    {
      username: 'Adm',
      display_name: 'Test Admin',
      password: 'test123',
      role: 2
    },
    {
      username: 'Usr',
      display_name: 'Test User',
      password: 'test123',
      role: 1
    },
    {
      username: 'tester',
      display_name: 'Test Upload',
      password: 'test123',
      role: 1
    }
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await db.execute(
      'INSERT INTO users (username, display_name, password_hash, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE display_name=VALUES(display_name), password_hash=VALUES(password_hash), role=VALUES(role)',
      [u.username, u.display_name, hash, u.role]
    );
  }

  await db.end();
  console.log('Seeded test users.');
}

run().catch(e => { console.error(e); process.exit(1); });
