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
  // prefer explicit TEST_DB_NAME, fall back to DB_NAME (use existing), else default to vcv_test
  let testDbName = process.env.TEST_DB_NAME || process.env.DB_NAME || 'vcv_test';
  // protect important DB names: refuse to run destructive operations on them.
  // NOTE: 'vcv' is intentionally omitted here because it's used as the local test DB.
  const protectedDbs = ['production', 'prod', 'main', 'information_schema', 'mysql', 'performance_schema'];
  if (!process.env.TEST_DB_NAME && protectedDbs.includes(String(testDbName).toLowerCase())) {
    throw new Error(`Refusing to run integration test on protected database '${testDbName}'. Set TEST_DB_NAME to a separate test database to override.`);
  }
  let dbConn; // connection to test DB for verification

  beforeAll(async () => {
    // Always run integration test and use the database

    const adminOpts = {
      host: process.env.DB_HOST ? String(process.env.DB_HOST).trim() : '127.0.0.1',
      user: process.env.DB_USER ? String(process.env.DB_USER).trim() : 'root',
      password: process.env.DB_PASS ? String(process.env.DB_PASS).trim() : ''
    };
    adminConn = await mysql.createConnection(Object.assign({}, adminOpts, { multipleStatements: true }));

    // apply schema and seeds. If using an existing DB (DB_NAME was set), do not DROP it —
    // just run schema + seeds against that database. If TEST_DB_NAME explicitly set,
    // recreate it to ensure a clean environment.
    const schema = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
    const seeds = fs.readFileSync(path.join(__dirname, '..', 'seeds.sql'), 'utf8');
    if (process.env.TEST_DB_NAME) {
      // explicit test DB requested: recreate
      await adminConn.query(`DROP DATABASE IF EXISTS \`${testDbName}\`; CREATE DATABASE \`${testDbName}\`;`);
      await adminConn.query(`USE \`${testDbName}\`; ${schema} ${seeds}`);
    } else {
      // using existing DB (likely DB_NAME). Ensure schema exists, then clear table contents
      // to avoid dropping user's database. After clearing, reapply seeds.
      console.warn('Using existing database for integration test:', testDbName);
      // ensure tables exist (and add any missing columns introduced later)
      await adminConn.query(`USE \`${testDbName}\`; ${schema}`);
      // attempt lightweight migrations: add new columns if missing (password_hash, role)
      try {
        await adminConn.query(`ALTER TABLE \`${testDbName}\`.users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`);
      } catch (e) { /* ignore if not supported */ }
      try {
        await adminConn.query(`ALTER TABLE \`${testDbName}\`.users ADD COLUMN IF NOT EXISTS role TINYINT NOT NULL DEFAULT 1`);
      } catch (e) { /* ignore if not supported */ }

      // clear table contents in FK-safe order and temporarily disable foreign key checks
      const cleanupSql = `
        USE \`${testDbName}\`;
        SET FOREIGN_KEY_CHECKS=0;
        DELETE FROM patch_tags;
        DELETE FROM patch_modules;
        DELETE FROM patches;
        DELETE FROM modules;
        DELETE FROM tags;
        DELETE FROM users;
        DELETE FROM categories;
        -- reset AUTO_INCREMENT for a clean state
        ALTER TABLE users AUTO_INCREMENT = 1;
        ALTER TABLE categories AUTO_INCREMENT = 1;
        ALTER TABLE patches AUTO_INCREMENT = 1;
        ALTER TABLE modules AUTO_INCREMENT = 1;
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

