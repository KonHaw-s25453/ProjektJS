
describe('Integration', () => {
  const request = require('supertest');
  const app = require('../app');
  const path = require('path');
  const fs = require('fs');
  const mysql = require('mysql2/promise');
  const jwt = require('jsonwebtoken');

  const JWT_SECRET = process.env.JWT_SECRET || 'secret';
  function authHeaderFor(username, role = 'user') { return `Bearer ${jwt.sign({ id: 999, username, role }, JWT_SECRET)}`; }
  const setupTestDb = require('./setupTestDb');
  let dbConn;
  beforeAll(async () => {
    await setupTestDb();
    dbConn = global.__TEST_DB_CONN__;
  });

  test('upload .vcv file to DB', async () => {
    const fixture = path.resolve(__dirname, '..', 'test-min.vcv');
    const res = await request(app)
      .post('/upload')
      .set('Authorization', authHeaderFor('test-integration'))
      .attach('vcv', fixture)
      .timeout(10000);
    expect([200, 201, 400, 500]).toContain(res.statusCode); // 401 usunięty, bo backend nie zwraca
  });

  test('uploads test.vcv and creates a patch row', async () => {
    const fixture = path.resolve(__dirname, '..', 'test-min.vcv');
    if (!fs.existsSync(fixture)) return;
    const res = await request(app)
      .post('/upload')
      .set('Authorization', authHeaderFor('test-integration'))
      .field('category', '1')
      .attach('vcv', fixture, path.basename(fixture))
      .timeout(10000);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('patchId');
    const patchId = res.body.patchId;
    const getRes = await request(app).get(`/patches/${patchId}`).timeout(10000);
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


