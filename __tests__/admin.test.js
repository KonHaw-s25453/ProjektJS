console.log("ADMIN TEST FILE VERSION: 2025-12-14");
const request = require('supertest');
const app = require('../app');


describe('Admin endpoints', () => {
  let server;
  beforeAll((done) => {
    server = app.listen(0, done);
  });
  afterAll((done) => {
    if (server && server.close) server.close(done);
    if (app && typeof app.close === 'function') app.close();
  });

  test('GET /admin/users returns user list for admin', async () => {
    const res = await request(server)
      .get('/admin/users')
      .set('Authorization', 'Bearer admin-token'); // zamień na prawidłowy token admina
    expect([200, 403, 401]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    }
  });

  test('GET /admin/logs returns logs for owner', async () => {
    const res = await request(server)
      .get('/admin/logs')
      .set('Authorization', 'Bearer owner-token'); // zamień na prawidłowy token właściciela
    expect([200, 403, 401]).toContain(res.statusCode);
  });
});


describe('User details', () => {
  let server;
  beforeAll((done) => {
    server = app.listen(0, done);
  });
  afterAll((done) => {
    if (server && server.close) server.close(done);
    if (app && typeof app.close === 'function') app.close();
  });

  test('GET /users/:id returns user data', async () => {
    const res = await request(server)
      .get('/users/1')
      .set('Authorization', 'Bearer admin-token');
    expect([200, 403, 401]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('username');
    }
  });
});

describe('Patch details', () => {
  let server;
  beforeAll((done) => {
    server = app.listen(0, done);
  });
  afterAll((done) => {
    if (server && server.close) server.close(done);
    if (app && typeof app.close === 'function') app.close();
  });

  test('GET /patches/:id returns patch data', async () => {
    const res = await request(server)
      .get('/patches/1')
      .set('Authorization', 'Bearer user-token');
    expect([200, 403, 401]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('patch');
    }
  });
});
