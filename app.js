
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
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100, // limit 100 żądań na IP
});
app.use(authMiddleware); // JWT -> req.user
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(authRouter); // /register, /auth/login
app.use(patchesRouter); // /upload, /patches, ...
app.use(adminRouter); // /admin, /users
app.use(apiRouter); // /api



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
module.exports = app;
