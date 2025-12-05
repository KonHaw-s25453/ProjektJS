const request = require('supertest');
const path = require('path');
const fs = require('fs');

const MOCK_DB_FILE = path.join(__dirname, '..', 'data', 'mock_db.json');

beforeAll(() => {
  const state = {
    users: [
      { id: 1, username: 'Własc', display_name: 'Właściciel', password_hash: '$2a$10$D6Lv0plfMHjZ7f78K2J2mucZsj/BGcZZdfIOVZZrzRnyqm/ZBmbEe', role: 3 },
      { id: 2, username: 'Adm', display_name: 'Test Admin', password_hash: '$2a$10$KFG5/TKhU6VMj7T6MJ6k3.tq0grqQn5ZI8LkPwLCKiN7sFVPrX5.6', role: 2 },
      { id: 3, username: 'Usr', display_name: 'Test User', password_hash: '$2a$10$47RQNjOHf4lQPxkYhcwB3OrwlHu5crK7/WoGdLSRvN9/lqDByKjNa', role: 1 }
    ],
    patches: [],
    modules: [],
    patch_modules: [],
    tags: [],
    patch_tags: [],
    categories: []
  };
  fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });
  fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(state, null, 2));
});
afterAll(async () => {
  try { fs.unlinkSync(MOCK_DB_FILE); } catch (e) { }
  const app = require('../app');
  if (app && typeof app.close === 'function') await app.close();
  if (global.dbPool && typeof global.dbPool.end === 'function') await global.dbPool.end();
});

describe('Auth and roles', () => {
  let app;
  beforeAll(() => { app = require('../app'); });

  test('login returns token and role for users', async () => {
    const resU = await request(app).post('/auth/login').send({ username: 'Usr', password: 'hsł' });
    const resU = await request(app).post('/auth/login').send({ username: 'Usr', password: 'test123' });
    expect(resU.body).toHaveProperty('token');
    expect(resU.body.user).toHaveProperty('role', 1);

    const resA = await request(app).post('/auth/login').send({ username: 'Adm', password: 'hasł' });
    expect(resA.status).toBe(200);
    expect(resA.body.user).toHaveProperty('role', 2);

    const resO = await request(app).post('/auth/login').send({ username: 'Własc', password: 'hasł' });
    expect(resO.status).toBe(200);
    expect(resO.body.user).toHaveProperty('role', 3);
  });
});
