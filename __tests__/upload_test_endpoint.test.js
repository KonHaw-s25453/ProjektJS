const request = require('supertest');
const app = require('../app');
const path = require('path');

describe('Minimal upload /upload/test', () => {
  it('should upload a file and return ok', async () => {
    const res = await request(app)
      .post('/upload/test')
      .attach('file', path.join(__dirname, 'test.vcv'));
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('file', true);
  });
});
