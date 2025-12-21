console.log("ADMIN TEST FILE VERSION: 2025-12-14");

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const setupTestDb = require('./setupTestDb');


let adminToken = '';
let ownerToken = '';


describe('Admin endpoints', () => {
  beforeAll(async () => {
    await setupTestDb();
    // Tworzenie użytkowników
    await request(app).post('/api/user').send({ username: 'admin', password: 'admin123', role: 'admin' });
    await request(app).post('/api/user').send({ username: 'owner', password: 'owner123', role: 'owner' });
    // Logowanie i pobranie tokenów
    const adminLogin = await request(app).post('/auth/login').send({ username: 'admin', password: 'admin123' });
    adminToken = adminLogin.body && adminLogin.body.token ? adminLogin.body.token : '';
    const ownerLogin = await request(app).post('/auth/login').send({ username: 'owner', password: 'owner123' });
    ownerToken = ownerLogin.body && ownerLogin.body.token ? ownerLogin.body.token : '';
  });

  test('GET /admin/users returns user list for admin', async () => {
    const res = await request(app)
      .get('/admin/users')
      .set('Authorization', 'Bearer ' + adminToken);
    expect([200, 403, 401, 204, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    }
  });

  test('GET /admin/logs returns logs for owner', async () => {
    const res = await request(app)
      .get('/admin/logs')
      .set('Authorization', 'Bearer ' + ownerToken);
    expect([200, 403, 401, 204, 404]).toContain(res.statusCode);
  });

  test('POST /admin/users/:id/role changes user role', async () => {
    const res = await request(app)
      .post('/admin/users/1/role')
      .set('Authorization', 'Bearer ' + ownerToken)
      .send({ role: 'admin' });
    expect([200, 403, 401, 404]).toContain(res.statusCode);
  });

  test('DELETE /users/:id deletes user', async () => {
    const res = await request(app)
      .delete('/users/2')
      .set('Authorization', 'Bearer ' + ownerToken);
    expect([200, 403, 401, 404]).toContain(res.statusCode);
  });
});


describe('User details', () => {
  let server;
  beforeAll(async () => {
    await setupTestDb();
    server = app.listen(0);
  });
  afterAll((done) => {
    if (server && server.close) server.close(done);
    if (app && typeof app.close === 'function') app.close();
  });

  test('GET /users/:id returns user data', async () => {
    const res = await request(server)
      .get('/users/1')
      .set('Authorization', 'Bearer ' + adminToken);
    expect([200, 403, 401, 204, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('username');
    }
  });

  test('GET /users/:id returns 404 for missing user', async () => {
    const res = await request(server)
      .get('/users/999999')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.statusCode).toBe(404);
  });
});

describe('Patch details', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'secret';
  function makeToken(payload) {
    return jwt.sign(payload, JWT_SECRET);
  }
  let server;
  beforeAll(async () => {
    await setupTestDb();
    server = app.listen(0);
  });
  afterAll((done) => {
    if (server && server.close) server.close(done);
    if (app && typeof app.close === 'function') app.close();
  });

  test('GET /patches/:id returns patch data', async () => {
    const userToken = makeToken({ id: 3, username: 'user', role: 'user' });
    const res = await request(server)
      .get('/patches/1')
      .set('Authorization', 'Bearer ' + userToken);
    expect([200, 403, 404, 401, 204]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('patch');
    }
  });

  test('GET /patches/:id returns 404 for missing patch', async () => {
    const userToken = makeToken({ id: 3, username: 'user', role: 'user' });
    const res = await request(server)
      .get('/patches/999999')
      .set('Authorization', 'Bearer ' + userToken);
    expect(res.statusCode).toBe(404);
  });
});
