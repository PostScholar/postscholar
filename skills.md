# PostScholar — Skills & Resume Reference

**PostScholar** — [postscholar.org](https://postscholar.org)  
Open academic discussion platform for published research papers. Researchers paste a DOI, start or join focused threads, verify authorship via ORCID, and engage in post-publication discourse with a growing community of scholars.

---

## One-line resume bullets (pick & adapt)

- Built and shipped **PostScholar**, a full-stack academic discussion platform (Next.js, Express, PostgreSQL) with OAuth, ORCID verification, threaded comments, moderation, and SEO-optimized public pages.
- Designed and implemented **community features** — user profiles, follows, @mentions, bookmarks, topic feeds, comment reactions, and a moderator reporting workflow — for researchers discussing published papers.
- Implemented **technical SEO** end to end: dynamic sitemaps, robots.txt, canonical URLs, Open Graph/Twitter cards, and Schema.org JSON-LD for discussions and scholarly articles.

---

## Technical skills (end to end)

### Languages
- **JavaScript** (ES modules + CommonJS)
- **SQL** (PostgreSQL — queries, migrations, triggers, indexes, constraints)
- **HTML / CSS**
- **JSON / REST API design**

### Frontend
- **React 19**
- **Next.js 16** (App Router)
- **React Server Components (RSC)** — server-rendered pages, async data fetching
- **Client Components** (`'use client'`) — interactivity, forms, auth state
- **React Context** — global auth and theme state
- **React Suspense** — loading boundaries
- **Next.js Metadata API** — `metadata`, `generateMetadata`, `viewport`
- **Next.js dynamic routing** — `[slug]`, `[username]`, `[id]`
- **Next.js rewrites** — API proxy for cookie-safe cross-origin auth (mobile Safari)
- **Next.js ISR / caching** — `revalidate`, `force-dynamic`, `cache: 'no-store'`
- **CSS Modules** — scoped component styling
- **Responsive / mobile-first UI**
- **Dark / dim theme** — CSS custom properties, `localStorage`, `data-theme`
- **KaTeX** — LaTeX math rendering in comments
- **Lucide React** — icon system
- **Web Share API** + clipboard fallback
- **Accessibility** — ARIA labels, semantic HTML, keyboard-friendly controls
- **Error boundaries** — graceful client error handling
- **Loading skeletons & empty states** — perceived performance UX

### Backend
- **Node.js**
- **Express 5** — REST API, middleware pipeline, route modules
- **RESTful API design** — resource-oriented endpoints, nested resources
- **Middleware** — auth, optional auth, email verification gate, error handler
- **JWT authentication** — token generation and verification
- **httpOnly cookies** — secure session storage (XSS-resistant)
- **bcrypt** — password hashing
- **CORS** — cross-origin credentials for frontend/backend split
- **Helmet** — HTTP security headers
- **express-rate-limit** — auth and general API throttling
- **cookie-parser** — session cookie handling
- **sanitize-html** — XSS prevention on user-generated content
- **Parameterized SQL queries** — SQL injection prevention (`pg`)
- **Custom error handling** — `AppError`, centralized error middleware
- **Health checks** — `/health` with DB ping
- **Trust proxy** — correct client IP behind Railway/Vercel reverse proxies

### Database
- **PostgreSQL 14+**
- **Schema design** — users, papers, discussions, comments, bookmarks, follows, reports, mentions, reactions, views
- **Relational modeling** — foreign keys, composite keys, CHECK constraints
- **Database migrations** — numbered, idempotent SQL migration system
- **PL/pgSQL triggers** — auto `updated_at` timestamps
- **Strategic indexing** — lookups, sorting, feed queries
- **Full-text / search queries** — discussion and comment search
- **Cursor-based pagination**
- **Enum-style constraints** — report reasons, moderation statuses, user roles

### Authentication & identity
- **Email/password auth** — register, login, forgot/reset password
- **Email verification** — token-based verify flow, resend (rate-limited)
- **OAuth 2.0** — Google sign-in and account linking
- **OAuth 2.0** — GitHub sign-in and account linking
- **ORCID OAuth** — login, author verification, author badges on discussions
- **Multi-provider account linking** — connect/disconnect sign-in methods
- **Role-based access** — user, moderator, admin
- **Protected routes** — JWT middleware on server; client auth guards

### Third-party integrations & APIs
- **CrossRef API** — DOI lookup, paper metadata normalization (title, authors, journal, abstract, year)
- **ORCID API** — OAuth and author identity verification
- **Google OAuth**
- **GitHub OAuth**
- **Resend** — transactional email (verification, password reset)
- **Fetch API** — server-side HTTP to external APIs

### Community & social platform features
Built a full **user community** around academic paper discussions:

| Feature | Description |
|--------|-------------|
| **User accounts & profiles** | Username, display name, bio, affiliation, location, social links, ORCID ID, profile visibility controls |
| **Paper discussions** | Start threads from DOI or manual entry; one discussion per paper |
| **Threaded comments** | Nested replies, depth limits, sort (newest / top) |
| **Comment reactions** | Upvote-style “+” appreciation (one per user per comment) |
| **@Mentions** | Tag users in comments; dedicated mentions inbox and notifications |
| **Follow system** | Follow researchers; follower/following lists |
| **Topic follows** | Subscribe to academic topics for personalized explore feed |
| **Bookmarks** | Save discussions for later |
| **Explore feed** | Browse, filter by topic, sort by activity |
| **Search** | Full-text search across discussions and comments |
| **Author verification** | ORCID-linked verified author badges on paper threads |
| **View tracking** | Anonymous + authenticated discussion view analytics |
| **Content reporting** | Users report spam, harassment, off-topic, misinformation |
| **Moderation dashboard** | Moderators review reports, update status (pending → actioned/dismissed) |
| **Share discussions** | Native share + copy link for spreading threads |
| **Settings** | Profile editing, topic preferences, connected accounts, password management |

Platform principles: academic-focused (not social-media-style), institution-agnostic, free and open.

### SEO & discoverability
Implemented **search engine optimization** across the stack:

| Area | Implementation |
|------|----------------|
| **Meta tags** | Site-wide `title`, `description`, `metadataBase` in root layout |
| **Per-page metadata** | `generateMetadata` on discussion, profile, explore, about, and static pages |
| **Open Graph** | `og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`, `og:locale`, article authors/time |
| **Twitter Cards** | `summary_large_image` cards on key pages |
| **Canonical URLs** | Slug-based discussion URLs with canonical redirects (duplicate URL prevention) |
| **SEO-friendly URLs** | Human-readable slugs: `/d/{paper-title-slug}-{id}` |
| **robots.txt** | Next.js `robots.js` — allow public pages, disallow `/settings`, `/moderation`, auth pages |
| **Dynamic sitemap** | Next.js `sitemap.js` — static pages + all discussions from API, hourly revalidation |
| **Sitemap API** | Backend `/sitemap/discussions` endpoint for crawlable discussion URLs |
| **Structured data (JSON-LD)** | Schema.org `WebSite` + `SearchAction` on homepage |
| **Structured data (JSON-LD)** | `ScholarlyArticle` + `DiscussionForumPosting` + nested `Comment` on discussion pages |
| **Semantic HTML** | Proper headings, article/discussion page structure for crawlers |
| **Public indexable content** | Discussions, explore, profiles, about — server-rendered for bots |
| **Legacy sitemap script** | Standalone PostgreSQL → `sitemap.xml` export for one-off use |

### DevOps, CI/CD & tooling
- **Git / GitHub** — version control, PR workflow, open-source repo
- **GitHub Actions** — CI pipeline (tests, lint, production build)
- **GitHub Dependabot** — dependency update automation
- **Husky** — pre-commit hooks (lint before commit)
- **ESLint 9** — server and client linting (`eslint-config-next`)
- **Prettier** — code formatting
- **concurrently** — run frontend + backend in dev
- **nodemon** — backend hot reload in development
- **Jest** — backend integration/unit tests
- **Supertest** — HTTP API testing
- **PostgreSQL in CI** — GitHub Actions service container for test DB
- **npm workspaces-style monorepo scripts** — root orchestration of client + server

### Deployment & infrastructure
- **Vercel** — Next.js frontend hosting, edge-friendly static assets
- **Railway** — Express API + PostgreSQL production database
- **Environment configuration** — `.env` / `.env.local`, secrets management
- **Database migrations in production** — Railway CLI migration runner
- **HTTPS** — production TLS on both frontend and API origins
- **Custom domain** — postscholar.org

### Testing
- **Integration tests** — auth, OAuth users, connections, papers/CrossRef, social features, email verification
- **Test helpers & setup** — isolated test DB, migration before test run
- **CI gate** — tests + lint + `next build` on every PR

### Architecture & patterns
- **Client–server separation** — Next.js UI + Express API
- **Monorepo layout** — `client-next/`, `server/`, shared root scripts
- **Idempotent migrations**
- **Progressive enhancement** — core content available without heavy client JS
- **Slug parsing & canonical redirects** — SEO-safe URL handling
- **IP hashing** — privacy-conscious view tracking
- **Rate limiting & input sanitization** — abuse prevention for a public community platform

### Legacy / additional
- **Vite + React** — earlier `client/` SPA (superseded by `client-next/`)
- **CSS custom properties** — design tokens (spacing, typography, colors)

---

## Skills grouped for resume “Skills” section

Copy the lines that fit your resume format:

**Frontend:** React, Next.js, React Server Components, JavaScript, HTML, CSS Modules, responsive design, accessibility (ARIA), KaTeX, client/server state (Context)

**Backend:** Node.js, Express, REST APIs, JWT, OAuth 2.0, middleware, rate limiting, input sanitization

**Database:** PostgreSQL, SQL, schema design, migrations, triggers, indexing, full-text search

**Auth & security:** bcrypt, httpOnly cookies, Helmet, CORS, XSS prevention, role-based access, email verification

**Integrations:** CrossRef API, ORCID, Google OAuth, GitHub OAuth, Resend (transactional email)

**SEO:** metadata API, Open Graph, Twitter Cards, canonical URLs, robots.txt, dynamic XML sitemaps, Schema.org JSON-LD, SSR for crawlable pages

**Community / product:** user profiles, threaded comments, mentions, follows, bookmarks, moderation, reporting, topic feeds, author verification badges

**DevOps:** Git, GitHub Actions, Jest, ESLint, Prettier, Husky, Vercel, Railway, environment-based deployment

---

## Project context for interviews

**What it is:** A free, open platform where researchers discuss published papers after publication — paste a DOI, pull metadata from CrossRef, open a focused thread, and connect with verified authors.

**Who uses it:** Academics, graduate students, and researchers who want post-publication discourse outside paywalled comment systems — a **community of users** discussing real papers with verified author participation via ORCID.

**What you built end to end:** Full-stack web app from database schema and migrations through REST API, auth (4 providers), community features, moderation, SEO, CI, and production deployment on Vercel + Railway.

**Live links:**
- Production: https://postscholar.org
- API: https://postscholar-production.up.railway.app
- Repository: https://github.com/PostScholar/postscholar
