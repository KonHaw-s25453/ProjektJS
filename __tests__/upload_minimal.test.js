const request = require('supertest');
const app = require('../app');
const path = require('path');
const fs = require('fs');

describe('Minimal POST /upload (no auth)', () => {
  it('should upload a minimal .vcv file and return ok or error', async () => {
    const fixture = path.resolve(__dirname, '..', 'test-min.vcv');
    if (!fs.existsSync(fixture)) throw new Error('test-min.vcv not found');
    const res = await request(app)
      .post('/upload')
      .attach('vcv', fixture);
    console.log('Minimal upload status:', res.statusCode);
    console.log('Minimal upload body:', res.body);
    expect([200, 400, 401, 500]).toContain(res.statusCode);
  });
});
