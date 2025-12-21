console.log("CORE TEST FILE VERSION: 2025-12-14");
const request = require('supertest');
const app = require('../app');
const path = require('path');
const fs = require('fs');

describe('Core', () => {
  test('GET / returns ok', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
  });

  test('upload .vcv file', async () => {
    const res = await request(app)
      .post('/upload')
      .attach('vcv', Buffer.from(JSON.stringify({ test: true })), 'test.vcv');
    expect([200, 201, 401]).toContain(res.statusCode);
  });
});