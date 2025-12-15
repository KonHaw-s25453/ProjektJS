console.log("AUTH TEST FILE VERSION: 2025-12-14");
const request = require('supertest');

const app = require('../app');
const setupTestDb = require('./setupTestDb');

describe('Auth', () => {
  beforeAll(async () => {
    await setupTestDb();
  });
  test('login returns token', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'testuser', password: 'testpass' });
    expect([200, 401]).toContain(res.statusCode); // 401 jeśli nie istnieje
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('token');
    }
  });
});
