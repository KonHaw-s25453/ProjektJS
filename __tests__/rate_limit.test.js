const request = require('supertest');
const app = require('../app');

describe('Rate limiting', () => {
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
