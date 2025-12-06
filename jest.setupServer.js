process.env.DB_NAME = 'vcv';
// jest.setupServer.js
const app = require('./app');
const http = require('http');

let server;


beforeAll(async () => {
  server = http.createServer(app);
  await new Promise(res => server.listen(0, res)); // 0 = random port
  const address = server.address();
  global.__TEST_SERVER__ = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  if (server && server.listening) {
    await new Promise(res => server.close(res));
  }
  if (app && typeof app.close === 'function') await app.close();
  // Do not close global.dbPool here; let Node handle cleanup at process exit.
});
