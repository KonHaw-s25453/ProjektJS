# VCV Landing (Next.js)

Minimal Next.js prototype for the public landing page (header, hero, search, list of patches).

Quick start:

1. cd `frontend`
2. npm install
3. npm run dev

Notes:
- The backend in this repo runs on port `3000`. The frontend dev server starts on port `3001` by default.
- If backend and frontend are on different ports, enable CORS in backend (`app.use(require('cors')())`) or configure a proxy.
- The prototype fetches `GET /patches` (relative URL). If CORS is not enabled, mock data will be used by the UI.

Dev proxy (recommended for this student project):

- This frontend includes `next.config.js` rewrites that proxy requests to the backend at `http://localhost:3000`.
- With rewrites active you can `fetch('/patches')` or `fetch('/api/user')` without enabling CORS on the backend during development.

If you prefer to enable CORS on the backend instead, add the following to `app.js` (dev only):

```js
const cors = require('cors');
app.use(cors({ origin: 'http://localhost:3001', credentials: true }));
```

