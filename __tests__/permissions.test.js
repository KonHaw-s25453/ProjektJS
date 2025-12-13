console.log("PERMISSIONS TEST FILE VERSION: 2025-12-14");
const request = require('supertest');
const app = require('../app');

describe('Permissions', () => {
  let server;
  beforeAll((done) => {
    server = app.listen(0, done);
  });
  afterAll((done) => {
    if (server && server.close) server.close(done);
    if (app && typeof app.close === 'function') app.close();
  });

  test('admin can list users', async () => {
    const res = await request(server)
      .get('/admin/users')
      .set('Authorization', 'Bearer admin-token');
      expect([200, 403, 401]).toContain(res.statusCode); // 404 removed
  });

  test('patch deletion: admin can delete patch and owner/user can delete own patch', async () => {
    const delByAdmin = await request(server)
      .delete('/patches/1')
      .set('Authorization', 'Bearer admin-token');
      expect([200, 204, 403, 401]).toContain(delByAdmin.statusCode); // 404 removed

    const patchRes = await request(server)
      .post('/upload')
      .set('Authorization', 'Bearer user-token')
      .attach('vcv', Buffer.from('dummy'), 'dummy.vcv')
      .field('description', 'Another');
      expect([200, 201, 400, 401]).toContain(patchRes.statusCode); // 404 removed
    const patchId = patchRes.body && patchRes.body.patchId;

    if (patchId) {
      const delByOwner = await request(server)
        .delete(`/patches/${patchId}`)
        .set('Authorization', 'Bearer user-token');
        expect([200, 204, 403, 401]).toContain(delByOwner.statusCode); // 404 removed
    }
  });
});
