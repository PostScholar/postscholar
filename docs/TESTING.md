# Testing Guide

What to run before opening a PR. PostScholar’s automated tests live on the **server** (Jest + Supertest). The Next.js client has lint only — no unit test suite yet.

## Quick PR checklist

From the repo root, with a local Postgres DB running and migrations applied:

```bash
npm run migrate          # apply any new migrations
npm test                 # server integration tests
npm run lint             # server + client ESLint
npm run format:check     # optional — Prettier
```

If you changed auth, profiles, or OAuth, also run through the [manual smoke tests](#manual-smoke-tests-auth--profiles) below.

---

## Prerequisites

### Database

Tests hit a real Postgres database via `DATABASE_URL` in `server/.env`.

```bash
# From repo root
npm run migrate
```

Or from `server/`:

```bash
cd server && npm run migrate
```

New migrations must be applied before tests that depend on new columns (e.g. `021_oauth_and_verification.sql`, `022_display_name.sql`).

### Environment

`server/.env` needs at least:

- `DATABASE_URL`
- `JWT_SECRET`
- `CLIENT_URL` (e.g. `http://localhost:3001`)

Tests set `NODE_ENV=test`. Verification emails are **not** sent in test mode. Resend is not required for `npm test`.

---

## Commands

| Command | Where | What it does |
|---------|--------|----------------|
| `npm test` | repo root | Runs all server tests |
| `npm test` | `server/` | Same |
| `npm run lint` | repo root | ESLint on server + client |
| `npm run lint` | `server/` or `client-next/` | Lint one package |
| `npm run format:check` | repo root | Prettier check |
| `cd client-next && npm run build` | client | Catches Next.js build errors |

### Run a single test file

```bash
cd server
npm test -- tests/auth.test.js
npm test -- tests/auth-verify.test.js
npm test -- tests/social.test.js
npm test -- tests/papers.test.js
```

---

## Test suites

| File | Covers |
|------|--------|
| `auth.test.js` | Register, login, `/auth/me`, cookies |
| `auth-verify.test.js` | Email verification gate, ORCID `/auth/complete`, OAuth URL 503 when unconfigured |
| `social.test.js` | Follows, mentions, appreciation notifications, reports/moderation |
| `papers.test.js` | Manual paper + discussion + comment flow |

### Skipped / network tests

`papers.test.js` includes CrossRef lookup tests that are **skipped locally** unless `CI` is set:

```bash
CI=1 npm test -- tests/papers.test.js
```

Only run that when you have network access and want to exercise live CrossRef — not required for most PRs.

---

## What tests do *not* cover

- Google / GitHub OAuth token exchange (needs real OAuth apps + network)
- Resend email delivery (skipped in `NODE_ENV=test`)
- Browser UI / auth layout (manual or future E2E)
- Full Next.js component tests

---

## Manual smoke tests (auth & profiles)

After `npm run dev` (or with staging deployed), spot-check:

1. **Register** — email account → redirect to `/verify-email`; banner shows when browsing
2. **Verify** — click link in email (or use resend) → can post comments
3. **Login** — email/password; forgot/reset password still works
4. **Display name** — Settings → save → profile + comments show name; `@username` unchanged
5. **ORCID login** — “Continue with ORCID” → new user → `/auth/complete` for username
6. **ORCID verify** — on a discussion, author verify still works (separate from login)
7. **Google / GitHub** — only after OAuth env vars and redirect URIs are configured

---

## Production deploy order

When shipping auth/schema changes:

1. **Push** code (server + client)
2. **Deploy** server (Railway) and client (Vercel)
3. **Migrate production DB** — `cd server && npm run migrate:railway`
4. **Add OAuth env vars** on Railway (`GOOGLE_*`, `GITHUB_*`) and create OAuth apps with redirect URIs:
   - `https://postscholar.org/auth/google/callback`
   - `https://postscholar.org/auth/github/callback`
   - `http://localhost:3001/auth/google/callback` (local dev)
   - `http://localhost:3001/auth/github/callback` (local dev)

Migrations should run **as soon as the new server code is live** — the API expects columns from `021` and `022`. OAuth env vars can be added after deploy; social buttons return a clear error until then.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `column "email_verified" does not exist` | Run `npm run migrate` |
| Tests fail with 403 on POST `/discussions` | Test users need `email_verified = true` — see `server/tests/helpers.js` |
| `ENOTFOUND api.resend.com` in test output | Harmless if `NODE_ENV=test`; verification send is skipped |
| Port / DB connection errors | Check `DATABASE_URL` and that Postgres is running |

---

## Adding tests

- Put new server tests in `server/tests/`
- Use `supertest` against `require('../index')` — see existing files
- For register flows, call `verifyTestUserByEmail()` from `helpers.js` if the test needs to post comments or start discussions
- Prefer deterministic data (`Date.now()` / random suffix in emails and usernames) to avoid collisions

See also [DEVELOPER_NOTES.md](./DEVELOPER_NOTES.md) for architecture and auth design.
