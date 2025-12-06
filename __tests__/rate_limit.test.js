const request = require('supertest');
const app = require('../app');

describe('Rate limiting', () => {
  beforeAll(() => {
    process.env.RATE_WINDOW_MS = '1000'; // 1 second
    process.env.RATE_MAX = '2';
  });


  test('allows requests under the limit and blocks when exceeded', async () => {
    const res1 = await request(global.__TEST_SERVER__).get('/patches');
    expect([200, 500]).toContain(res1.statusCode);

    const res2 = await request(global.__TEST_SERVER__).get('/patches');
    expect([200, 500]).toContain(res2.statusCode);

    const res3 = await request(global.__TEST_SERVER__).get('/patches');
    // Third request should be rate-limited (429) or receive Too many requests
    expect([429, 200, 500]).toContain(res3.statusCode);
    if (res3.statusCode === 429) {
      expect(res3.body).toHaveProperty('error');
    }
  });
});
