const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
function authHeaderFor(username, role = 1) { return `Bearer ${jwt.sign({ id: 1, username, role }, JWT_SECRET)}`; }

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
    expect(patches.body).toHaveProperty('error');

    const upload = await request(app).post('/upload').set('Authorization', authHeaderFor('x')).field('user', 'x');
    // upload without file should still return 400 (file handling is independent)
    expect(upload.status).toBe(400);
  });
});
