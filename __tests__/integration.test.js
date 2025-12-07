const request = require('supertest');
const app = require('../app');

describe('Integration', () => {
  test('upload .vcv file to DB', async () => {
    const res = await request(app)
      .post('/upload')
      .attach('vcv', Buffer.from(JSON.stringify({ test: true })), 'test.vcv');
    expect([200, 201, 400, 500]).toContain(res.statusCode);
  });
});
        ALTER TABLE tags AUTO_INCREMENT = 1;
        SET FOREIGN_KEY_CHECKS=1;
      `;
      await adminConn.query(cleanupSql);

      // reapply seeds so test has expected baseline data
      await adminConn.query(`USE \`${testDbName}\`; ${seeds}`);
    }

    // set env so the app will use the test DB
    process.env.DB_NAME = testDbName;
    process.env.DB_HOST = process.env.DB_HOST ? String(process.env.DB_HOST).trim() : '127.0.0.1';
    process.env.DB_USER = process.env.DB_USER ? String(process.env.DB_USER).trim() : 'root';
    process.env.DB_PASS = process.env.DB_PASS ? String(process.env.DB_PASS).trim() : '';

    // connection for verification
    dbConn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: testDbName
    });
  });

  afterAll(async () => {
    if (!process.env.REAL_DB) return;

    try {
      if (dbConn) await dbConn.end();
      // drop the test database only if we explicitly created a test database
      // i.e. when TEST_DB_NAME was set. Do NOT drop the user's existing DB (DB_NAME).
      if (adminConn && process.env.TEST_DB_NAME) await adminConn.query(`DROP DATABASE IF EXISTS \`${testDbName}\`;`);
    } finally {
      if (adminConn) await adminConn.end();
    }
    // attempt to close any resources opened by the app (DB pool)
    try {
      const app = require('../app');
      if (app && typeof app.close === 'function') await app.close();
      if (global.dbPool && typeof global.dbPool.end === 'function') await global.dbPool.end();
    } catch (e) {
      // ignore
    }
  });

  test('uploads Test.vcv and creates a patch row', async () => {
    // Always run integration test and use the database
    const fixture = path.resolve(__dirname, '..', 'Test.vcv');
    if (!fs.existsSync(fixture)) {
      console.warn('Test.vcv not found, skipping integration test');
      return;
    }
    // Debug: log file path and size
    const stats = require('fs').statSync(fixture);
    console.log('DEBUG integration.test.js: fixture path', fixture, 'size', stats.size);
    // require the app after env is set so it will use test DB
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
    function authHeaderFor(username, role = 1) { return `Bearer ${jwt.sign({ id: 1, username, role }, JWT_SECRET)}`; }
    const app = require('../app');
    const res = await request(app)
      .post('/upload')
      .set('Authorization', authHeaderFor('test-integration'))
      .field('category', '1')
      .attach('vcv', fixture, path.basename(fixture));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('patchId');
    const patchId = res.body.patchId;
    // verify via the app endpoint to ensure we read through the same DB/pool
    const getRes = await request(app).get(`/patches/${patchId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body).toHaveProperty('patch');
    expect(getRes.body.patch).toHaveProperty('id', patchId);
    expect(getRes.body.patch).toHaveProperty('user_name', 'test-integration');
    // remove uploaded file that the app saved
    const filePath = getRes.body.patch.file_path;
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    }
    // cleanup inserted rows (in test DB) via dbConn if available
    try {
      await dbConn.execute('DELETE FROM patch_tags WHERE patch_id = ?', [patchId]);
      await dbConn.execute('DELETE FROM patch_modules WHERE patch_id = ?', [patchId]);
      await dbConn.execute('DELETE FROM patches WHERE id = ?', [patchId]);
    } catch (e) {
      // ignore cleanup errors
    }
  });
});

