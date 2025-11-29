process.env.MOCK_DB = 'true';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const request = require('supertest');
const app = require('../app');

const DATA_DIR = path.join(__dirname, '..', 'data');
const MOCK_DB_FILE = path.join(DATA_DIR, 'mock_db.json');

beforeEach(() => {
  // reset mock DB to empty state before each test
  const state = { patches: [], modules: [], patch_modules: [], categories: [], users: [] };
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(state, null, 2));
});

afterAll(() => {
  // clean up any tmp files created by tests under uploads
  try {
    const uploads = path.join(__dirname, '..', 'uploads', 'patches');
    if (fs.existsSync(uploads)) {
      for (const f of fs.readdirSync(uploads)) {
        if (f.endsWith('.vcv') || f.includes('test')) {
          try { fs.unlinkSync(path.join(uploads, f)); } catch (e) {}
        }
      }
    }
  } catch (e) {}
});

test('upload of compressed .vcv (deflated JSON) parses and registers modules', async () => {
  const fixture = {
    modules: [
      { plugin: 'PluginA', model: 'ModelX' },
      { plugin: 'PluginB', model: 'ModelY' },
      { plugin: 'PluginA', model: 'ModelX' }
    ]
  };
  const buf = Buffer.from(JSON.stringify(fixture), 'utf8');
  const deflated = zlib.deflateSync(buf);
  const tmp = path.join(__dirname, 'fixture_deflated.vcv');
  fs.writeFileSync(tmp, deflated);

  const res = await request(app)
    .post('/upload')
    .attach('vcv', tmp)
    .field('user', 'alice')
    .field('category', '1')
    .field('description', 'deflated json fixture');

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('parsed', true);
  expect(res.body).toHaveProperty('modules');
  // duplicate module should be deduped
  expect(res.body.modules.length).toBe(2);
  expect(res.body).toHaveProperty('patchId');

  fs.unlinkSync(tmp);
});

test('upload of plain JSON .vcv (not compressed) is handled', async () => {
  const fixture = { plugin: 'PlainPlugin', model: 'PlainModel' };
  const tmp = path.join(__dirname, 'fixture_plain.vcv');
  fs.writeFileSync(tmp, JSON.stringify(fixture), 'utf8');

  const res = await request(app)
    .post('/upload')
    .attach('vcv', tmp)
    .field('user', 'bob')
    .field('category', '2')
    .field('description', 'plain json fixture');

  expect(res.status).toBe(200);
  expect(res.body.parsed).toBe(true);
  expect(Array.isArray(res.body.modules)).toBe(true);

  fs.unlinkSync(tmp);
});

test('patch listing supports filtering by user and category and since date', async () => {
  // create three patches with different users/categories and timestamps
  const makeFixture = (u, c) => ({ modules: [{ plugin: 'P', model: 'M' }], meta: { u, c } });

  const create = async (user, category, desc) => {
    const tmp = path.join(__dirname, `f_${user}_${category}.vcv`);
    fs.writeFileSync(tmp, JSON.stringify(makeFixture(user, category)), 'utf8');
    const r = await request(app).post('/upload').attach('vcv', tmp).field('user', user).field('category', String(category)).field('description', desc);
    fs.unlinkSync(tmp);
    return r.body.patchId;
  };

  const id1 = await create('alice', 1, 'first');
  // small delay so uploaded_at differs
  await new Promise(r => setTimeout(r, 10));
  const id2 = await create('bob', 2, 'second');
  await new Promise(r => setTimeout(r, 10));
  const id3 = await create('alice', 2, 'third');

  // filter by user alice -> should return id3 and id1 (ordered by uploaded_at DESC)
  const listAlice = await request(app).get('/patches').query({ user: 'alice' });
  expect(listAlice.status).toBe(200);
  expect(listAlice.body.patches.every(p => p.user_name === 'alice')).toBe(true);

  // filter by category 2 -> should include id2 and id3
  const listCat2 = await request(app).get('/patches').query({ category: 2 });
  expect(listCat2.status).toBe(200);
  expect(listCat2.body.patches.every(p => String(p.category_id) === '2')).toBe(true);

  // since filter - use uploaded_at of id2 as cutoff to get id2 and id3 depending
  const all = await request(app).get('/patches');
  const cutoff = all.body.patches.find(p => p.id === id2).uploaded_at;
  const sinceRes = await request(app).get('/patches').query({ since: cutoff });
  expect(sinceRes.status).toBe(200);
  // returned patches should have uploaded_at >= cutoff
  expect(sinceRes.body.patches.every(p => new Date(p.uploaded_at) >= new Date(cutoff))).toBe(true);
});

test('GET /patches/:id returns modules with plugin link and download serves file', async () => {
  const fixture = { modules: [{ plugin: 'LinkPlugin', model: 'LinkModel' }] };
  const tmp = path.join(__dirname, 'fixture_link.vcv');
  fs.writeFileSync(tmp, JSON.stringify(fixture), 'utf8');

  const up = await request(app).post('/upload').attach('vcv', tmp).field('user', 'carol');
  expect(up.status).toBe(200);
  const pid = up.body.patchId;

  const det = await request(app).get(`/patches/${pid}`);
  expect(det.status).toBe(200);
  expect(Array.isArray(det.body.modules)).toBe(true);
  expect(det.body.modules[0]).toHaveProperty('link');
  expect(String(det.body.modules[0].link)).toMatch(/^https:\/\/vcvrack.com\/plugins.html\?plugin=/);

  const dl = await request(app).get(`/download/${pid}`);
  expect(dl.status).toBe(200);

  fs.unlinkSync(tmp);
});
