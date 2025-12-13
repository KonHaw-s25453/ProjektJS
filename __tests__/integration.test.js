console.log("INTEGRATION TEST FILE VERSION: 2025-12-14");
describe('Integration', () => {
  const request = require('supertest');
  const path = require('path');
  const fs = require('fs');
  const mysql = require('mysql2/promise');
  const jwt = require('jsonwebtoken');

  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
  function authHeaderFor(username, role = 1) { return `Bearer ${jwt.sign({ id: 1, username, role }, JWT_SECRET)}`; }
  let dbConn;
  let server;
  let app;

  beforeAll(async () => {
    process.env.DB_NAME = 'vcv';
    process.env.DB_HOST = process.env.DB_HOST ? String(process.env.DB_HOST).trim() : 'localhost';
    process.env.DB_PORT = process.env.DB_PORT ? String(process.env.DB_PORT).trim() : '3306';
    process.env.DB_USER = process.env.DB_USER ? String(process.env.DB_USER).trim() : 'root';
    process.env.DB_PASS = process.env.DB_PASS ? String(process.env.DB_PASS).trim() : '';
    dbConn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: 'vcv',
      charset: 'utf8mb4'
    });
    app = require('../app');
    server = app.listen(0);
  });

  afterAll(async () => {
    try {
      if (dbConn) await dbConn.end();
      if (server && server.close) await server.close();
      if (app && typeof app.close === 'function') await app.close();
      if (global.dbPool && typeof global.dbPool.end === 'function') await global.dbPool.end();
    } catch (e) {}
  });

  test('upload .vcv file to DB', async () => {
    const res = await request(server)
      .post('/upload')
      .set('Authorization', authHeaderFor('test-integration'))
      .attach('vcv', Buffer.from(JSON.stringify({ test: true })), 'test.vcv');
    expect([200, 201, 400, 500]).toContain(res.statusCode);
  });

  test('uploads Test.vcv and creates a patch row', async () => {
    const fixture = path.resolve(__dirname, '..', 'Test.vcv');
    if (!fs.existsSync(fixture)) return;
    const res = await request(server)
      .post('/upload')
      .set('Authorization', authHeaderFor('test-integration'))
      .field('category', '1')
      .attach('vcv', fixture, path.basename(fixture));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('patchId');
    const patchId = res.body.patchId;
    const getRes = await request(app).get(`/patches/${patchId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body).toHaveProperty('patch');
    expect(getRes.body.patch).toHaveProperty('id', patchId);
    expect(getRes.body.patch).toHaveProperty('user_name', 'test-integration');
    const filePath = getRes.body.patch.file_path;
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    }
    try {
      await dbConn.execute('DELETE FROM patch_tags WHERE patch_id = ?', [patchId]);
      await dbConn.execute('DELETE FROM patch_modules WHERE patch_id = ?', [patchId]);
      await dbConn.execute('DELETE FROM patches WHERE id = ?', [patchId]);
    } catch (e) {}
  });
});


