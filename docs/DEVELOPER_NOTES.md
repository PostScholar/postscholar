# Developer Notes

Technical architecture, design decisions, and implementation details for PostScholar.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Authentication & Security](#authentication--security)
4. [API Design](#api-design)
5. [Frontend Architecture](#frontend-architecture)
6. [Third-Party Integrations](#third-party-integrations)
7. [Performance Considerations](#performance-considerations)
8. [Known Limitations](#known-limitations)

## Architecture Overview

PostScholar follows a modern client-server architecture:

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  Next.js 16 (App Router) + React 19 on Vercel  │
└─────────────────┬───────────────────────────────┘
                  │ HTTPS + JWT httpOnly cookies
                  │
┌─────────────────▼───────────────────────────────┐
│                   Backend                        │
│     Express 5 + PostgreSQL 14 on Railway        │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
   ┌────▼────┐      ┌──────▼──────┐
   │CrossRef │      │    ORCID    │
   │   API   │      │    OAuth    │
   └─────────┘      └─────────────┘
```

### Design Principles

1. **Separation of concerns**: Frontend handles UI/UX, backend handles business logic
2. **Security-first**: All sensitive operations require authentication
3. **Idempotent migrations**: Database migrations are safe to run multiple times
4. **Academic focus**: Not a social media platform - quiet follower counts, no trending/popularity metrics
5. **Progressive enhancement**: Core features work without JavaScript where possible

## Database Schema

### Core Tables

**users**
- Stores user accounts and profile information
- Profile visibility controls (bio, joined_date, activity)
- Extended fields: affiliation, location, social links, ORCID ID

**papers**
- Stores paper metadata from CrossRef or manual entry
- `source` field tracks whether paper came from CrossRef or manual entry
- `authors_json` stores structured author data

**discussions**
- One discussion per paper (enforced at application layer, not DB)
- Links to paper via `paper_id`
- Tracks creator via `created_by`
- Supports topic tagging via `topics_json`

**comments**
- Threaded comments with `parent_comment_id`
- Cascading deletes when parent comment or discussion is deleted
- Updated timestamps tracked automatically via trigger

**bookmarks**
- Many-to-many relationship between users and discussions
- Composite primary key prevents duplicates

**follows**
- Many-to-many relationship for user following
- CHECK constraint prevents self-follows
- Composite primary key prevents duplicate follows

**reports**
- Moderation system for comments and discussions
- Enum-style CHECK constraints for reason and status
- Tracks reporter, target, and resolution

**discussion_views**
- Anonymous view tracking with IP hash
- Optional user_id for authenticated views
- Used for analytics, not displayed prominently

### Migrations

Location: `server/db/migrations/*.sql`

Migrations are numbered sequentially (001-015 currently) and tracked in `schema_migrations` table.

**Key patterns**:
```sql
-- Idempotent table creation
CREATE TABLE IF NOT EXISTS table_name (...);

-- Idempotent column addition
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name TYPE;

-- Idempotent index creation
CREATE INDEX IF NOT EXISTS idx_name ON table_name(column);

-- Idempotent trigger
DROP TRIGGER IF EXISTS trigger_name ON table_name;
CREATE TRIGGER trigger_name ...;
```

### Database Triggers

**updated_at triggers**: Automatically update `updated_at` timestamp on UPDATE operations for users, comments, discussions, and papers.

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Indexes

Strategic indexes for common queries:
- Discussion lookups by paper_id
- Comment lookups by discussion_id and parent_comment_id
- User lookups by username and email
- Bookmark checks (user_id, discussion_id)
- Follow relationships (follower_id, following_id)
- Created_at/updated_at for sorting

## Authentication & Security

### JWT Authentication

**Flow**:
1. User logs in with email/password
2. Server verifies credentials via bcrypt
3. Server generates JWT with user ID and username
4. JWT stored in httpOnly cookie (not accessible to JavaScript)
5. Subsequent requests include cookie automatically
6. Server verifies JWT on protected routes via `authenticateToken` middleware

**Why httpOnly cookies?**
- Prevents XSS attacks from stealing tokens
- Browser handles cookie storage/sending automatically
- Works seamlessly with CORS when configured correctly

### CORS Configuration

```javascript
app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    'https://www.postscholar.org',
    'https://postscholar.vercel.app',
    'http://localhost:3001'
  ],
  credentials: true
}))
```

**credentials: true** is required for httpOnly cookies to work cross-origin.

### Rate Limiting

Two-tier rate limiting via `express-rate-limit`:

1. **Auth endpoints** (login, register, password reset): 10 attempts / 15 minutes
   - `skipSuccessfulRequests: true` - only failed attempts count
2. **General endpoints**: 100 requests / 15 minutes

### XSS Prevention

User-generated content is sanitized via `sanitize-html`:

```javascript
function sanitizeComment(body) {
  return sanitizeHtml(body, {
    allowedTags: ['b', 'i', 'em', 'strong', 'code', 'pre', 'p', 'br'],
    allowedAttributes: {},
    disallowedTagsMode: 'recursiveEscape'
  })
}
```

Allows basic formatting but strips dangerous HTML/scripts.

### SQL Injection Prevention

All queries use parameterized queries via `pg`:

```javascript
// Safe - uses $1, $2 placeholders
await pool.query('SELECT * FROM users WHERE email = $1', [email])

// Unsafe - never do this
await pool.query(`SELECT * FROM users WHERE email = '${email}'`)
```

### Password Storage

Passwords are hashed with bcrypt (10 rounds) before storage:

```javascript
const hashedPassword = await bcrypt.hash(password, 10)
```

## API Design

### Endpoint Naming Conventions

- **Resource-oriented**: `/users/:username`, `/discussions/:id`
- **Actions as HTTP verbs**: GET, POST, PATCH, DELETE
- **Nested resources**: `/discussions/:id/comments`
- **Wildcard for DOIs**: `/papers/*doi` (DOIs contain slashes)

### Response Patterns

**Success**:
```json
{
  "user": { ... },
  "token": "..."
}
```

**Error**:
```json
{
  "error": "User not found"
}
```

### Middleware

**authenticateToken**: Verifies JWT, adds `req.user` with `userId` and `username`, returns 401 if invalid.

**optionalAuth**: Like authenticateToken but doesn't fail if token is missing - used for public endpoints that behave differently for authenticated users.

### Error Handling

Standard pattern across all routes:

```javascript
try {
  // Route logic
} catch (err) {
  console.error('Route error:', err)
  res.status(500).json({ error: 'Internal server error' })
}
```

## Frontend Architecture

### Next.js 16 App Router

PostScholar uses the Next.js App Router (not Pages Router):

- **File-based routing**: `src/app/path/page.js` → `/path`
- **Server Components by default**: Use `'use client'` for interactivity
- **Layouts**: `layout.js` wraps all child pages
- **Loading states**: `loading.js` for Suspense boundaries
- **Error handling**: `error.js` for error boundaries (we use custom ErrorBoundary component)

### Component Structure

```
src/
├── app/
│   ├── layout.js           # Root layout (Nav, Providers, ErrorBoundary)
│   ├── page.js             # Home page
│   ├── not-found.js        # 404 page
│   ├── d/[id]/page.js      # Discussion page
│   ├── explore/page.js     # Explore feed
│   ├── profile/[username]/ # User profiles
│   └── settings/page.js    # Settings
├── components/
│   ├── Nav.jsx             # Navigation bar
│   ├── FeedCard.jsx        # Discussion card
│   ├── Comment.jsx         # Comment component
│   ├── PaperHeader.jsx     # Paper metadata display
│   ├── ErrorBoundary.jsx   # Error boundary component
│   ├── EmptyState.jsx      # Empty state component
│   ├── Skeleton.jsx        # Loading skeletons
│   └── Button.jsx          # Button component
└── lib/
    └── api.js              # API client functions
```

### State Management

PostScholar uses **React Context** for global state:

- `AuthContext`: Current user, login/logout functions
- `SettingsContext`: User preferences (theme, etc.)

No Redux/Zustand - Context is sufficient for our needs.

### Styling

**CSS Modules** for component-scoped styles:

```javascript
import styles from './Component.module.css'

<div className={styles.container}>...</div>
```

**Advantages**:
- No class name collisions
- Co-located with components
- Tree-shakeable
- No runtime overhead

### API Client

All API calls go through `src/lib/api.js`:

```javascript
export const api = {
  get:    (path)        => request(path),
  post:   (path, body)  => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch:  (path, body)  => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path)        => request(path, { method: 'DELETE' }),
}
```

Automatically includes credentials and handles errors.

## Third-Party Integrations

### CrossRef API

**Purpose**: Fetch paper metadata by DOI

**Endpoint**: `https://api.crossref.org/works/{doi}`

**Rate limits**: Polite pool (50 requests/second) with User-Agent header

**Implementation**:
```javascript
const crossrefUrl = `https://api.crossref.org/works/${encodeURIComponent(doi)}`
const res = await fetch(crossrefUrl, {
  headers: { 'User-Agent': 'PostScholar/1.0 (mailto:hello@postscholar.org)' }
})
```

**Normalization**: CrossRef returns inconsistent data - we normalize it via `normalizeCrossRef()` function.

### ORCID OAuth

**Purpose**: Verify paper authors via ORCID iD

**Flow**:
1. User clicks "Verify with ORCID" button
2. Backend generates state token, stores in database
3. User redirected to ORCID OAuth consent screen
4. ORCID redirects back with code + state
5. Backend exchanges code for access token
6. Backend fetches ORCID profile
7. Backend compares ORCID name against paper authors
8. If match, discussion creator gets author badge

**Endpoints**:
- `/auth/orcid/url?discussion_id=X` - Get OAuth URL
- `/auth/orcid/callback?code=X&state=Y` - Handle callback

**Name matching**: Fuzzy matching via Levenshtein distance to handle variations (J. Smith vs John Smith).

### OpenCitations API

**Purpose**: Fetch citation counts for papers

**Endpoint**: `https://opencitations.net/index/api/v1/citation-count/{doi}`

**Rate limits**: No authentication required, reasonable use policy

**Implementation**:
```javascript
const ocRes = await fetch(`https://opencitations.net/index/api/v1/citation-count/${doi}`)
const ocData = await ocRes.json()
const citationCount = Array.isArray(ocData) && ocData[0]?.count
  ? parseInt(ocData[0].count)
  : null
```

**Limitations**: Only papers indexed in OpenCitations (may return null for recent papers).

## Performance Considerations

### Database Query Optimization

- **Indexes on foreign keys**: All foreign keys have indexes
- **Covering indexes**: Include commonly selected columns
- **LIMIT clauses**: All list queries use LIMIT to prevent large result sets
- **Connection pooling**: pg Pool manages connections efficiently

### N+1 Query Prevention

Use JOINs instead of sequential queries:

```javascript
// Bad - N+1 queries
const discussions = await pool.query('SELECT * FROM discussions')
for (const d of discussions.rows) {
  const paper = await pool.query('SELECT * FROM papers WHERE id = $1', [d.paper_id])
}

// Good - Single query with JOIN
const discussions = await pool.query(`
  SELECT d.*, p.title, p.authors_json
  FROM discussions d
  JOIN papers p ON p.id = d.paper_id
`)
```

### Frontend Performance

- **Server Components**: Render on server when possible
- **Lazy loading**: Use dynamic imports for large components
- **Skeleton loaders**: Show loading states immediately
- **Optimistic updates**: Update UI before server confirms (bookmarks, follows)
- **Image optimization**: Next.js Image component for automatic optimization

### Caching Strategy

- **Static pages**: Cached at CDN (Vercel)
- **Dynamic data**: No caching (always fresh)
- **API responses**: No caching (privacy concerns)

## Known Limitations

### Discussion Per Paper

Currently enforced at application layer, not database:
- Users can create multiple discussions for same paper
- Should add unique constraint: `UNIQUE (paper_id)` on discussions table
- Planned for future migration

### Moderation

No role-based access control yet:
- `GET /reports` is protected but doesn't check if user is moderator
- TODO: Add `role` column to users table with 'user', 'moderator', 'admin' roles
- TODO: Add role check middleware

### Search

Current search is basic SQL ILIKE:
```sql
WHERE title ILIKE '%query%' OR abstract ILIKE '%query%'
```

Future improvements:
- Full-text search with `tsvector` and `tsquery`
- Search ranking with `ts_rank`
- Highlighted snippets

### Real-time Updates

No WebSocket/SSE for live updates:
- Comments require page refresh to see new additions
- Could add polling or WebSockets in future
- Next.js 16 supports Server-Sent Events natively

### Testing

Limited test coverage:
- Basic server route tests exist
- No frontend tests yet
- No integration/E2E tests
- Should add: Jest + React Testing Library + Playwright

## Further Reading

### Official Documentation
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [OWASP Security Guidelines](https://owasp.org/www-project-web-security-testing-guide/)

### Security Resources
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

### Database Design
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [Database Normalization](https://en.wikipedia.org/wiki/Database_normalization)
- [Idempotent Migrations](https://www.enterprisedb.com/postgres-tutorials/how-create-idempotent-database-migrations-postgres)

### API Design
- [REST API Design](https://restfulapi.net/)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [API Rate Limiting](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
