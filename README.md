# EMBER

*Where demand sparks opportunity.*

EMBER is a demand-first local marketplace: buyers describe what they need, sellers respond with proposals, and shared demand helps uncover new business opportunities. Its interface pairs monochrome surfaces and typography with a focused ember-red accent.

## Project status

This is an actively developed application, **not a production-ready marketplace**.

- **Frontend:** responsive discovery, demand browsing, request creation, buyer and seller workspaces, proposal comparison, messaging, and opportunity planning screens.
- **Demo mode:** runs without a backend using sample data and in-process adapters. Demo data is not a durable database; authentication and checkout screens simulate their workflows.
- **Persistent local mode — verified:** Medusa/PostgreSQL requests, proposals, buyer/seller workspaces, messaging/read state, bookmarks, and offer drafts are connected. Local integration tests cover authorization failures, concurrent acceptance, backend outages, seed idempotence, and persistence across backend and database restarts. Earlier fixture tests are complemented by the real-account tests below.
- **Accounts — local implementation verified:** real Medusa registration/sign-in, buyer/seller/both roles, and revocable database sessions are connected. The `/account` page supports public profile editing and individual/bulk session sign-out. Seller introductions appear with full proposals. See [account setup and QA](docs/ACCOUNTS.md) for tested scope and remaining browser checks. Email verification and password recovery still need a configured provider.
- **Still to build and verify:** email flows, seller verification/onboarding, payment lifecycle integration, attachment storage, authenticated browser QA, production operations, and deployment.

## Stack

| Layer | Technology |
| --- | --- |
| Web application | Next.js 16 App Router, React 19, TypeScript |
| UI | Tailwind CSS 4, owned shadcn-style components, Radix primitives, Lucide icons |
| Client data | TanStack Query, Medusa JavaScript SDK configuration |
| Marketplace API | Medusa v2.20.1 with a custom `emberMarketplace` module |
| Persistence | PostgreSQL; optional Redis-backed Medusa infrastructure |
| Payments | Conditional Medusa Stripe provider configuration; live checkout integration pending |
| Design sources | Google Stitch HTML, screenshots, and design-system documentation |

## Quick start: demo storefront

Use Node.js **24.x** and **pnpm 11.19.0** (the version pinned in `package.json`).

```bash
git clone https://github.com/SantoshG123/Ember.git
cd Ember
pnpm install
pnpm dev
```

Open [localhost:3000](http://localhost:3000). With no data-mode environment variable, the storefront defaults to demo mode. No database or payment credentials are needed.

For optional local configuration, copy `.env.template` to `apps/storefront/.env.local` **only if that file does not already exist**. Next.js reads the storefront's environment file, not the repository-root template. Do not replace an existing local configuration without reviewing it.

### Main routes

| Route | Purpose |
| --- | --- |
| `/` | Marketplace discovery |
| `/demand` | Demand overview and request browsing |
| `/requests/new` | Publish a buyer request |
| `/requests/[id]` | Request details and persistent-mode seller proposals |
| `/buyer` | Buyer requests, bids, and decisions |
| `/seller` | Seller proposals, saved opportunities, and offer drafts |
| `/seller/bids/[id]` | Seller proposal details |
| `/messages` | Buyer conversations; `?role=seller` selects the local seller view |
| `/opportunities/east-austin-team-lunch` | Example opportunity brief and planning tools |
| `/auth` | Real registration/sign-in in Medusa mode; simulated in demo mode |
| `/account` | Public profile editing and active-session management |
| `/checkout` | Checkout prototype; does not charge a card |

## Persistent development setup

The local persistence and account flows are verified; email, payments, and production operations remain unfinished. See [persistence QA](docs/PERSISTENCE-QA.md) and [account QA](docs/ACCOUNTS.md) for the tested scope and limitations.

1. Provide a development PostgreSQL database. See the [isolated Windows database guide](docs/LOCAL-DATABASE.md) for PostgreSQL 18 on `127.0.0.1:55432`, outside OneDrive. Alternatively, `compose.yaml` supplies PostgreSQL 17 and Redis 7 on loopback ports 5432 and 6379. Copy `.env.compose.template` to the ignored `.env.compose`, set a unique `POSTGRES_PASSWORD`, check port availability, then run `docker compose --env-file .env.compose up -d`. Match that password in the backend database URL; URL-encode reserved characters. Do not expose development services publicly.
2. Create `apps/backend/.env` from `apps/backend/.env.template`, preserving any existing configuration. Set `DATABASE_URL`, replace JWT/cookie placeholders with independent random secrets, and set CORS origins for your local applications. Only set `REDIS_URL` when Redis is running; otherwise omit it for single-process development.
3. Review the committed marketplace migration, then apply the migrations to **your development database**:

   ```bash
   pnpm backend:db:migrate
   ```

4. Leave `EMBER_AUTH_MODE=accounts` (the default) for real registration and login. Optional fixture impersonation requires `EMBER_AUTH_MODE=local`, `EMBER_LOCAL_DATA_ACCESS=true`, and the same randomly generated, server-only `EMBER_LOCAL_API_KEY` (at least 32 characters) in both app env files. Never put this key in a `NEXT_PUBLIC_*` variable. The Windows helper creates the local data configuration but does not select fixture impersonation automatically.
5. Start the backend. Optionally seed sample data first, with `EMBER_LOCAL_DATA_ACCESS=true` explicitly enabled in the local backend environment:

   ```bash
   pnpm --filter @ember/backend seed:marketplace
   pnpm backend:dev
   ```

6. Set `EMBER_DATA_MODE=medusa` and `MEDUSA_BACKEND_URL=http://127.0.0.1:9000` in `apps/storefront/.env.local`, then restart the storefront. `DISABLE_MEDUSA_ADMIN=true` in the backend environment selects a headless local run.

Generate a new migration with `pnpm backend:db:generate` only when changing the models; review the generated SQL before applying it. Do not regenerate the initial migration on every setup.

The fixture seed is local-only and preserves existing records. Seeded opportunity briefs are examples, not measured live demand. Both development server commands bind to `127.0.0.1`. In account mode, open `/auth` to register; each account starts with its own workspace. The optional local buyer/seller bridge is **not real sign-in**. Keep this development environment local; email ownership verification and deployment hardening are still required before shared use.

Persistent-mode failures display an error instead of silently substituting demo fixtures. The backend health endpoint is [localhost:9000/health](http://localhost:9000/health).

## Development checks

```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm test:unit
```

Additional checks:

```bash
pnpm backend:build
pnpm test:smoke
```

The storefront smoke script targets the **demo** storefront at `http://127.0.0.1:3000`. Set `EMBER_SMOKE_BASE_URL` to use a different local address. It exercises prototype mutations; do not aim it at production or a shared database.

The profile checkpoint passed frontend/backend TypeScript, frontend ESLint, both builds (Medusa headless), 11 unit tests, and account/profile HTTP and database integration tests. See [account QA](docs/ACCOUNTS.md) for exact scope and remaining interactive checks. Earlier database restart checks are recorded in [PERSISTENCE-QA.md](docs/PERSISTENCE-QA.md); visual checks are recorded in [UI-POLISH-QA.md](docs/UI-POLISH-QA.md).

## Repository layout

```text
apps/
  storefront/       Next.js application, API bridge, and UI components
  backend/          Medusa module, protected routes, and development seed
docs/               Setup instructions and QA notes
scripts/            Database helper, smoke checks, and transport tests
.stitch/            Design system, reference screens, and iteration notes
compose.yaml        Optional local PostgreSQL and Redis services
```

The registered backend module is `src/modules/marketplace`; older `request`, `bid`, and `opportunity` scaffolds remain in the source but are not registered by the current configuration. Legacy `/store/marketplace` endpoints are retired in favor of protected `/marketplace` endpoints.

## Security and release checklist

- Before committing, stage the intended changes, review `git diff --cached`, and run `node scripts/check-staged-secrets.mjs`. This checks staged blobs for blocked paths, recognized credential patterns, and matches against private local environment values. It is a safety net, not a complete security audit.
- Before staging, `node scripts/check-staged-secrets.mjs --worktree` also checks tracked and non-ignored new working files without changing Git's index.
- Keep `.env` files, private keys, database files, logs, and build output out of Git. Commit only sanitized environment templates.
- `.gitignore` does not prevent cloud-sync software from copying secrets. Store database files and sensitive credentials outside synced folders when possible.
- Never enable local test identity access on a public deployment. Complete real authorization, onboarding, and account lifecycle tests first.
- Complete Stripe checkout and webhook integration before accepting payments; accepting a proposal currently does not prove a payment occurred.
- Add managed PostgreSQL/Redis, backups, observability, rate limiting, secure deployment settings, and end-to-end tests before launch.
