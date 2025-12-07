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
const request = require('supertest');
const app = require('../app');

    const res = await request(global.__TEST_SERVER__).get(`/api/patch/${id}`);
  test('POST /api/user creates user', async () => {
    const res = await request(app)
      .post('/api/user')
      .send({ username: 'testuser', password: 'testpass' });
    expect([200, 201, 409]).toContain(res.statusCode); // 409 jeśli już istnieje
    expect(res.body).toHaveProperty('user');
  });
});
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user_name', 'apitest');
  });

  test('GET /api/patch/:id returns 404 for missing patch', async () => {
    const res = await request(global.__TEST_SERVER__).get('/api/patch/999999');
    expect(res.status).toBe(404);
  });
});
