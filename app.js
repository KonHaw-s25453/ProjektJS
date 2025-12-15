
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

const express = require('express');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const zlib = require('zlib');
require('dotenv').config();
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
// Globalny logger żądań HTTP
app.use((req, res, next) => {
  console.log('REQUEST:', req.method, req.url);
  next();
});
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100, // limit 100 żądań na IP
});
// app.use(authMiddleware); // JWT -> req.user (wyłączone na czas debugowania uploadu)
// app.use(express.json()); // wyłączone na czas debugowania uploadu



// Przywrócony tylko parser JSON dla /api
app.use('/api', express.json());
app.use(patchesRouter); // /upload, /patches, ...



// Endpoint główny (GET /) — test oczekuje 200
app.get('/', (req, res) => {
  res.status(200).json({ ok: true });
});

// Obsługa 404 dla pozostałych nieistniejących endpointów
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not found' });
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
