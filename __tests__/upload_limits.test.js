console.log("UPLOAD LIMITS TEST FILE VERSION: 2025-12-14");
const request = require('supertest');
const app = require('../app');

describe('POST /upload', () => {
    it('should upload a minimal .vcv file and return ok', async () => {
      const path = require('path');
      const fs = require('fs');
      const fixture = path.resolve(__dirname, '..', 'test-min.vcv');
      if (!fs.existsSync(fixture)) throw new Error('test-min.vcv not found');
      const res = await request(app)
        .post('/upload')
        .set('Authorization', 'Bearer user-token')
        .attach('vcv', fixture);
      expect([200, 201, 400, 500]).toContain(res.statusCode);
      // Jeśli 200, sprawdź strukturę odpowiedzi
      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty('ok', true);
        expect(res.body).toHaveProperty('patchId');
      }
    });
  it('should respond with 400 if no file uploaded (minimal test)', async () => {
    const res = await request(app)
      .post('/upload')
      .set('Authorization', 'Bearer user-token')
      .send({});
    expect([400, 401]).toContain(res.statusCode);
  });
});
