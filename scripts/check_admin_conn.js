const mysql = require('mysql2/promise');

(async () => {
  try {
    const adminOpts = {
      host: process.env.DB_HOST ? String(process.env.DB_HOST).trim() : '127.0.0.1',
      user: process.env.DB_USER ? String(process.env.DB_USER).trim() : 'root',
      password: process.env.DB_PASS ? String(process.env.DB_PASS).trim() : ''
    };
    console.log('Admin connection options:', adminOpts);
    const conn = await mysql.createConnection(Object.assign({}, adminOpts, { multipleStatements: true }));
    console.log('Connected — sample query result:', await conn.query('SELECT 1 as ok'));
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error('Connection failed —', err && err.message);
    if (err && err.code) console.error('MySQL error code:', err.code);
    console.error(err && err.stack);
    process.exit(1);
  }
})();
