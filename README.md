# VCV Patch Archive — scaffold

This repository contains a minimal scaffold for a VCV Rack patch upload and indexing service.

Quick start (PowerShell):

1. Copy environment file and fill values:

```powershell
Copy-Item .env.example .env -Force
# Edit .env to set DB_HOST, DB_USER, DB_PASS, DB_NAME
```

2. Install dependencies:

```powershell
# For student/dev environments use `npm install` to generate a package-lock.json
npm install
```

3. Create the MySQL schema (example):

```powershell
# Option A: use the Node migration helper (reads .env)
npm run migrate

# Option B: run schema.sql directly using the mysql client:
# mysql -u root -p < schema.sql
```

4. Run the server:

```powershell
npm run dev
```

5. (Optional) Seed example categories and demo user:

```powershell
# Option A (no extra tools, uses Node-based seeder):
npm run seed:node

# Option B (uses mysql CLI):
npm run seed
```

Files added:

- `server.js` — Express server with endpoints `/upload`, `/patches`, `/patches/:id`, `/download/:id`.
- `public/index.html` — minimal frontend for upload and browsing.
- `schema.sql` — MySQL schema for tables: users, categories, patches, modules, patch_modules.
- `.env.example` — example environment variables.

Tests
-----

This project includes basic integration tests using `jest` and `supertest`.

Run tests (uses the file-backed mock DB):

```powershell
# tests run with mock DB automatically
npm test
```

The test suite resets `data/mock_db.json` before each test so tests are isolated.

Notes:

- The server attempts to parse `.vcv` files using `zlib.inflateSync` and extract objects with `plugin` + `model` fields as module heuristics.
- This is a scaffold: add authentication, validation, pagination, and stronger error handling before production.