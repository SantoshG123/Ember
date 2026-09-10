# Local marketplace persistence QA

Verified September 10, 2026 against the isolated PostgreSQL 18 database at `127.0.0.1:55432/ember`, Medusa at `127.0.0.1:9000`, and the Next.js development storefront at `127.0.0.1:3000`. Local buyer/seller test identities were explicitly enabled. No payment or real service was requested.

## Verified behavior

- Medusa migrations report all modules, including `emberMarketplace`, up to date. The committed initial migration supplies marketplace tables, constraints, foreign-key indexes, and partial uniqueness for proposal acceptance.
- Running the fixture seed again leaves existing buyer, seller, message, and opportunity responses unchanged, including QA decisions and messages.
- A published request appears to sellers; a submitted proposal appears to its buyer. Acceptance marks the request `matched`, not fulfilled or paid.
- Duplicate active proposals and new proposals on a matched request return conflicts. Concurrent acceptance of two proposals produces one success and one HTTP 409; only one proposal remains accepted. Retrying the winning acceptance is idempotent. Decimal prices round-trip correctly (`29.99 × 2 = 59.98`).
- Buyer/seller messages, unread counts, read markers, saved opportunities, and offer drafts persist. Their identifiers and values remain intact after restarting both the API and PostgreSQL.
- Missing/wrong local credentials, unknown local actors, invalid bearer credentials, caller-forged ownership, and cross-origin writes are rejected. Invalid bearer credentials never fall back to a local identity. Service-level checks also reject another buyer accepting, sending to, or marking an unrelated conversation read.
- Sellers see their own proposal details, not competitors' proposals or private buyer references.
- With the backend stopped, five marketplace BFF endpoints return HTTP 503, private/no-store headers, and no demo fixture fields.
- Frontend/backend TypeScript, frontend ESLint, five transport-policy tests, storefront production build, and headless Medusa build pass. Main page responses return HTTP 200; this is an HTTP/SSR check, not interactive browser QA.

The live HTTP tests exposed a Next.js loopback URL normalization issue in the origin guard. It now compares Origin with the actual Host authority, ignores forwarded-host overrides, rejects malformed hosts, and requires loopback authorities for the development actor bridge. Both dev commands bind only to `127.0.0.1`.

## Repeat the checks

Use the isolated database setup in [LOCAL-DATABASE.md](LOCAL-DATABASE.md), apply migrations, seed fixtures, and start both development servers. Run from the repository root unless indicated otherwise. Write phases refuse databases other than the dedicated local database on port 55432.

```bash
node --test scripts/marketplace-transport.test.mjs
node scripts/marketplace-persistence.test.mjs create --confirm-local-medusa
pnpm --filter @ember/backend exec medusa exec ./src/scripts/create-concurrency-fixture.ts
node scripts/marketplace-persistence.test.mjs race --confirm-local-medusa
node scripts/marketplace-persistence.test.mjs verify
```

The create phase leaves uniquely named QA records and writes identifiers only to ignored `.local/qa-persistence.json`. It refuses an existing manifest unless explicitly given `--new-run`; doing so creates another QA set, it does not delete old records. The concurrency fixture performs ownership checks and writes ignored `.local/qa-concurrency.json`. It refuses to overwrite that file; archive it locally before deliberately preparing another race. Run the fixture through the backend package so its working directory is `apps/backend`.

Stop the backend while leaving the storefront running, then run:

```bash
node scripts/marketplace-persistence.test.mjs outage
```

Restart the isolated database using its helper while the backend is stopped, restart the backend, and run `verify` again. The `verify` and `outage` phases are read-only. Do not use the demo smoke script against persistent mode.

## Limits and remaining work

- Real customer registration, account-to-participant provisioning, sessions, email, and account recovery remain unfinished. Role selection in local development is not authentication.
- Stripe checkout, webhooks, refunds, and the actual payment/fulfillment lifecycle are not implemented end to end. Accepting a proposal does not charge anyone.
- Attachments, scalable pagination, multi-process/Redis behavior, production backups, deployment hardening, rate limits, and shared-user browser end-to-end coverage remain future work.
- Opportunity research records are explicitly seeded examples, not live analytics.
- Tests ran on the available Node.js 25.6 runtime. The project recommends Node.js 24; CI on that supported version still needs to be established. Redis was not configured; Medusa's local in-memory infrastructure warnings are expected for this single-process test, not a production recommendation.
- Browser interaction and responsive visual testing were not repeated in this pass. Prior visual QA is documented separately.

QA identifiers, database files, credentials, logs, and build output are excluded from Git. Before each commit, review the staged diff and run `node scripts/check-staged-secrets.mjs`; automated scanning supplements, but does not replace, manual review.
