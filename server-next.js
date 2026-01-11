// server-next.js
// Integrates Next.js with the existing Express `app` so the whole project
// runs on a single origin (one process, one port).

const next = require('next');
const http = require('http');
const path = require('path');
// Indicate to `app.js` that Next integration is active so it can skip its
// built-in 404 handler. This must be set BEFORE requiring `./app`.
process.env.NEXT_INTEGRATION = '1';
const appExpress = require('./app.cjs'); // existing Express app

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev, dir: 'frontend' });
const handle = nextApp.getRequestHandler();

(async () => {
  try {
    await nextApp.prepare();

    // Tell the Express app that Next integration is active. This lets app.js
    // skip its own 404 handler so Next can serve pages.
    process.env.NEXT_INTEGRATION = '1';

    // Mount Next's request handler as a fallback for any routes not handled
    // by the existing Express routers (API/upload routes remain as-is).
    appExpress.all('*', (req, res) => {
      return handle(req, res);
    });

    const port = process.env.PORT || 3000;
    const server = http.createServer(appExpress);
    server.listen(port, () => {
      console.log(`Server (Next+Express) listening on http://localhost:${port} (dev=${dev})`);
    });
  } catch (err) {
    console.error('Failed to start Next+Express server:', err);
    process.exit(1);
  }
})();
