console.log("ENDPOINTS EXTRA TEST FILE VERSION: 2025-12-14");
const request = require('supertest');
const app = require('../app');

describe('Endpoints Extra', () => {
  test('GET /download/:id returns 404 for missing patch', async () => {
    const res = await request(app).get('/download/99999');
    expect(res.statusCode).toBe(401);
  });
});