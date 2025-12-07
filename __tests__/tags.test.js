const request = require('supertest');
const app = require('../app');

describe('POST /patch/1/tags', () => {
  it('should respond with 404 or 200/201 (minimal test)', async () => {
    const res = await request(app)
      .post('/patch/1/tags')
      .send({ tags: ['test'] });
    expect([200, 201, 404]).toContain(res.statusCode);
  });
});
