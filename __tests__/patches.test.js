process.env.MOCK_DB = 'true';
const fs = require('fs');
const path = require('path');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
function authHeaderFor(username, role = 1) { return `Bearer ${jwt.sign({ id: 1, username, role }, JWT_SECRET)}`; }
const app = require('../app');

const MOCK_DB_FILE = path.join(__dirname, '..', 'data', 'mock_db.json');

beforeEach(() => {
  // reset mock DB to empty state before each test
  const state = { patches: [], modules: [], patch_modules: [], categories: [], users: [] };
  fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });
  fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(state, null, 2));
});

test('GET /patches returns empty patches array with mock DB', async () => {
  const res = await request(app).get('/patches');
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('patches');
  expect(Array.isArray(res.body.patches)).toBe(true);
  expect(res.body.patches.length).toBe(0);
});

test('POST /upload without file returns 400', async () => {
  const res = await request(app).post('/upload').set('Authorization', authHeaderFor('tester'));
  expect(res.status).toBe(400);
  expect(res.body).toHaveProperty('error');
});

const FIXTURE_PATH = path.join(__dirname, '..', 'test.vcv');

describe('Integration with fixture test.vcv (if present)', () => {
  if (!fs.existsSync(FIXTURE_PATH)) {
    test.skip('fixture not present - skipping upload/download tests', () => {});
    return;
  }

  test('POST /upload with test.vcv stores patch and returns patchId', async () => {
    const res = await request(app)
      .post('/upload')
      .set('Authorization', authHeaderFor('fixtureUser'))
      .attach('vcv', FIXTURE_PATH)
      .field('description', 'fixture upload');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('patchId');
    const patchId = res.body.patchId;
    expect(typeof patchId).toBe('number');

    // GET /patches should include the new patch
    const list = await request(app).get('/patches');
    expect(list.status).toBe(200);
    const found = (list.body.patches || []).find(p => p.id === patchId);
    expect(found).toBeDefined();

    // GET /patches/:id should return details
    const detail = await request(app).get(`/patches/${patchId}`);
    expect(detail.status).toBe(200);
    expect(detail.body).toHaveProperty('patch');

    // GET /download/:id should return the file (status 200)
    const dl = await request(app).get(`/download/${patchId}`);
    expect(dl.status).toBe(200);
  });
});
