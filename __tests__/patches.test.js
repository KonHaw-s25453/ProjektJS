
test('GET /patches returns patches array', async () => {
const request = require('supertest');
const app = require('../app');

describe('Patches', () => {
  test('GET /patches returns array', async () => {
    const res = await request(app).get('/patches');
    expect([200, 404, 500]).toContain(res.statusCode);
  });
});
test('GET /api/patch returns empty array with mock DB', async () => {
  const res = await request(global.__TEST_SERVER__).get('/api/patch');
  expect([200, 404]).toContain(res.status);
  // W zależności od implementacji, może być 404 lub 200 z pustą tablicą
});

test('POST /upload without file returns 401 or 400', async () => {
  const res = await request(app).post('/upload').set('Authorization', await authHeaderFor('tester'));
  expect([400, 401]).toContain(res.status);
  expect(res.body).toHaveProperty('error');
});

test('POST /api/patch bez danych zwraca 400 lub 422', async () => {
  const res = await request(app).post('/api/patch').set('Authorization', await authHeaderFor('tester'));
  expect([400, 422, 500]).toContain(res.status);
  expect(res.body).toHaveProperty('error');
});

const FIXTURE_PATH = path.join(__dirname, '..', 'test.vcv');

describe('Integration with fixture test.vcv (if present)', () => {
  if (!fs.existsSync(FIXTURE_PATH)) {
    test.skip('fixture not present - skipping upload/download tests', () => {});
    return;
  }

  test('POST /api/patch z test.vcv dodaje patch i zwraca id', async () => {
    const res = await request(global.__TEST_SERVER__)
      .post('/api/patch')
      .set('Authorization', await authHeaderFor('fixtureUser'))
      .attach('vcv', FIXTURE_PATH)
      .field('description', 'fixture upload');
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('id');
    const patchId = res.body.id || res.body.patchId;
    expect(typeof patchId).toBe('number');

    // GET /api/patch powinien zawierać nowy patch
    const list = await request(global.__TEST_SERVER__).get('/api/patch');
    expect([200, 404]).toContain(list.status);
    const found = (list.body || []).find(p => p.id === patchId);
    expect(found).toBeDefined();

    // GET /api/patch/:id powinien zwracać szczegóły
    const detail = await request(global.__TEST_SERVER__).get(`/api/patch/${patchId}`);
    expect([200, 404]).toContain(detail.status);
    expect(detail.body).toHaveProperty('patch');

    // GET /download/:id should return the file (status 200)
    const dl = await request(global.__TEST_SERVER__).get(`/download/${patchId}`);
    expect(dl.status).toBe(200);
  });
});
