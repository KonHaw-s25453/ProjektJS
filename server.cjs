// Minimal server entrypoint — require the app exported from app.cjs and start it.
const app = require('./app.cjs');

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
