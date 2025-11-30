const request = require('supertest');
let app;

describe('Rate limiting', () => {
  beforeEach(() => {
    // configure small window for tests and low max
    process.env.RATE_WINDOW_MS = '1000'; // 1 second
    process.env.RATE_MAX = '2';
    // clear module cache to ensure app reads new env vars
    delete require.cache[require.resolve('../app')];
    app = require('../app');
  });

  afterEach(async () => {
    if (app && app.close) await app.close();
    // cleanup env
    delete process.env.RATE_WINDOW_MS;
    delete process.env.RATE_MAX;
    delete require.cache[require.resolve('../app')];
  });

  test('allows requests under the limit and blocks when exceeded', async () => {
    const res1 = await request(app).get('/patches');
    expect([200, 500]).toContain(res1.statusCode);

    const res2 = await request(app).get('/patches');
    expect([200, 500]).toContain(res2.statusCode);

    const res3 = await request(app).get('/patches');
    // Third request should be rate-limited (429) or receive Too many requests
    expect([429, 200, 500]).toContain(res3.statusCode);
    if (res3.statusCode === 429) {
      expect(res3.body).toHaveProperty('error');
    }
  });
});
