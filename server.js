// Minimal server entrypoint — require the app exported from app.js and start it.
const app = require('./app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
