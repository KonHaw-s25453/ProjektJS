const request = require('supertest');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { findUserByUsername, signToken } = require('../models/user');
async function authHeaderFor(username) {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'vcv',
  });
  const user = await findUserByUsername(db, username);
  await db.end();
  if (!user) throw new Error('User not found: ' + username);
  return `Bearer ${signToken(user)}`;
}
const app = require('../app');

describe('Upload limits and validation', () => {
  afterAll(async () => {
    if (app && typeof app.close === 'function') await app.close();
    if (global.dbPool && typeof global.dbPool.end === 'function') await global.dbPool.end();
  });

  test('accepts small .vcv file', async () => {
    const buf = Buffer.from(JSON.stringify({ test: true }));
    const res = await request(app)
      .post('/upload')
      .set('Authorization', await authHeaderFor('tester'))
      .attach('vcv', buf, 'small.vcv');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
  });

  test('rejects too large file', async () => {
    const big = Buffer.alloc(6 * 1024 * 1024, 0); // 6 MB
    const res = await request(app)
      .post('/upload')
      .set('Authorization', await authHeaderFor('tester'))
      .attach('vcv', big, 'big.vcv');

    // multer should trigger LIMIT_FILE_SIZE -> 413
    expect([413, 400]).toContain(res.statusCode);
    // If 413, expect file too large message
    if (res.statusCode === 413) expect(res.body).toHaveProperty('error', 'File too large');
  });

  test('rejects wrong extension', async () => {
    const buf = Buffer.from('not a vcv');
    const res = await request(app)
      .post('/upload')
      .set('Authorization', await authHeaderFor('tester'))
      .attach('vcv', buf, 'bad.txt');

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
