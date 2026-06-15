# Developer Guide

This guide covers setup, deployment, and common development tasks for PostScholar.

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Database Management](#database-management)
3. [Deployment](#deployment)
4. [Common Tasks](#common-tasks)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

## Local Development Setup

### Prerequisites

- **Node.js** 18 or higher
- **PostgreSQL** 14 or higher
- **npm** (comes with Node.js)
- **Git**

### Initial Setup

1. **Clone and install dependencies**:
```bash
git clone https://github.com/PostScholar/postscholar.git
cd postscholar
npm install
cd server && npm install
cd ../client-next && npm install
cd ..
```

2. **Set up PostgreSQL database**:
```bash
# Create database
createdb postscholar

# Or using psql:
psql postgres
CREATE DATABASE postscholar;
\q
```

3. **Configure environment variables**:

```bash
cp server/.env.example server/.env
# Edit server/.env with your values
```

See [`server/.env.example`](../server/.env.example) for the full list. Minimum for local dev:

**server/.env**:
```env
DATABASE_URL=postgresql://localhost:5432/postscholar
JWT_SECRET=your-dev-secret-key-change-in-production
CLIENT_URL=http://localhost:3001
ORCID_CLIENT_ID=your-orcid-client-id
ORCID_CLIENT_SECRET=your-orcid-client-secret
PORT=3000
```

ORCID redirect is derived from `CLIENT_URL` (`{CLIENT_URL}/orcid/callback`).
Google and GitHub callbacks also use the frontend URL (`{CLIENT_URL}/auth/google/callback` and `{CLIENT_URL}/auth/github/callback`).

**client-next/.env.local**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. **Run database migrations**:
```bash
npm run migrate
```

5. **Start development servers**:
```bash
# Run both frontend and backend together:
npm run dev

# Or run separately in different terminals:
npm run dev:server  # http://localhost:3000
npm run dev:client  # http://localhost:3001
```

## Database Management

### Running Migrations

**Local development**:
```bash
npm run migrate
```

**Remote (Railway)**:
```bash
# Recommended: from server/ directory
cd server
npm run migrate:railway

# Alternative: Railway CLI from repo root
railway run node server/db/migrate.js

# Alternative: direct connection string
cd server && DATABASE_URL="postgresql://..." node db/migrate.js
```

Migration state is tracked in the `migrations` table (not `schema_migrations`).

### Creating a New Migration

1. Create a new SQL file in `server/db/migrations/`:
```bash
touch server/db/migrations/016_your_migration_name.sql
```

2. Write idempotent SQL:
```sql
-- Use IF NOT EXISTS for safety
CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_new_table_created ON new_table(created_at DESC);
```

3. Run the migration:
```bash
npm run migrate
```

### Migration Best Practices

- **Always use `IF NOT EXISTS`** for tables, indexes, and constraints
- **Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`** for new columns
- **Test migrations locally** before running in production
- **Make migrations reversible** when possible
- **Add comments** explaining complex migrations

### Resetting the Database

```bash
# Drop and recreate database
dropdb postscholar
createdb postscholar

# Run all migrations
npm run migrate
```

## Deployment

### Frontend (Vercel)

PostScholar uses Vercel for frontend hosting.

1. **Connect repository to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set root directory to `client-next`

2. **Configure environment variables in Vercel**:
   - `NEXT_PUBLIC_API_URL` → Your Railway backend URL
   - `API_URL` → Same Railway backend URL for server-side rendering and `/api` rewrites

3. **Deploy**:
   - Vercel automatically deploys on push to main
   - Preview deployments for all PRs

### Backend (Railway)

PostScholar uses Railway for backend hosting.

1. **Connect repository to Railway**:
   - Go to [railway.app](https://railway.app)
   - Create new project from GitHub repo
   - Set root directory to `server`

2. **Add PostgreSQL database**:
   - Click "New" → "Database" → "PostgreSQL"
   - Railway automatically sets `DATABASE_URL`

3. **Configure environment variables**:
   - `JWT_SECRET` → Generate secure secret
   - `CLIENT_URL` → Your Vercel URL (https://postscholar.org)
   - `ORCID_CLIENT_ID` → From ORCID developer console
   - `ORCID_CLIENT_SECRET` → From ORCID developer console
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` → From Google Cloud OAuth credentials
   - `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` → From GitHub OAuth app settings
   - `NODE_ENV` → `production` (enables stricter rate limits)
   - `PORT` → 3000 (Railway sets this automatically)
   - `RESEND_API_KEY` / `EMAIL_FROM` → For password reset and verification emails

4. **Run migrations on Railway**:
```bash
cd server
npm run migrate:railway
```

5. **Promote a moderator** (after `018_user_roles.sql`):
```sql
UPDATE users SET role = 'moderator' WHERE username = 'yourusername';
```
Run in Railway Postgres → Query. Then sign out and back in on postscholar.org. Open `/moderation`.

6. **Deploy**:
   - Railway automatically deploys on push to main
   - Monitor logs in Railway dashboard

### ORCID Setup

1. **Register application** at https://orcid.org/developer-tools
2. **Set redirect URI** to `{CLIENT_URL}/orcid/callback` (for example, `https://postscholar.org/orcid/callback`)
3. **Add credentials** to environment variables

## Common Tasks

### Adding a New API Endpoint

1. **Create route in server**:
```javascript
// server/routes/example.js
const express = require('express')
const router = express.Router()
const pool = require('../db')
const authenticateToken = require('../middleware/authenticateToken')

router.get('/example', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM example WHERE user_id = $1', [req.user.userId])
    res.json({ data: result.rows })
  } catch (err) {
    console.error('GET /example error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
```

2. **Register route in server/index.js**:
```javascript
app.use('/example', require('./routes/example'))
```

3. **Add client function in client-next/src/lib/api.js**:
```javascript
export function getExample() {
  return api.get('/example')
}
```

4. **Use in component**:
```javascript
import { getExample } from '@/lib/api'

const data = await getExample()
```

### Adding a New Page

1. **Create page file**:
```bash
touch client-next/src/app/example/page.js
```

2. **Add page content**:
```javascript
export const metadata = {
  title: 'Example — PostScholar'
}

export default function ExamplePage() {
  return <div>Example</div>
}
```

### Running Tests

```bash
# Server tests
cd server
npm test

# Client tests (when added)
cd client-next
npm test
```

### Linting and Type Checking

```bash
# Client
cd client-next
npm run lint
npm run build  # Includes type checking

# Server
cd server
npm run lint
```

## Testing

### Manual Testing Checklist

Before deploying major changes:

- [ ] Test auth flow (register, login, logout)
- [ ] Test paper lookup with valid DOI
- [ ] Test discussion creation
- [ ] Test commenting and replies
- [ ] Test ORCID verification
- [ ] Test bookmarks
- [ ] Test profile editing
- [ ] Test rate limiting (try 15+ rapid requests)
- [ ] Test error boundaries (trigger errors)
- [ ] Test 404 page (visit invalid URL)

### API Testing with curl

```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -c cookies.txt

# Protected endpoint
curl http://localhost:3000/auth/me \
  -b cookies.txt
```

## Troubleshooting

### Port already in use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database connection errors

```bash
# Check PostgreSQL is running
pg_isready

# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Migration errors

```bash
# Check which migrations have run
psql $DATABASE_URL -c "SELECT * FROM migrations ORDER BY id"

# Manual rollback (if needed) — migrations are forward-only; fix forward with a new SQL file
psql $DATABASE_URL
DELETE FROM migrations WHERE filename = '016_problematic.sql';
\q

# Re-run migrations
npm run migrate
```

### CORS errors

Ensure `CLIENT_URL` in server/.env matches your frontend URL exactly:
```env
CLIENT_URL=http://localhost:3001  # Local
CLIENT_URL=https://postscholar.org  # Production
```

### Next.js build errors

```bash
# Clear Next.js cache
cd client-next
rm -rf .next

# Rebuild
npm run build
```

### Cookie not being set

- Check that `credentials: true` is set in CORS config
- Ensure frontend uses `credentials: 'include'` in fetch
- Verify cookie is httpOnly and secure in production
- Check that domains match (no cross-origin issues)

## Environment Variables Reference

### Server

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for JWT signing | `your-secret-key` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3001` |
| `NODE_ENV` | Runtime environment; production enables stricter defaults | `production` |
| `ORCID_CLIENT_ID` | ORCID OAuth client ID | From ORCID developer console |
| `ORCID_CLIENT_SECRET` | ORCID OAuth client secret | From ORCID developer console |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | From Google Cloud |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | From Google Cloud |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | From GitHub developer settings |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | From GitHub developer settings |
| `RESEND_API_KEY` | Resend API key for password reset and verification email | From Resend |
| `EMAIL_FROM` | Sender for transactional email | `PostScholar <noreply@postscholar.org>` |
| `SENTRY_DSN` | Optional Sentry DSN for error tracking | From Sentry |
| `RATE_LIMIT_AUTH_MAX` | Optional auth rate limit override per 15 minutes | `10` |
| `RATE_LIMIT_GENERAL_MAX` | Optional general rate limit override per 15 minutes | `100` |
| `PORT` | Server port | `3000` |

### Client

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000` |
| `API_URL` | Optional server-side/proxy backend API URL | `http://localhost:3000` |

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express Documentation](https://expressjs.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [ORCID API Documentation](https://info.orcid.org/documentation/api-tutorials/)
