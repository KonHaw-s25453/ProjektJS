const request = require('supertest');
const app = require('../app');

describe('POST /upload', () => {
  it('should respond with 400 if no file uploaded (minimal test)', async () => {
    const res = await request(app)
      .post('/upload')
      .send({});
    expect(res.statusCode).toBe(400);
  });
});
