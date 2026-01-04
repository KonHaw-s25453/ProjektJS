// setupTests.js
const app = require('./app');
const mysql = require('mysql2/promise');

let server;
let dbConn;

beforeAll(async () => {
  // Ustaw zmienne środowiskowe bazy
  process.env.DB_NAME = process.env.DB_NAME ? String(process.env.DB_NAME).trim() : 'vcv';
  process.env.DB_HOST = process.env.DB_HOST ? String(process.env.DB_HOST).trim() : 'localhost';
  process.env.DB_PORT = process.env.DB_PORT ? String(process.env.DB_PORT).trim() : '3306';
  process.env.DB_USER = process.env.DB_USER ? String(process.env.DB_USER).trim() : 'root';
  process.env.DB_PASS = process.env.DB_PASS ? String(process.env.DB_PASS).trim() : '';
  dbConn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    charset: 'utf8mb4'
  });
  global.__TEST_DB_CONN__ = dbConn;
  // server = app.listen(3002, () => {
  //   console.log('Test server running on port 3002');
  // });
  // global.__TEST_SERVER__ = server;
});

afterAll(async () => {
  if (dbConn) await dbConn.end();
  if (app && typeof app.close === 'function') await app.close();
  if (global.dbPool && typeof global.dbPool.end === 'function') await global.dbPool.end();
  if (server && server.close) await server.close();
});
