const request = require('supertest');
const app = require('../app');
const path = require('path');

describe('Minimal upload /upload/test', () => {
  it('should upload a file and return ok', async () => {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
    const token = jwt.sign({ id: 1, username: 'test-upload', role: 'user' }, JWT_SECRET);
    // UWAGA: endpoint /upload/test oczekuje pola 'file', nie 'vcv'!
    const res = await request(app)
      .post('/upload/test')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', path.join(__dirname, '..', 'test-min.vcv'))
      .field('description', 'test endpoint upload');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('file', true);
  });
});
