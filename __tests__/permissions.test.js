const request = require('supertest');
// No local beforeAll/afterAll needed; global teardown handles cleanup
describe('Permissions matrix', () => {
  let app;
  let tokens = {};
  beforeAll(async () => {
    app = require('../app');
    const resO = await request(app).post('/auth/login').send({ username: 'Własc', password: 'test123' });
    tokens.owner = resO.body.token;
    const resA = await request(app).post('/auth/login').send({ username: 'Adm', password: 'test123' });
    tokens.admin = resA.body.token;
    const resU = await request(app).post('/auth/login').send({ username: 'Usr', password: 'test123' });
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

    // now Usr should be able to GET /users (re-login after promotion)
    await new Promise(resolve => setTimeout(resolve, 150)); // wait for DB commit
    const resPromoted = await request(app).post('/auth/login').send({ username: 'Usr', password: 'test123' });
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
    expect([200, 204]).toContain(delByAdmin.status);

    // create patch for owner test using API
    const patchRes = await request(app)
      .post('/upload')
      .set('Authorization', `Bearer ${tokens.user}`)
      .attach('vcv', Buffer.from('dummy'), 'dummy.vcv')
      .field('description', 'Another');
    expect(patchRes.status).toBe(200);
    const patchId = patchRes.body.patchId;

    const delByOwner = await request(app).delete(`/patches/${patchId}`).set('Authorization', `Bearer ${tokens.user}`);
    expect([200,204]).toContain(delByOwner.status);
  });
});
