# EMBER Medusa Backend

This directory contains EMBER's Medusa v2.20.1 backend. Persistent integration is in progress; migrations and live persistence tests have not yet been completed. See the [root README](../../README.md) for current status and full setup instructions.

The registered custom module is `emberMarketplace` (`src/modules/marketplace`), containing participants, buyer requests, seller bids, transactional bid decisions, conversations, messages, read state, opportunity briefs, bookmarks, and offer drafts.

Older standalone modules remain as unregistered scaffolds. Protected `/marketplace` routes replace retired `/store/marketplace` endpoints. Stripe provider configuration is conditional; live storefront payment integration is still pending.

## Development setup

1. Create `.env` from `.env.template` if no configuration exists. Replace JWT/cookie placeholders and provide your own development `DATABASE_URL`.
2. Use the [isolated Windows PostgreSQL helper](../../docs/LOCAL-DATABASE.md), or the root Compose services after checking port availability. Only set `REDIS_URL` when Redis is running.
3. From the repository root, run `pnpm install`, then generate, review, and apply development migrations using `pnpm backend:db:generate` and `pnpm backend:db:migrate`.
4. For explicit local fixtures, configure the development-only actor bridge as described in the root README, then run `pnpm --filter @ember/backend seed:marketplace`.
5. Run `pnpm backend:dev`. Health is available at [localhost:9000/health](http://localhost:9000/health).

Never expose local test identity access publicly. Never commit database files or credentials. Real customer onboarding and payment lifecycle verification remain required before production.
