const request = require('supertest');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
function authHeaderFor(username, role = 1) { return `Bearer ${jwt.sign({ id: 1, username, role }, JWT_SECRET)}`; }
const app = require('../app');

describe('Upload limits and validation', () => {
  afterAll(async () => {
    if (app && app.close) await app.close();
  });

  test('accepts small .vcv file', async () => {
    const buf = Buffer.from(JSON.stringify({ test: true }));
    const res = await request(app)
      .post('/upload')
      .set('Authorization', authHeaderFor('tester'))
      .attach('vcv', buf, 'small.vcv');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
  });

  test('rejects too large file', async () => {
    const big = Buffer.alloc(6 * 1024 * 1024, 0); // 6 MB
    const res = await request(app)
      .post('/upload')
      .set('Authorization', authHeaderFor('tester'))
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
      .set('Authorization', authHeaderFor('tester'))
      .attach('vcv', buf, 'bad.txt');

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
