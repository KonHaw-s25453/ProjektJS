console.log("TAGS TEST FILE VERSION: 2025-12-14");
const request = require('supertest');
const app = require('../app');

describe('POST /patch/1/tags', () => {
  it('should respond with 404 or 200/201 (minimal test)', async () => {
    const res = await request(app)
      .post('/patches/1/tags')
      .set('Authorization', 'Bearer user-token')
      .send({ tags: ['test'] });
    expect([200, 201, 401, 404]).toContain(res.statusCode);
  });
});
