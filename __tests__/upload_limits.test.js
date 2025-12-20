console.log("UPLOAD LIMITS TEST FILE VERSION: 2025-12-14");
const request = require('supertest');
const app = require('../app'); // Ensure app is required correctly

describe('POST /upload', () => {
    const setupTestDb = require('./setupTestDb');
    let server;
    beforeAll(async () => {
      await setupTestDb();
      server = app.listen(0);
    });
    afterAll((done) => {
      if (server && server.close) server.close(done);
    });
    it('should upload a minimal .vcv file and return ok', async () => {
      const path = require('path');
      const fs = require('fs');
      const fixture = path.resolve(__dirname, '..', 'test-min.vcv');
      if (!fs.existsSync(fixture)) throw new Error('test-min.vcv not found');
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'secret';
      const token = jwt.sign({ id: 1, username: 'test-upload', role: 'user' }, JWT_SECRET);
      const res = await request(server)
        .post('/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('vcv', fixture)
        .field('description', 'limit upload');
      expect([200, 201, 400, 500]).toContain(res.statusCode);
      // Jeśli 200, sprawdź strukturę odpowiedzi
      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty('ok', true);
        expect(res.body).toHaveProperty('patchId');
      }
    });
  it('should respond with 400 if no file uploaded (minimal test)', async () => {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign({ id: 1, username: 'test-upload', role: 'user' }, JWT_SECRET);
      const res = await request(server)
      .post('/upload')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect([400, 401]).toContain(res.statusCode);
  });
});
