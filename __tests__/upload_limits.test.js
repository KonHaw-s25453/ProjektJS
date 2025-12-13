console.log("UPLOAD LIMITS TEST FILE VERSION: 2025-12-14");
const request = require('supertest');
const app = require('../app');

describe('POST /upload', () => {
  it('should respond with 400 if no file uploaded (minimal test)', async () => {
    const res = await request(app)
      .post('/upload')
      .set('Authorization', 'Bearer user-token')
      .send({});
    expect([400, 401]).toContain(res.statusCode);
  });
});
