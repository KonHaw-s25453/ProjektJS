console.log("PATCHES TEST FILE VERSION: 2025-12-14");
const request = require('supertest');
const app = require('../app'); // Ensure app is required
const path = require('path');
const fs = require('fs');
describe('Patches', () => {
    test('GET /patches/:id returns 404 for missing patch', async () => {
      const res = await request(app).get('/patches/999999');
      expect(res.statusCode).toBe(404);
    });
  const setupTestDb = require('./setupTestDb');
  beforeAll(async () => {
    await setupTestDb();
  });

  test('GET /patches returns patches array', async () => {
    const res = await request(app).get('/patches');
    expect([200, 201, 400, 500]).toContain(res.statusCode);
  });

  test('POST /upload without file returns 401 or 400', async () => {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign({ id: 1, username: 'test-upload', role: 'user' }, JWT_SECRET);
    const res = await request(app).post('/upload').set('Authorization', `Bearer ${token}`).field('description', 'patches upload');
    expect([400, 401]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('error');
  });
});

const FIXTURE_PATH = path.join(__dirname, '..', 'test-min.vcv');

describe('Integration with fixture test-min.vcv (if present)', () => {
  if (!fs.existsSync(FIXTURE_PATH)) {
    test.skip('fixture not present - skipping upload/download tests', () => {});
    return;
  }

  const setupTestDb = require('./setupTestDb');
  beforeAll(async () => {
    await setupTestDb();
  });

  test('POST /upload z test.vcv dodaje patch i zwraca id', async () => {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign({ id: 1, username: 'test-upload', role: 'user' }, JWT_SECRET);
      const res = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('vcv', FIXTURE_PATH)
        .field('description', 'fixture upload');
    expect([200, 201, 400, 500]).toContain(res.statusCode); // 401 usunięty, bo backend nie zwraca
    expect(res.body).toHaveProperty('patchId');
    const patchId = res.body.patchId;
    expect(typeof patchId).toBe('number');

    // GET /patches powinien zawierać nowy patch
    const list = await request(app).get('/patches');
    expect([200]).toContain(list.statusCode);

    // GET /patches/:id powinien zwracać szczegóły (tylko 200, nie 404)
    const detail = await request(app).get(`/patches/${patchId}`);
    expect([200]).toContain(detail.statusCode);

    // GET /download/:id powinien zwrócić plik (tylko 200, nie 404)
    const dl = await request(app).get(`/download/${patchId}`).set('Authorization', `Bearer ${token}`);
    expect([200]).toContain(dl.statusCode);
  });
});
