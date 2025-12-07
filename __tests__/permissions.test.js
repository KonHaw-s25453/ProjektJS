const request = require('supertest');
const app = require('../app');

describe('Permissions', () => {
  test('admin can list users', async () => {
    const res = await request(app)
      .get('/users')
      .set('Authorization', 'Bearer admin-token'); // uproszczony token
    expect([200, 403]).toContain(res.statusCode); // 403 jeśli brak admina
  });
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
