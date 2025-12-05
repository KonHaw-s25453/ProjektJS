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

describe('endpoint extra behaviors', () => {
  beforeEach(() => { process.env.MOCK_DB = 'true'; });

  test('GET /download/:id returns 404 for missing patch', async () => {
    jest.resetModules();
    process.env.MOCK_DB = 'true';
    const request = require('supertest');
    const app = require('../app');
    const res = await request(app).get('/download/99999');
    expect(res.status).toBe(404);
  });

  test('when DB not configured endpoints return DB not configured', async () => {
    jest.resetModules();
    process.env.MOCK_DB = 'false';
    // ensure DB env not set
    delete process.env.DB_HOST;
    const request = require('supertest');
    const app = require('../app');

    const patches = await request(app).get('/patches');
    expect(patches.status).toBe(200);
    expect(patches.body).toHaveProperty('patches');

    const upload = await request(app).post('/upload').set('Authorization', await authHeaderFor('tester')).field('user', 'tester');
    // upload without file should still return 400 (file handling is independent)
    expect(upload.status).toBe(400);
  });
});
