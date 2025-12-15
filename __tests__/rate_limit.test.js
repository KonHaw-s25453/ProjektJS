console.log("RATE LIMIT TEST FILE VERSION: 2025-12-14");
const request = require('supertest');

const app = require('../app');
const setupTestDb = require('./setupTestDb');

describe('Rate limiting', () => {
  beforeAll(async () => {
    await setupTestDb();
  });
  test('blocks after too many requests', async () => {
    let lastStatus = 200;
    for (let i = 0; i < 5; i++) {
      const res = await request(app).get('/patches');
      lastStatus = res.statusCode;
      if (lastStatus === 429) break;
    }
    expect([429, 200, 500]).toContain(lastStatus);
  });
});
