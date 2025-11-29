const request = require('supertest');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

// This integration test runs only when REAL_DB=1 is set in the environment
// It will create a temporary test database (default `vcv_test`), apply
// schema and seeds, run the upload against the app configured to use
// that test database, then drop the test database and remove uploaded file.

describe('Integration: upload -> DB (real DB required)', () => {
  let adminConn; // connection to create/drop test DB
  let testDbName = process.env.TEST_DB_NAME || 'vcv_test';
  let dbConn; // connection to test DB for verification

  beforeAll(async () => {
    if (!process.env.REAL_DB) {
      console.warn('Skipping integration tests (set REAL_DB=1 to enable)');
      return;
    }

    const adminOpts = {
      host: process.env.DB_HOST ? String(process.env.DB_HOST).trim() : '127.0.0.1',
      user: process.env.DB_USER ? String(process.env.DB_USER).trim() : 'root',
      password: process.env.DB_PASS ? String(process.env.DB_PASS).trim() : ''
    };
    adminConn = await mysql.createConnection(Object.assign({}, adminOpts, { multipleStatements: true }));

    // create test database and run schema + seeds
    const schema = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
    const seeds = fs.readFileSync(path.join(__dirname, '..', 'seeds.sql'), 'utf8');
    await adminConn.query(`DROP DATABASE IF EXISTS \`${testDbName}\`; CREATE DATABASE \`${testDbName}\`;`);
    await adminConn.query(`USE \`${testDbName}\`; ${schema} ${seeds}`);

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
      // drop the test database
      if (adminConn) await adminConn.query(`DROP DATABASE IF EXISTS \`${testDbName}\`;`);
    } finally {
      if (adminConn) await adminConn.end();
    }
    // attempt to close any resources opened by the app (DB pool)
    try {
      const app = require('../app');
      if (app && typeof app.close === 'function') await app.close();
    } catch (e) {
      // ignore
    }
  });

  test('uploads Test.vcv and creates a patch row', async () => {
    if (!process.env.REAL_DB) return;

    // require the app after env is set so it will use test DB
    const app = require('../app');

    const fixture = path.join(__dirname, '..', 'Test.vcv');
    const res = await request(app)
      .post('/upload')
      .field('user', 'test-integration')
      .field('category', '1')
      .attach('vcv', fixture);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('patchId');

    const patchId = res.body.patchId;

    // verify row exists in test DB
    const [rows] = await dbConn.execute('SELECT id, user_name, file_path FROM patches WHERE id = ?', [patchId]);
    expect(rows.length).toBe(1);
    expect(rows[0].user_name).toBe('test-integration');

    // remove uploaded file that the app saved
    if (rows[0].file_path && fs.existsSync(rows[0].file_path)) {
      try { fs.unlinkSync(rows[0].file_path); } catch (e) { /* ignore */ }
    }

    // cleanup inserted rows (in test DB)
    await dbConn.execute('DELETE FROM patch_tags WHERE patch_id = ?', [patchId]);
    await dbConn.execute('DELETE FROM patch_modules WHERE patch_id = ?', [patchId]);
    await dbConn.execute('DELETE FROM patches WHERE id = ?', [patchId]);
  });
});

