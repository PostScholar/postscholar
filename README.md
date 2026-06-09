# PostScholar

PostScholar is an academic discussion platform where researchers can discuss research papers, verify authorship via ORCID, and engage in meaningful academic discourse.

## Features

- **Paper discussions** with DOI lookup via CrossRef
- **ORCID verification** for author badges
- **Threaded comments** with search and sorting
- **Bookmarks** for saving discussions
- **User profiles** with academic credentials
- **Following system** for academic networking
- **Moderation tools** for community health
- **View tracking** and discussion metrics

## Tech Stack

- **Frontend**: Next.js 16, React 19
- **Backend**: Express 5, Node.js
- **Database**: PostgreSQL
- **Auth**: JWT with httpOnly cookies
- **Deployment**: Vercel (frontend) + Railway (backend)

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/ummaraali2/postscholar.git
cd postscholar

# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client-next
npm install
cd ..
```

### Configuration

Create `.env` files:

**server/.env**:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/postscholar
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:3001
ORCID_CLIENT_ID=your-orcid-client-id
ORCID_CLIENT_SECRET=your-orcid-client-secret
ORCID_REDIRECT_URI=http://localhost:3000/auth/orcid/callback
PORT=3000
```

**client-next/.env.local**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Database Setup

```bash
# Run migrations
npm run migrate
```

### Running the Application

```bash
# Run both frontend and backend
npm run dev

# Or run separately:
npm run dev:client  # Frontend on http://localhost:3001
npm run dev:server  # Backend on http://localhost:3000
```

## Project Structure

```
postscholar/
├── client-next/          # Next.js frontend
│   ├── src/
│   │   ├── app/          # App Router pages
│   │   ├── components/   # React components
│   │   └── lib/          # API client, utilities
│   └── package.json
├── server/               # Express backend
│   ├── db/               # Database migrations
│   ├── routes/           # API routes
│   ├── middleware/       # Auth middleware
│   └── package.json
├── docs/                 # Documentation
└── package.json          # Root scripts
```

## Documentation

- [Developer Guide](docs/DEVELOPER_GUIDE.md) - Setup, deployment, and common tasks
- [Developer Notes](docs/DEVELOPER_NOTES.md) - Technical details and architecture
- [Implementation Plan](IMPLEMENTATION_PLAN.md) - Current development roadmap
- [Roadmap](ROADMAP_UPDATED.md) - Feature roadmap

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

## Links

- **Production**: https://postscholar.org
- **API**: https://postscholar-production.up.railway.app
- **Repository**: https://github.com/ummaraali2/postscholar
