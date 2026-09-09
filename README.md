# EMBER

*Where demand sparks opportunity.*

EMBER is a demand-first local marketplace: buyers describe what they need, sellers respond with proposals, and shared demand helps uncover new business opportunities. Its interface pairs monochrome surfaces and typography with a focused ember-red accent.

## Project status

This is an actively developed application, **not a production-ready marketplace**.

- **Frontend:** responsive discovery, demand browsing, request creation, buyer and seller workspaces, proposal comparison, messaging, and opportunity planning screens.
- **Demo mode:** runs without a backend using sample data and in-process adapters. Demo data is not a durable database; authentication and checkout screens simulate their workflows.
- **Persistent mode — in progress:** Medusa models, protected APIs, frontend adapters, and database-backed UI bindings are implemented. Migration generation/application, seeding, live integration testing, and restart-persistence verification still need to be completed.
- **Still to build and verify:** real account onboarding and email, payment lifecycle integration, attachment storage, production operations, and deployment.

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
| `/auth`, `/checkout` | Authentication and checkout prototypes |

## Persistent development setup

The persistent path is being integrated. The following are development setup steps, not a claim that a complete transaction flow has been verified.

1. Provide a development PostgreSQL database. See the [isolated Windows database guide](docs/LOCAL-DATABASE.md) for PostgreSQL 18 on `127.0.0.1:55432`, outside OneDrive. Alternatively, `compose.yaml` supplies PostgreSQL 17 and Redis 7 on loopback ports 5432 and 6379. Copy `.env.compose.template` to the ignored `.env.compose`, set a unique `POSTGRES_PASSWORD`, check port availability, then run `docker compose --env-file .env.compose up -d`. Match that password in the backend database URL; URL-encode reserved characters. Do not expose development services publicly.
2. Create `apps/backend/.env` from `apps/backend/.env.template`, preserving any existing configuration. Set `DATABASE_URL`, replace JWT/cookie placeholders with independent random secrets, and set CORS origins for your local applications. Only set `REDIS_URL` when Redis is running; otherwise omit it for single-process development.
3. Generate and review the marketplace migration, then apply it to **your development database**:

   ```bash
   pnpm backend:db:generate
   pnpm backend:db:migrate
   ```

4. For local test identities, set `EMBER_LOCAL_DATA_ACCESS=true` and the same randomly generated, server-only `EMBER_LOCAL_API_KEY` (at least 32 characters) in both application env files. The Windows helper's `-ConfigureApps` option can create this configuration. Never put this key in a `NEXT_PUBLIC_*` variable.
5. Seed explicit development fixtures and start the backend:

   ```bash
   pnpm --filter @ember/backend seed:marketplace
   pnpm backend:dev
   ```

6. Set `EMBER_DATA_MODE=medusa` and `MEDUSA_BACKEND_URL=http://127.0.0.1:9000` in `apps/storefront/.env.local`, then restart the storefront. `DISABLE_MEDUSA_ADMIN=true` in the backend environment selects a headless local run.

The fixture seed is local-only and preserves existing records. Seeded opportunity briefs are examples, not measured live demand. The local buyer/seller bridge is restricted to development and loopback access; it is **not real sign-in**. Keep these servers local. Real customer identities must be provisioned and authenticated before shared use.

Persistent-mode failures display an error instead of silently substituting demo fixtures. The backend health endpoint is [localhost:9000/health](http://localhost:9000/health).

## Development checks

```bash
pnpm typecheck
pnpm lint
pnpm build
node --test scripts/marketplace-transport.test.mjs
```

Additional checks:

```bash
pnpm backend:build
pnpm test:smoke
```

The storefront smoke script targets the **demo** storefront at `http://127.0.0.1:3000`. Set `EMBER_SMOKE_BASE_URL` to use a different local address. It exercises prototype mutations; do not aim it at production or a shared database.

At the repository's initial upload, frontend TypeScript, frontend ESLint, backend TypeScript, and all four transport-policy tests passed. These checks do not replace database integration or browser testing. Earlier UI verification is recorded in [UI-POLISH-QA.md](docs/UI-POLISH-QA.md).

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
- Keep `.env` files, private keys, database files, logs, and build output out of Git. Commit only sanitized environment templates.
- `.gitignore` does not prevent cloud-sync software from copying secrets. Store database files and sensitive credentials outside synced folders when possible.
- Never enable local test identity access on a public deployment. Complete real authorization, onboarding, and account lifecycle tests first.
- Complete Stripe checkout and webhook integration before accepting payments; accepting a proposal currently does not prove a payment occurred.
- Add managed PostgreSQL/Redis, backups, observability, rate limiting, secure deployment settings, and end-to-end tests before launch.
