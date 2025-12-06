const setupTestDb = require('./setupTestDb');

const request = require('supertest');
const mysql = require('mysql2/promise');
const { addUser } = require('../models/user');
let db;

beforeAll(async () => {
  await setupTestDb();
  db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'vcv',
  });
  // Wyczyść i zainicjuj użytkowników testowych
  await db.query('DELETE FROM users WHERE username IN ("Własc", "Adm", "Usr")');
  await addUser(db, { username: 'Własc', passwordHash: '$2a$10$D6Lv0plfMHjZ7f78K2J2mucZsj/BGcZZdfIOVZZrzRnyqm/ZBmbEe', display_name: 'Właściciel', role: 3 });
  await addUser(db, { username: 'Adm', passwordHash: '$2a$10$KFG5/TKhU6VMj7T6MJ6k3.tq0grqQn5ZI8LkPwLCKiN7sFVPrX5.6', display_name: 'Test Admin', role: 2 });
  await addUser(db, { username: 'Usr', passwordHash: '$2a$10$47RQNjOHf4lQPxkYhcwB3OrwlHu5crK7/WoGdLSRvN9/lqDByKjNa', display_name: 'Test User', role: 1 });
});
// No local teardown; global teardown will handle connection closing.

describe('Auth and roles', () => {
  let app;
  beforeAll(() => { app = require('../app'); });

  test('login returns token and role for users', async () => {
    const resU = await request(app).post('/auth/login').send({ username: 'Usr', password: 'hsł' });
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
