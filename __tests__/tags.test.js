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
  const state = { patches: [], modules: [], patch_modules: [], categories: [], users: [], tags: [], patch_tags: [] };
  fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });
  fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(state, null, 2));
});

test('add tags to a patch and retrieve them', async () => {
  // create a patch
  const tmp = path.join(__dirname, 't_tag.vcv');
  fs.writeFileSync(tmp, JSON.stringify({ modules: [{ plugin: 'T', model: 'M' }] }), 'utf8');
  const up = await request(app).post('/upload').set('Authorization', authHeaderFor('tagger')).attach('vcv', tmp);
  expect(up.status).toBe(200);
  const pid = up.body.patchId;

  // add tags
  const add = await request(app).post(`/patches/${pid}/tags`).send({ tags: ['ambient', 'drone'] });
  expect(add.status).toBe(200);
  expect(add.body).toHaveProperty('ok', true);

  // get tags for patch
  const g = await request(app).get(`/patches/${pid}`);
  expect(g.status).toBe(200);
  expect(Array.isArray(g.body.tags)).toBe(true);
  expect(g.body.tags).toEqual(expect.arrayContaining(['ambient','drone']));

  // filter patches by tag
  const list = await request(app).get('/patches').query({ tag: 'ambient' });
  expect(list.status).toBe(200);
  expect(list.body.patches.some(p => p.id === pid)).toBe(true);

  fs.unlinkSync(tmp);
});
