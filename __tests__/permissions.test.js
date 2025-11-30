const request = require('supertest');
const path = require('path');
const fs = require('fs');

process.env.MOCK_DB = '1';
const MOCK_DB_FILE = path.join(__dirname, '..', 'data', 'mock_db.json');

beforeAll(() => {
  const state = {
    users: [
      { id: 1, username: 'Własc', display_name: 'Właściciel', password_hash: '$2a$10$D6Lv0plfMHjZ7f78K2J2mucZsj/BGcZZdfIOVZZrzRnyqm/ZBmbEe', role: 3 },
      { id: 2, username: 'Adm', display_name: 'Test Admin', password_hash: '$2a$10$KFG5/TKhU6VMj7T6MJ6k3.tq0grqQn5ZI8LkPwLCKiN7sFVPrX5.6', role: 2 },
      { id: 3, username: 'Usr', display_name: 'Test User', password_hash: '$2a$10$47RQNjOHf4lQPxkYhcwB3OrwlHu5crK7/WoGdLSRvN9/lqDByKjNa', role: 1 }
    ],
    patches: [
      { id: 1, user_name: 'Usr', category_id: null, file_path: 'uploads/patches/1-Test.vcv', description: 'Test patch', uploaded_at: new Date().toISOString() }
    ],
    modules: [],
    patch_modules: [],
    tags: [],
    patch_tags: [],
    categories: []
  };
  fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });
  fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(state, null, 2));
});

afterAll(() => {
  try { fs.unlinkSync(MOCK_DB_FILE); } catch (e) { }
});

describe('Permissions matrix', () => {
  let app;
  let tokens = {};
  beforeAll(async () => {
    app = require('../app');
    const resO = await request(app).post('/auth/login').send({ username: 'Własc', password: 'hasł' });
    tokens.owner = resO.body.token;
    const resA = await request(app).post('/auth/login').send({ username: 'Adm', password: 'hasł' });
    tokens.admin = resA.body.token;
    const resU = await request(app).post('/auth/login').send({ username: 'Usr', password: 'hsł' });
    tokens.user = resU.body.token;
  });

  test('admin can list users, regular user cannot', async () => {
    const resA = await request(app).get('/users').set('Authorization', `Bearer ${tokens.admin}`);
    expect(resA.status).toBe(200);
    const resU = await request(app).get('/users').set('Authorization', `Bearer ${tokens.user}`);
    expect(resU.status).toBe(403);
  });

  test('owner can promote user to admin and admin can delete non-admin user', async () => {
    // owner promotes Usr to admin (role 2)
    const promote = await request(app).post('/users/Usr/role').set('Authorization', `Bearer ${tokens.owner}`).send({ role: 2 });
    expect(promote.status).toBe(200);

    // now Usr should be able to GET /users
    const resPromoted = await request(app).post('/auth/login').send({ username: 'Usr', password: 'hsł' });
    expect(resPromoted.status).toBe(200);
    const tokenPromoted = resPromoted.body.token;
    const resNow = await request(app).get('/users').set('Authorization', `Bearer ${tokenPromoted}`);
    expect(resNow.status).toBe(200);

    // demote Usr back to role 1 then delete as admin
    await request(app).post('/users/Usr/role').set('Authorization', `Bearer ${tokens.owner}`).send({ role: 1 });
    const delByAdmin = await request(app).delete('/users/Usr').set('Authorization', `Bearer ${tokens.admin}`);
    expect(delByAdmin.status).toBe(200);
  });

  test('patch deletion: admin can delete patch and owner/user can delete own patch', async () => {
    // admin deletes patch id=1
    const delByAdmin = await request(app).delete('/patches/1').set('Authorization', `Bearer ${tokens.admin}`);
    expect([200,204]).toContain(delByAdmin.status);

    // recreate patch for owner test
    const state = JSON.parse(fs.readFileSync(MOCK_DB_FILE, 'utf8'));
    state.patches.push({ id: 2, user_name: 'Usr', category_id: null, file_path: 'uploads/patches/2-Test.vcv', description: 'Another', uploaded_at: new Date().toISOString() });
    fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(state, null, 2));

    const delByOwner = await request(app).delete('/patches/2').set('Authorization', `Bearer ${tokens.user}`);
    expect([200,204]).toContain(delByOwner.status);
  });
});
