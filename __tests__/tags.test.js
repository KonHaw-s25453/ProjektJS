const fs = require('fs');
const path = require('path');
const request = require('supertest');
const mysql = require('mysql2/promise');
const { addUser, getUserByName, signToken } = require('../models/user');
const app = require('../app');

let dbConn;
beforeAll(async () => {
  dbConn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'vcv',
  });
  await addUser(dbConn, { username: 'tagger', passwordHash: 'test', display_name: 'Tagger', role: 1 });
});

async function authHeaderFor(username) {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'vcv',
  });
  const user = await getUserByName(db, username);
  if (!user) throw new Error('User not found: ' + username);
  return `Bearer ${signToken(user)}`;
}

beforeEach(() => {
  // ...setup code if needed
});

test('add tags to a patch and retrieve them', async () => {
  // create a patch
  const up = await request(global.__TEST_SERVER__)
    .post('/upload')
    .set('Authorization', await authHeaderFor('tagger'))
    .attach('vcv', Buffer.from(JSON.stringify({ modules: [{ plugin: 'T', model: 'M' }] }), 'utf8'), 't_tag.vcv');
  expect(up.status).toBe(200);
  const pid = up.body.patchId;

  // add tags
  const add = await request(global.__TEST_SERVER__).post(`/patches/${pid}/tags`).send({ tags: ['ambient', 'drone'] });
  expect(add.status).toBe(200);
  expect(add.body).toHaveProperty('ok', true);

  // get tags for patch
  const g = await request(global.__TEST_SERVER__).get(`/patches/${pid}`);
  expect(g.status).toBe(200);
  expect(Array.isArray(g.body.tags)).toBe(true);
  expect(g.body.tags).toEqual(expect.arrayContaining(['ambient','drone']));

  // filter patches by tag
  const list = await request(global.__TEST_SERVER__).get('/patches').query({ tag: 'ambient' });
  expect(list.status).toBe(200);
  expect(list.body.patches.some(p => p.id === pid)).toBe(true);
});
