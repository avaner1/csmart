# CSMart

Internal CSM (Customer Success Manager) hub for Spotify Americas. Consolidates Slack, admin announcements, and sales alignment data into a single dashboard.

## Features

- **Dashboard** — Personalized home with book-of-business updates, weekly priorities, hot topics, Slack activity, and saved items
- **Timeline** — This Week view, New Releases & Deprecations, and a full 90-day timeline with category filters
- **Daily Digest** — Morning briefing with personalized Slack updates, today's priorities checklist, hot topics, and team announcements
- **Saved for Later** — Bookmark Slack messages with full-text persistence beyond Slack retention. Tag, note, search, and filter.
- **Admin** — Content management for announcements, deadlines, trainings, releases, and deprecations
- **Sales Alignment** — Auto-matches CSMs to their book of business on login using the sales alignment spreadsheet
- **Slack Integration** — OAuth with PKCE, channel browsing, message search, hot topic detection, and starred items

## Tech Stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS (Spotify brand design system)
- Clerk (authentication via Google Workspace)
- Prisma v7 + PostgreSQL (local or Neon for production)
- Slack OAuth v2 with PKCE

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 16 (`brew install postgresql@16 && brew services start postgresql@16`)

### 1. Clone and install

```bash
git clone https://github.com/avaner1/csmart.git
cd csmart
npm install
```

### 2. Create the database

```bash
createdb csmart
```

### 3. Configure environment

Create `.env.local`:

```env
# Clerk (https://clerk.com -> your app -> API Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/setup

# Slack (https://api.slack.com/apps -> your app -> Basic Information)
SLACK_CLIENT_ID=your-client-id
SLACK_CLIENT_SECRET=your-client-secret
SLACK_REDIRECT_URI=http://localhost:3000/api/slack/callback

# Database
DATABASE_URL=postgresql://your-username@localhost:5432/csmart
```

Also create `.env` with just the DATABASE_URL (used by Prisma CLI).

### 4. Run migrations and seed

```bash
npx prisma migrate dev
node prisma/seed.mjs
```

This populates:
- 109 sales alignment rows (CSM-to-seller mappings)
- 15 sample admin items (deadlines, trainings, releases, etc.)
- 3 sample saved items

### 5. Make yourself admin

```bash
node -e "
const pg = require('pg');
require('dotenv').config();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
pool.query('UPDATE \"User\" SET \"isAdmin\" = true WHERE LOWER(email) = LOWER(\$1)', ['your-email@spotify.com'])
  .then(() => { console.log('Done'); pool.end(); });
"
```

Or use the admin page's "Grant Admin Access" section if another admin is available.

### 6. Run locally

```bash
npm run dev
```

Open http://localhost:3000.

### Slack App Setup

1. Create app at https://api.slack.com/apps
2. Under **OAuth & Permissions**, add redirect URL: `http://localhost:3000/api/slack/callback`
3. No bot scopes needed — user scopes are requested at OAuth time
4. Copy Client ID and Client Secret to `.env.local`

### Clerk Setup

1. Create app at https://clerk.com
2. Enable Google as a sign-in provider
3. Copy Publishable Key and Secret Key to `.env.local`

## Adding Gmail/Calendar Later

The database and UI are pre-wired for Gmail and Calendar integration:

1. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env.local`
2. Create OAuth routes at `/api/google/connect` and `/api/google/callback`
3. Update `googleConnected` on the User model
4. The setup page, settings page, and digest already have placeholder cards

## Deployment

Deployed on Vercel with Neon PostgreSQL:

```bash
vercel --prod
```

Set all env vars in Vercel project settings. Run migrations against production DB:

```bash
DATABASE_URL="your-neon-url" npx prisma migrate deploy
DATABASE_URL="your-neon-url" node prisma/seed.mjs
```

## Folder Structure

```
src/
  app/
    (app)/              # Authenticated routes (with sidebar)
      admin/            # Admin content management
      dashboard/        # Home dashboard
      digest/           # Daily digest
      saved/            # Saved for later
      settings/         # User settings & connections
      timeline/         # Timeline view
    api/
      admin/            # Admin CRUD + grant admin
      book/             # Book of business data
      saved/            # Saved items CRUD
      slack/            # Slack OAuth + data routes
      sync-user/        # User sync on login
      timeline/         # Timeline data
      user/             # Current user data
    setup/              # First-time setup flow
    sign-in/            # Clerk sign-in
    sign-up/            # Clerk sign-up
  components/
    book-of-business.tsx
    connection-cards.tsx
    hot-topic-card.tsx
    saved-item-card.tsx
    setup-guard.tsx
    sidebar.tsx
    slack-message-card.tsx
  lib/
    match-book.ts       # Auto-match CSM to sales alignment
    prisma.ts           # Prisma client singleton
    slack.ts            # Slack API client with caching
    sync-user.ts        # Clerk -> DB user sync + auto-match
    time.ts             # Relative time formatting
    use-saved-items.ts  # Bookmark state hook
  middleware.ts         # Clerk auth middleware

prisma/
  schema.prisma         # Database schema
  migrations/           # SQL migrations
  seed.mjs              # Seed script
```
