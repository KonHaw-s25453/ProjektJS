const mysql = require('mysql2/promise');

async function main() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;
  const user = process.env.DB_USER || 'root';
  const pass = process.env.DB_PASS || '';
  const dbName = process.env.DB_NAME || '';

  console.log('ENV DB_HOST,DB_PORT,DB_USER,DB_PASS,DB_NAME:', { host, port, user, pass: pass ? '***' : '(empty)', dbName });

  let conn;
  try {
    conn = await mysql.createConnection({ host, port, user, password: pass, database: dbName || undefined });
  } catch (err) {
    console.error('Connection failed:', err && err.message);
    process.exitCode = 2;
    return;
  }

  try {
    const [dbRow] = await conn.execute('SELECT DATABASE() AS dbname');
    console.log('SELECT DATABASE() ->', dbRow && dbRow[0] && dbRow[0].dbname);
  } catch (e) {
    console.error('Error SELECT DATABASE():', e && e.message);
  }

  try {
    const [dbs] = await conn.execute('SHOW DATABASES');
    console.log('Databases (first 20):', dbs.slice(0, 20).map(r => r.Database));
  } catch (e) {
    console.error('Error SHOW DATABASES:', e && e.message);
  }

  async function showCount(database) {
    try {
      const tmp = await mysql.createConnection({ host, port, user, password: pass, database });
      try {
        const [rows] = await tmp.execute('SELECT COUNT(*) AS c FROM patches');
        console.log(`DB=${database} patches count ->`, rows && rows[0] && rows[0].c);
      } catch (e) {
        console.log(`DB=${database} patches count -> error:`, e && e.message);
      } finally {
        await tmp.end();
      }
    } catch (e) {
      console.log(`DB=${database} connect -> error:`, e && e.message);
    }
  }

  // Check default candidate DBs
  for (const d of ['vcv_test', 'vcv']) {
    await showCount(d);
  }

  // list recent patches in current DB (if any)
  try {
    const [rows] = await conn.execute('SELECT id,user_name,file_path,uploaded_at FROM patches ORDER BY id DESC LIMIT 10');
    console.log('Recent patches in current connection DB ->', rows);
  } catch (e) {
    console.log('Could not query patches in current DB:', e && e.message);
  }

  try { await conn.end(); } catch (e) {}
}

main().catch(err => { console.error(err); process.exitCode = 1; });
