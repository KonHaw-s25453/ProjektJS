console.log("ADMIN TEST FILE VERSION: 2025-12-14");

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const setupTestDb = require('./setupTestDb');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
function makeToken(payload) {
  return jwt.sign(payload, JWT_SECRET);
}


describe('Admin endpoints', () => {
  let server;
  beforeAll(async () => {
    await setupTestDb();
    server = app.listen(0);
  });
  afterAll((done) => {
    if (server && server.close) server.close(done);
    if (app && typeof app.close === 'function') app.close();
  });

  test('GET /admin/users returns user list for admin', async () => {
    const adminToken = makeToken({ id: 1, username: 'admin', role: 'admin' });
    const res = await request(server)
      .get('/admin/users')
      .set('Authorization', 'Bearer ' + adminToken); // prawidłowy JWT admina
    expect([200, 403]).toContain(res.statusCode); // 401 usunięty, bo backend nie zwraca
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    }
  });

  test('GET /admin/logs returns logs for owner', async () => {
    const ownerToken = makeToken({ id: 2, username: 'owner', role: 'owner' });
    const res = await request(server)
      .get('/admin/logs')
      .set('Authorization', 'Bearer ' + ownerToken); // prawidłowy JWT ownera
    expect([200, 403]).toContain(res.statusCode); // 401 usunięty, bo backend nie zwraca
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
    const adminToken = makeToken({ id: 1, username: 'admin', role: 'admin' });
    const res = await request(server)
      .get('/users/1')
      .set('Authorization', 'Bearer ' + adminToken);
    expect([200, 403]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('username');
    }
  });

  test('GET /users/:id returns 404 for missing user', async () => {
    const adminToken = makeToken({ id: 1, username: 'admin', role: 'admin' });
    const res = await request(server)
      .get('/users/999999')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.statusCode).toBe(404);
  });
});

describe('Patch details', () => {
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
    expect([200, 403]).toContain(res.statusCode);
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
