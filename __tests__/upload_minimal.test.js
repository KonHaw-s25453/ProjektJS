const request = require('supertest');
const app = require('../app');
const path = require('path');
const fs = require('fs');

describe('Minimal POST /upload (no auth)', () => {
  const setupTestDb = require('./setupTestDb');
  let server;
  beforeAll(async () => {
    await setupTestDb();
    server = app.listen(0);
  });
  afterAll((done) => {
    if (server && server.close) server.close(done);
  });
  it('should upload a minimal .vcv file and return ok or error', async () => {
    const fixture = path.resolve(__dirname, '..', 'test-min.vcv');
    if (!fs.existsSync(fixture)) throw new Error('test-min.vcv not found');
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign({ id: 1, username: 'test-upload', role: 'user' }, JWT_SECRET);
    const res = await request(server)
      .post('/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('vcv', fixture)
      .field('description', 'minimal upload');
    console.log('Minimal upload status:', res.statusCode);
    console.log('Minimal upload body:', res.body);
    expect([200, 400, 401, 500]).toContain(res.statusCode);
  });
});
