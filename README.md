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

Authentication & Roles
----------------------

This project now includes a simple JWT-based authentication scheme and role-based access control.

- Roles:
	- `0` = guest (not authenticated): can browse and search patches.
	- `1` = user: can create patches and edit/delete their own patches and metadata.
	- `2` = admin: like user, plus can edit/delete patches and users (except other admins and owner).
	- `3` = owner: full control, can promote/demote users to admin and delete admins.

- Endpoints of interest:
	- `POST /auth/login` — login with `{ username, password }`, returns `{ token, user }`.
	- `POST /users/:username/role` — owner only, change role for a user.
	- `DELETE /users/:username` — admin/owner deletion rules enforced.
	- `DELETE /patches/:id` — allowed for patch owner or admin.
	- `POST /upload` — now requires authentication (Bearer token). Include header `Authorization: Bearer <token>`.

- Seeds and owner account:
	- `seeds.sql` now inserts three example accounts (owner/admin/user). By default the seeded usernames are:
		- Owner: `Własc` (password: `hasł`)
		- Admin: `Adm` (password: `hasł`)
		- User: `Usr` (password: `hsł`)
	- To apply seeds: `npm run seed:node` or run `seeds.sql` against your database.

- Configuration:
	- `JWT_SECRET` — set this env var in production to a strong secret. Default (development) is `dev-secret-change-me`.

Testing notes
-------------

- Tests use a file-backed mock DB for unit tests (`process.env.MOCK_DB=1`).
- Tests now exercise auth flows and permissions. When writing new tests that call protected endpoints, sign a token using the same `JWT_SECRET` or call `/auth/login` against seeded users in the mock DB.

Security notes
--------------

- Seeded password hashes are present in `seeds.sql` for convenience in development; rotate or remove them before sharing the repository publicly.
- Consider enforcing stricter policies for production (disable seeding, require real accounts, rotate secrets, use HTTPS, etc.).