const express = require('express');
const multer = require('multer');
const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/upload/test', upload.single('file'), (req, res) => {
  console.log('UPLOAD TEST HANDLER REACHED');
  res.json({ ok: true, file: !!req.file });
});

app.listen(4000, () => {
  console.log('Minimal upload server running on http://localhost:4000');
});
