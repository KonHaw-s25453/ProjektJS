
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

const express = require('express');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const zlib = require('zlib');
require('dotenv').config();
const cheerio = require('cheerio');
// Konfiguracja Multer do uploadu plików
const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

const { authMiddleware } = require('./middleware/auth');
const authRouter = require('./routes/auth');
const patchesRouter = require('./routes/patches');
const adminRouter = require('./routes/admin');
const apiRouter = require('./routes/api');

let dbPool = null;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const app = express();

// // Najwcześniejszy log
// app.use((req, res, next) => {
//   console.log('EARLIEST MIDDLEWARE:', req.method, req.url);
//   next();
// });

// Upewnij się, że katalog 'uploads/' istnieje
// const uploadsDir = path.join(__dirname, 'uploads');
// const tmpUploadsDir = path.join(__dirname, 'tmp_uploads');
// try {
//   if (!fs.existsSync(uploadsDir)) {
//     fs.mkdirSync(uploadsDir);
//     console.log('Stworzono katalog uploads/');
//   }
//   if (!fs.existsSync(tmpUploadsDir)) {
//     fs.mkdirSync(tmpUploadsDir);
//     console.log('Stworzono katalog tmp_uploads/');
//   }
// } catch (err) {
//   console.error('Błąd przy tworzeniu katalogu uploads/ lub tmp_uploads/:', err);
//   throw err;
// }
// Globalny logger żądań HTTP
// app.use((req, res, next) => {
//   console.log('REQUEST:', req.method, req.url);
//   next();
// });
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minut
//   max: 100, // limit 100 żądań na IP
// });

// app.use(limiter);
// app.use(express.json()); // NIE globalnie! Konflikt z uploadem



// Przywrócony tylko parser JSON dla /api

app.use((req, res, next) => { console.log('MIDDLEWARE: przed /auth json', req.method, req.url); next(); });
app.use('/auth', express.json());
app.use('/register', express.json());
app.use((req, res, next) => { console.log('MIDDLEWARE: po /auth json', req.method, req.url, 'body:', req.body); next(); });
// app.use((req, res, next) => { console.log('MIDDLEWARE: przed /api json', req.method, req.url); next(); });
// app.use('/api', express.json());
// app.use((req, res, next) => { console.log('MIDDLEWARE: po /api json', req.method, req.url); next(); });

// Global auth middleware
app.use(authMiddleware);

// Mount routers for all main endpoints
console.log('Mounting routers...');
app.use(authRouter); // /register, /auth/login
console.log('authRouter mounted');
app.use('/api', apiRouter); // /api/user, /api/patch/:id
app.use('/admin', adminRouter); // /admin/users, /admin/logs, /admin/patches/:id, /admin/users/:id
app.use(patchesRouter); // /upload, /patches, ...




// Endpoint główny (GET /) — strona główna z info o API i statystykami
app.get('/', async (req, res) => {
  const db = await getDb();
  let stats = { patches: 0, users: 0, modules: 0 };
  if (db) {
    const [patchCount] = await db.execute('SELECT COUNT(*) as count FROM patches');
    const [userCount] = await db.execute('SELECT COUNT(*) as count FROM users');
    const [moduleCount] = await db.execute('SELECT COUNT(*) as count FROM modules');
    stats = {
      patches: patchCount[0].count,
      users: userCount[0].count,
      modules: moduleCount[0].count
    };
  }
  res.status(200).json({
    message: 'VCV Rack Patch Sharing API',
    version: '1.0',
    stats,
    endpoints: {
      auth: ['POST /register', 'POST /auth/login'],
      patches: ['POST /upload', 'GET /patches', 'GET /patches/:id', 'GET /download/:id', 'POST /patches/:id/notes', 'POST /patches/:id/tags', 'DELETE /patches/:id'],
      admin: ['GET /admin/users', 'GET /admin/logs', 'GET /users/:id']
    }
  });
});

// Endpoint do sprawdzania modułu w library.vcvrack.com
app.get('/check-module/:producer/:module', async (req, res) => {
  console.log('CHECK MODULE:', req.params);
  const { producer, module } = req.params;
  const url = `https://library.vcvrack.com/${producer}/${module}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(404).json({ error: 'Module not found' });
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    // Szukamy linku zawierającego "$" w tekście
    const priceLink = $('a').filter((i, el) => $(el).text().includes('$'));
    if (priceLink.length > 0) {
      const text = priceLink.text().trim();
      console.log('Price link text:', text);
      const priceMatch = text.match(/\$(\d+)/);
      if (priceMatch) {
        const price = priceMatch[1];
        return res.json({ found: true, producer, module, price });
      }
    }
    res.json({ found: false });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch or parse page' });
  }
});



// 404 handler: when integrating Next.js as a single server we skip this
// so Next can handle page routes. Set env `NEXT_INTEGRATION=1` to skip.
if (!process.env.NEXT_INTEGRATION) {
  app.use((req, res, next) => {
    console.log('MIDDLEWARE: 404 handler', req.method, req.url);
    res.status(404).json({ error: 'Not found' });
  });
}

// Globalny handler błędów Express
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR HANDLER:', err);
  res.status(500).json({ error: 'Internal server error', details: String(err) });
});



async function getDb() {
  if (!dbPool) {
    dbPool = await require('mysql2/promise').createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'vcv',
    });
    global.dbPool = dbPool;
  }
  return dbPool;
}



// Add a .close() method for Jest test cleanup
app.close = async function() {
  if (dbPool && typeof dbPool.end === 'function') {
    try {
      await dbPool.end();
    } catch (e) {
      // ignore errors during cleanup
    }
    dbPool = null;
  }
};


app.getDb = getDb;

// Dedykowany handler błędów Multer (musi być przed globalnym handlerem Express)
app.use(function multerErrorHandler(err, req, res, next) {
  if (err && err.name && err.name.startsWith('Multer')) {
    console.error('MULTER ERROR:', err);
    console.error('MULTER ERROR - req.method:', req.method, 'req.url:', req.url);
    if (req.file) console.error('MULTER ERROR - req.file:', req.file);
    if (req.body) console.error('MULTER ERROR - req.body:', req.body);
    return res.status(400).json({ error: 'Multer error', details: String(err) });
  }
  next(err);
});

// Globalny handler błędów Express (na samym końcu pliku)
app.use((err, req, res, next) => {
  console.error('EXPRESS ERROR:', err);
  console.error('EXPRESS ERROR - req.method:', req.method, 'req.url:', req.url);
  if (req.file) console.error('EXPRESS ERROR - req.file:', req.file);
  if (req.body) console.error('EXPRESS ERROR - req.body:', req.body);
  res.status(500).json({ error: 'Internal server error', details: String(err) });
});

module.exports = app;
