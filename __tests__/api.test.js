afterAll(async () => {
  if (global.__TEST_SERVER__ && global.__TEST_SERVER__.close) {
    try {
      await global.__TEST_SERVER__.close();
    } catch (e) {}
  }
  const app = require('../app');
  if (app && typeof app.close === 'function') await app.close();
});
const request = require('supertest');
const mysql = require('mysql2/promise');
const { addUser } = require('../models/user');
const app = require('../app');
let db;

beforeAll(async () => {
  const setupTestDb = require('./setupTestDb');
  await setupTestDb();
  db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'vcv',
  });
  await db.query('DELETE FROM users WHERE username = "apitest"');
  await db.query('DELETE FROM patches');
  await addUser(db, { username: 'apitest', passwordHash: 'test', display_name: 'ApiTest', role: 1 });
});

afterAll(async () => {
  await db.query('DELETE FROM users');
  await db.query('DELETE FROM patches');
  await db.end();
  if (app && typeof app.close === 'function') await app.close();
});

describe('API user endpoints', () => {
  test('POST /api/user creates user', async () => {
    const res = await request(global.__TEST_SERVER__)
      .post('/api/user')
      .send({ username: 'newuser', passwordHash: 'pass', display_name: 'NewUser', role: 1 });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('username', 'newuser');
  });

  test('GET /api/user/:name returns user', async () => {
    const res = await request(global.__TEST_SERVER__).get('/api/user/newuser');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('username', 'newuser');
  });

  test('GET /api/user/:name returns 404 for missing user', async () => {
    const res = await request(global.__TEST_SERVER__).get('/api/user/unknown');
    expect(res.status).toBe(404);
  });
});

describe('API patch endpoints', () => {
  test('POST /api/patch creates patch', async () => {
    const res = await request(global.__TEST_SERVER__)
      .post('/api/patch')
      .send({ user_name: 'apitest', category_id: 1, file_path: '/tmp/test.vcv', description: 'desc' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user_name', 'apitest');
    expect(res.body).toHaveProperty('description', 'desc');
  });

  test('GET /api/patch/:id returns patch', async () => {
    // Najpierw dodaj patch
    const addRes = await request(global.__TEST_SERVER__)
      .post('/api/patch')
      .send({ user_name: 'apitest', category_id: 1, file_path: '/tmp/test2.vcv', description: 'desc2' });
    const id = addRes.body.id || addRes.body.ID || addRes.body.patchId;
    const res = await request(global.__TEST_SERVER__).get(`/api/patch/${id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user_name', 'apitest');
  });

  test('GET /api/patch/:id returns 404 for missing patch', async () => {
    const res = await request(global.__TEST_SERVER__).get('/api/patch/999999');
    expect(res.status).toBe(404);
  });
});
