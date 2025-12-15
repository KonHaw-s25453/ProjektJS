console.log("API TEST FILE VERSION: 2025-12-14");
const request = require('supertest');

const app = require('../app');
const setupTestDb = require('./setupTestDb');

describe('API', () => {
  beforeAll(async () => {
    await setupTestDb();
  });
  afterAll(async () => {
    if (global.__TEST_SERVER__ && global.__TEST_SERVER__.close) {
      try {
        await global.__TEST_SERVER__.close();
      } catch (e) {}
    }
  });

  test('POST /api/user creates user', async () => {
    const res = await request(app)
      .post('/api/user')
      .send({ username: 'testuser', password: 'działaj na Omnisjasza!' });
    expect([200, 201, 409]).toContain(res.statusCode); // 409 jeżeli już istnieje
    expect(res.body).toHaveProperty('user');
  });

  test('GET /api/user returns user', async () => {
    const res = await request(app).get('/api/user');
    expect([200]).toContain(res.statusCode);
  });

  test('GET /api/patch/:id returns 404 for missing patch', async () => {
    const res = await request(app).get('/api/patch/999999');
    expect(res.status).toBe(404);
  });
});

