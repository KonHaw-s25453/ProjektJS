const mysql = require('mysql2/promise');

(async () => {
  const cfg = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || undefined,
    multipleStatements: true,
  };

  console.log('Testing MySQL connection with:', { host: cfg.host, user: cfg.user, database: cfg.database || '(none)' });
  try {
    const conn = await mysql.createConnection(cfg);
    const [rows] = await conn.query('SELECT 1 AS ok');
    console.log('Connected — sample query result:', rows);
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error('Connection failed — message:', err.message);
    if (err.code) console.error('MySQL error code:', err.code);
    console.error(err);
    process.exit(1);
  }
})();
