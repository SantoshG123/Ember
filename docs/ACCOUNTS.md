# EMBER accounts and sessions

Real account registration, sign-in, and sign-out are implemented for the local Medusa-backed application. Email verification, password recovery, and magic links are **not yet connected**. This is not a production authentication launch.

## Local setup

1. Follow the database setup in the README and apply `pnpm backend:db:migrate`. The account migration preserves marketplace data, adds session storage, and replaces the single-customer role index with a unique customer/role pair.
2. Select `EMBER_DATA_MODE=medusa` in the storefront. Leave `EMBER_AUTH_MODE=accounts` in both apps, or omit it for the same default. Ensure backend JWT/cookie secrets are private random values. Production startup rejects missing or placeholder signing secrets.
3. Start both loopback development servers and open `/auth`. Register with a display name, email, a 12–128 character password, and buyer, seller, or both roles. Registration does not verify ownership of the email address yet; use this only in the isolated development environment.
4. Use Sign out in the desktop header or mobile navigation to revoke the session. Signing in and out clears client query data and performs a full navigation to discard the previous account's router/component state.

The previous local fixture bridge is now opt-in: it requires `EMBER_AUTH_MODE=local`, `EMBER_LOCAL_DATA_ACCESS=true`, and matching server-only local keys in both apps, on loopback and outside production. The Windows database helper's existing data-access flag does not by itself activate impersonation. Restart the apps after changing environment settings.

## Account page and session controls

Open `/account` or choose **Account** in the desktop header or mobile navigation. Email and roles are read-only; **Edit public profile** changes your marketplace display name and optional seller details. Active sessions show their creation/expiry times and a **Current** badge; these are sign-in sessions, not a device inventory. No device names, locations, IP addresses, tokens, or token hashes are returned in this list.

- Sessions are paginated in groups of 20. The list refreshes on focus and every 30 seconds while the page is visible.
- **End session** targets one other session; **End other sessions** ends all other active EMBER browser sessions after confirmation. The current session stays signed in. Use **Sign out** to end the current session.
- Both API layers require the opaque session cookie/header and derive ownership server-side. There is no fixture/bearer fallback for session management. Cross-origin mutations, ambiguous inputs, and another customer's session IDs are rejected.
- A short per-customer transaction serializes revocations and rechecks the requesting session after waiting. A single indexed, customer-scoped delete handles bulk sign-out without loading an unbounded list. No schema migration is needed beyond the existing account migration.
- Ending a session blocks subsequent protected requests. It cannot erase information already rendered on another device, change a password, or revoke separately issued Medusa bearer tokens. Browser storefront clients never receive those bearer tokens. Expired-session housekeeping remains separate work.

The confirmation dialog provides cancel/error/pending states and returns focus to the session heading. Demo mode explains that real accounts are required instead of simulating session deletion.

## Security model

### Public profiles

- All accounts can edit a 2–80 character display name. Seller and dual-role accounts can also edit a 600-character introduction, 120-character service area, and up to 8 unique capabilities (40 characters each).
- Seller introductions appear in the buyer workspace's full-proposal dialog and are explicitly labeled self-described, not verified. This does not enable geographic matching, identity verification, or business approval.
- Both API layers allowlist editable fields with strict Zod schemas. Customers cannot change email, roles, IDs, ratings, reviews, or verification flags. A short customer-scoped transaction updates both participant names/initials together and merges only permitted seller fields. No schema migration is needed.
- Public display names are separate from Medusa's commerce customer name. Signing in preserves the edited marketplace profile; the commerce/customer record is not rewritten.
- Each save requires a customer-bound content revision. Stale or competing edits return HTTP 409, including an old-account draft after a cookie/account switch. Revisions are not authentication credentials. Reloading explicitly replaces the draft; background refetches do not overwrite it.
- The form includes labeled inputs, inline errors, pending/success feedback, dirty-dialog confirmation, and a browser reload/close warning. Saved changes invalidate account and marketplace query data in the current tab. Cross-tab cache clearing and complete browser/back-navigation coverage remain separate QA work.
- Profile routes require real opaque sessions, return private/no-store responses, reject cross-origin writes, and have an 8 KB body bound. Seller metadata outside the editable allowlist stays server-controlled.

### Authentication

- The server-side Next.js bridge uses [Medusa's authentication routes](https://docs.medusajs.com/resources/commerce-modules/auth/authentication-route) and customer-account workflow. Password verification stays with Medusa's email/password provider; the browser never receives its bearer token.
- A verified Medusa identity is provisioned into an EMBER account. Buyer and seller participants are separate, server-owned records under the same customer. A dual-role account receives both. Sign-in inputs and URL roles cannot grant new permissions or replace existing roles.
- Account provisioning uses a short PostgreSQL transaction and a per-customer advisory lock. A unique customer/role index protects against duplicate role records. Dual-role customers cannot bid on their own requests.
- Browser sessions use 256-bit random opaque tokens in HttpOnly, SameSite=Lax cookies, with a 24-hour absolute expiry. Production uses a Secure, host-only `__Host-ember-session` cookie; HTTP development uses `ember-session`.
- Only a SHA-256 digest of each token is stored in PostgreSQL. Each protected request verifies the session, customer, and selected marketplace role. Sign-out deletes the corresponding server session; expired/revoked cookies cannot authenticate. Invalid credentials never fall back to fixture identities.
- Account responses are private/no-store. Mutation origin checks protect login/logout as well as marketplace writes. Cookie credentials are forwarded server-side for server-rendered data and never serialized into page props.
- Medusa email/password routes enforce input size/password bounds, normalize email casing, and have bounded in-memory attempt limits. These limits are single-process development protection, not a replacement for a shared Redis/edge limiter in production.

## Verification performed — September 10, 2026

The HTTP suite created isolated buyer, second-buyer, seller, and dual-role accounts. It verified registration, cookie flags, account retrieval, role isolation, request/proposal ownership, messaging, self-bid rejection, wrong-password rejection, cross-origin login/logout rejection, fresh sessions, logout replay rejection, email normalization, immutable sign-in roles, and HTTP 429 attempt limiting. An authenticated request page also rendered its real data without embedding credentials.

All four session identities and a matched request survived restarting both Medusa and the isolated PostgreSQL database. A service-level test verified token hashing at rest and rejection of expired sessions. QA passwords/cookies stay in test-process memory and are never written to artifacts; QA accounts and clearly labeled marketplace records remain in the local database. The suite revokes its sessions at the end.

```bash
pnpm test:unit
node scripts/account-integration.test.mjs --confirm-local-medusa
pnpm --filter @ember/backend exec medusa exec ./src/scripts/verify-account-sessions.ts
pnpm --filter @ember/backend exec medusa exec ./src/scripts/verify-session-controls.ts
pnpm --filter @ember/backend exec medusa exec ./src/scripts/verify-account-profile.ts
```

Run from the repository root with both local servers running in account mode. The write tests refuse any database other than `127.0.0.1:55432/ember`. To repeat restart verification, add `--restart` to the integration command; when it prints `RESTART READY`, stop the backend, optionally restart the isolated database using its helper, and start the backend within three minutes. Credentials remain only in the waiting test process.

Frontend/backend type checks, frontend lint, and both builds are checked separately. Interactive browser, mobile, cross-tab, and back-navigation QA still need to be run; HTTP/SSR tests do not replace those checks. The available test runtime was Node.js 25.6; supported Node.js 24 CI remains outstanding.

Checkpoint follow-up — September 13, 2026: the production storefront also passed the demo HTTP smoke suite (12 route shells and 6 API scenarios) on a separate loopback port. The suite now refuses persistent mode before making any test writes. Seller workspace content loads after hydration, so its HTTP checks assert route titles rather than pretending to test the interactive dashboard.

Session-controls checkpoint — September 14, 2026: the extended HTTP suite passed private listing, strict input/origin checks, cross-account isolation, individual/bulk revocation, cookie replay rejection, current-session preservation, and idempotent repeated bulk requests. Nine unit tests passed. Service-level tests exercised more than one page of sessions, expiry filtering, minimal response fields, overlapping bulk requests, and competing sessions rechecking authorization after a lock wait. That service script creates and removes only its own synthetic module-level QA participants/sessions.

The signed-out `/account` screen and mobile menu were browser-checked at 375×812 and 812×375 with no horizontal overflow. Authenticated account controls, dialog keyboard/focus behavior, cross-tab behavior, and the signed-in responsive layout still need an interactive browser pass; their API behavior was tested separately. No QA passwords or session tokens were printed or committed. Both application builds, type checks, and frontend lint passed for this checkpoint.

## Profile checkpoint — September 15, 2026

Eleven unit tests passed, including equivalent schema acceptance/rejection at both API boundaries. The expanded account HTTP suite passed buyer/seller/dual-role edits, persistence, immutable identity fields, cross-origin rejection, stale/concurrent saves, role synchronization, updated proposal/conversation names, sign-in preservation, and revoked-cookie rejection. Service tests additionally verified atomic dual-role updates, preserved ratings/reviews/verification/internal metadata, identical profiles with different customer-bound revisions, Unicode-safe initials, and expired/revoked sessions. Synthetic service fixtures are removed in `finally`; HTTP QA accounts/marketplace fixtures remain local with sessions revoked.

Both application builds, frontend/backend type checks, and frontend lint passed. A separate production demo server passed 13 route checks and 6 API smoke scenarios; profile reads/writes correctly return unavailable in demo mode. Interactive testing of the new editor (keyboard/focus, discard/conflict recovery, small-phone/landscape layouts, reduced motion, large text, and authenticated cross-tab/back navigation) has **not** been completed. The available Node runtime lacks Playwright; HTTP and source checks are not substitutes for browser testing. Supported Node.js 24 CI remains outstanding.

## Remaining account and launch work

- Choose/configure an email provider, implement verified-email and single-use password-reset flows, and revoke all sessions when credentials change. The UI/API currently report email actions as unavailable instead of claiming delivery.
- Finish account lifecycle (email changes, account deletion, MFA policy), seller verification/onboarding, and interactive profile/session QA. Current roles are selected at signup; self-service role changes are not exposed. Basic public profile editing is implemented; profile photos and attachment storage are not.
- Add distributed rate limits, expired-session cleanup, abuse monitoring, secure deployment configuration, and end-to-end browser coverage before opening registration publicly.
- Payments and fulfillment remain separate work. Account registration and proposal acceptance never charge a card.
