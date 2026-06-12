# Contributing to PostScholar

Thank you for your interest in PostScholar. This project is an open academic discussion platform built around published papers, ORCID-verified authorship, and thoughtful discourse.

This guide covers how to set up a local environment, propose changes, and meet the standards we expect before a pull request is merged.

## Before you start

- Read the [README](README.md) for an overview.
- Follow the [Developer Guide](docs/DEVELOPER_GUIDE.md) for local setup, migrations, and deployment.
- Production site: [postscholar.org](https://postscholar.org)
- Repository: [github.com/PostScholar/postscholar](https://github.com/PostScholar/postscholar)

## Ways to contribute

You do not need to write code to help:

- **Report bugs** — open a GitHub issue with steps to reproduce, expected vs actual behavior, and browser/OS if relevant.
- **Suggest improvements** — describe the problem and proposed behavior; UI mockups or screenshots help.
- **Improve documentation** — fixes and clarifications in `docs/` and this file are welcome.
- **Code** — features, bug fixes, tests, and tooling (see below).

## Local development

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm

### Setup (summary)

```bash
git clone https://github.com/PostScholar/postscholar.git
cd postscholar
npm install
cd server && npm install
cd ../client-next && npm install
cd ..

cp server/.env.example server/.env
# Edit server/.env — see server/.env.example

createdb postscholar   # or equivalent
npm run migrate

# client-next/.env.local
# NEXT_PUBLIC_API_URL=http://localhost:3000

npm run dev
```

- Frontend: [http://localhost:3001](http://localhost:3001)
- API: [http://localhost:3000](http://localhost:3000)

Full details: [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md).

## Branch and pull request workflow

The `main` branch is protected. **All changes go through a pull request**; direct pushes to `main` are not allowed.

1. Fork the repository (or create a branch if you are a collaborator).
2. Create a branch from `main` with a short, descriptive name:
   - `fix/login-cookie-on-safari`
   - `add/terms-page`
   - `docs/update-migration-guide`
3. Make your changes and commit.
4. Push and open a PR against `main`.
5. Wait for CI to pass (`server` and `client` jobs).
6. Address review feedback if any.
7. Merge when approved and green.

Dependabot opens its own dependency PRs; maintainers triage those separately.

## Before opening a PR

Run these locally:

```bash
npm test          # server tests (requires local Postgres + migrated test DB)
npm run lint      # ESLint for server and client-next
```

If you changed frontend UI, manually check the affected pages in the browser.

If you added or changed a database schema:

1. Add a new numbered SQL file under `server/db/migrations/` (e.g. `019_description.sql`).
2. Use idempotent SQL where possible (`IF NOT EXISTS`, etc.).
3. Run `npm run migrate` locally and note the migration in your PR description.

**Do not commit** `.env`, secrets, API keys, or credentials.

## Code conventions

Match the existing codebase rather than introducing new patterns.

### General

- Keep changes focused — one logical change per PR when possible.
- Prefer extending existing components, routes, and utilities over duplicating logic.
- Comments only where behavior is non-obvious; code should mostly speak for itself.

### Frontend (`client-next/`)

- Next.js App Router; pages in `src/app/`.
- React components in `src/components/`.
- **CSS Modules** for component styles (`.module.css`).
- API calls through `src/lib/api.js`; browser requests use the `/api` proxy (see `src/lib/config.js`).
- Use `'use client'` only when the component needs client-side state or effects.

### Backend (`server/`)

- Express routes in `server/routes/`.
- Auth via `authenticateToken`; moderator-only routes use `requireModerator`.
- Parameterized SQL only — never interpolate user input into queries.
- Comment bodies are sanitized server-side (`sanitize-html`).
- New routes: register in `server/index.js`.

### Commits

Write clear commit messages in the imperative mood:

```
Fix rate limiting behind Railway proxy.

Add Terms of Service page and footer link.

Update Developer Guide with Resend setup steps.
```

Squashing is optional; the PR title and description should summarize the change for reviewers.

## Pull request description

Include:

- **What** changed (brief summary).
- **Why** (bug, feature, or doc improvement).
- **How to test** — steps a reviewer can follow.
- **Screenshots** for UI changes.
- **Migrations** — filename and whether `migrate:railway` is needed on deploy.

## Testing

Server tests live in `server/tests/`. CI runs them against Postgres 16 with migrations applied.

- `auth.test.js` — registration, login
- `papers.test.js` — paper lookup (CrossRef test runs only when `CI=true`)
- `social.test.js` — follows, mentions, reports

Add or update tests when fixing bugs or adding API behavior. Frontend automated tests are not required yet but are appreciated if they fit the change.

## Community and moderation

PostScholar is intended for good-faith academic discussion:

- Be respectful; disagree on ideas, not people.
- Do not harass users or post spam.
- Report problematic content via the in-app report flow; moderators review reports at `/moderation`.

We reserve the right to decline contributions that undermine community safety or project goals.

## Trusted contributors and project roles

PostScholar is maintained by a small core team. Contributors who make **sustained, high-quality contributions** over time — merged PRs, thoughtful reviews, documentation, bug reports with clear reproduction steps, and respectful participation in issues — may be **considered for expanded access**.

This is always **by invitation**, based on trust and fit with the project. It is not automatic and is not tied to a specific number of PRs.

Expanded roles may include:

- **Repository collaborator** — help triage issues and review pull requests on GitHub.
- **Moderator** (in-app) — access to the moderation queue at `/moderation` to review user reports.
- **Admin** (in-app) — broader operational responsibilities as defined by the maintainers.

If you are interested in a maintainer or moderation role after you have an established contribution history, contact [hello@postscholar.org](mailto:hello@postscholar.org) or reach out to an existing maintainer on GitHub. Final decisions rest with the project owners.

## Security

If you discover a security vulnerability, **do not** open a public issue with exploit details. Email [hello@postscholar.org](mailto:hello@postscholar.org) with a description and steps to reproduce. We will respond as soon as we can.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE) that covers this project.

## Questions

- **Setup / deploy:** [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)
- **Architecture notes:** [docs/DEVELOPER_NOTES.md](docs/DEVELOPER_NOTES.md)
- **Everything else:** open a GitHub issue or discussion on the repository.

Thank you for helping build a better place to discuss published research.
