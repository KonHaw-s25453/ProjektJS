const express = require('express');
const app = express();

// Tylko endpoint testowy
app.get('/', (req, res) => {
  res.json({ ok: true });
});

app.post('/register', (req, res) => {
  res.json({ ok: true, message: 'Request received' });
});

module.exports = app;