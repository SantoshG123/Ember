# EMBER Site Vision

## 1. Product

EMBER is a demand-first local marketplace where buyers publish what they need and sellers respond to visible, aggregated opportunity. The brand promise is: **Where demand sparks opportunity.**

## 2. Audience

- Consumers who want local products or services without browsing endless listings.
- Sellers, makers, service providers, and aspiring entrepreneurs who want evidence of demand before investing effort.

## 3. Technical Direction

- **Storefront:** Next.js 16 App Router, React, TypeScript, server rendering, Tailwind CSS.
- **Components:** Shadcn-style owned components built on Radix primitives.
- **Client data:** TanStack Query over the official `@medusajs/js-sdk`.
- **Commerce API:** Medusa v2 as a separate service with custom request, opportunity, and bid modules.
- **Infrastructure:** PostgreSQL, Redis, Stripe through Medusa's official provider.
- **Repository shape:** `apps/storefront` for the Next.js application and `apps/backend` for Medusa.

## 4. Sitemap

- [x] `/` — Home and demand overview
- [x] `/demand` — Austin demand map
- [x] `/requests/[id]` — Request detail and bid action
- [x] `/seller` — Seller workspace
- [x] `/seller/bids/[id]` — Expanded bid state
- [x] `/seller/test-plan` — AI test-plan drawer state
- [x] `/requests/new` — Guided consumer request creation
- [x] `/buyer` — Buyer dashboard and bid comparison
- [x] `/opportunities/[id]` — Aggregated opportunity detail
- [x] `/messages` — Buyer/seller messaging
- [x] `/auth` — Sign-in and onboarding
- [x] `/checkout` — Protected payment authorization and receipt flow

## 5. Roadmap

1. [x] Build and integrate the guided Post a Request flow.
2. [x] Convert the EMBER shell and core screens into reusable Next.js components.
3. [x] Add typed Medusa SDK configuration and TanStack Query providers.
4. [x] Implement buyer dashboard and bid comparison.
5. [x] Scaffold and production-build Medusa custom modules for requests, opportunities, and bids.
6. [x] Add PostgreSQL/Redis configuration, conditional Stripe provider wiring, demo-safe authentication contracts, and HTTP end-to-end smoke coverage.
7. [ ] Supply deployment credentials, run the generated Medusa migrations against the chosen PostgreSQL environment, configure the Stripe webhook, and replace demo auth/email adapters.

## 6. Creative Freedom

- A focused seller setup that captures service area, capabilities, availability, and verification readiness after role-aware account creation.
- A buyer request-editing flow that preserves bid history while making material changes explicit to responding sellers.
- An account security surface for active sessions, password changes, and marketplace notification preferences.

## 7. Stitch Project

- Project ID: `15548818311726621064`
- Active visual direction: EMBER Studio Monochrome
- Accent: Ember Red `#FF3B30`
- Pressed accent: Deep Ember `#D92D20`
- Error: Error Crimson `#A61B16`
- Display type: Poppins
- Interface type: Manrope

## 8. Iteration Log

- `2026-09-04` — Reconciled the implementation against the Stitch screen ledger, expanded the home hero into the full editorial marketplace story, and restored four missing storefront routes: `/demand`, `/seller`, `/seller/bids/[id]`, and `/seller/test-plan`. Added a responsive privacy-safe demand map with cluster and request modes, filters, selected-cluster detail, and local opportunity links. Added a responsive seller command center with bid filtering, saved-request interaction, proposal detail, messaging/funding handoffs, and a focused demand test-plan state. Removed the last decorative multicolor/gradient treatment so the production UI stays black, white, cool gray, and Ember Red. Scaffolded compile-verified Medusa v2.20.1 request, opportunity, and bid modules with DML models and store endpoints; added PostgreSQL and Redis runtime configuration, conditional authorization-first Stripe registration, environment templates, and a 12-page HTTP smoke suite covering six API behavior groups. Verified route generation, TypeScript, lint, storefront production build, backend production build, desktop/mobile layouts, overlay routes, and production-server smoke tests. Docker Compose validates, but local migration execution remains deployment-bound because Docker Desktop is not running and the host's existing PostgreSQL instance uses unrelated credentials.
- `2026-09-04` — Generated Stitch checkout screens `c91a7163e72749a58707c50033d7e352` and `eb11dc908ff9430ba98f5f68b8258b9a`, plus authorization-success screen `bdf1db7c0a524d309f1c48166a8569a0`, then integrated them at `/checkout`. Added saved/new test-card states, formatted fields, consent validation, a testable decline-recovery path, funds-held explanation, local demo-safe authorization API, responsive receipt, downloadable demo receipt, and a direct accepted-proposal handoff from messages. Verified typecheck, lint, production build, desktop layout, consent validation, decline recovery without console errors, successful authorization, mobile disclosure behavior, and 390px/319px layouts without horizontal overflow.
- `2026-09-04` — Generated Stitch authentication screen `d476b3a467bf47f386b5b4cbde7e1ac4` and integrated it at `/auth`. Added sign-in/create-account modes, buyer/seller/both role selection, password visibility, recovery and secure-link paths, trust and legal disclosures, typed React Hook Form + Zod validation, TanStack Query mutations, and a local demo-safe API contract that never logs or persists passwords. Verified typecheck, lint, credential validation, role-aware account success, password visibility, recovery, secure-link success, and desktop plus 390px/319px layouts without horizontal overflow.
- `2026-09-04` — Generated and refined Stitch messaging screen `7b9fe75efecf46aba7e4d6a8f4690ad8`, then integrated it at `/messages`. Added searchable All/Unread conversations, read-state updates, responsive thread navigation, proposal-aware message history, attachment states, optimistic TanStack Query sending, delivery confirmation, protected-payment context, typed local API contracts, and a mobile deal-details dialog. Verified typecheck, lint, production build, desktop filtering/search/thread switching/sending, delivery confirmation, and the 390px mobile list-to-thread flow without horizontal overflow.
- `2026-09-04` — Generated Stitch opportunity screen `3baedcc68c7f468f883cded158067591`, refined it into `cf305ebbc74f4d05a170f793919d3517`, and integrated the result at `/opportunities/east-austin-team-lunch`. Added a verified demand-cluster hero, explainable metrics, selectable demand ranges and neighborhoods, anonymized buyer evidence, methodology disclosure, readiness checklist, save state, and a functional offer-draft dialog backed by typed TanStack Query adapters and a local API contract. Verified typecheck, lint, production build, desktop interactions, offer creation, and a 390px mobile layout without horizontal page overflow.
- `2026-09-04` — Generated Stitch screen `e4130761e484453cbfd28bfbe14fd2ad`, refined it into `3f85b22df0944497a864a649197de075`, and integrated the result at `/buyer`. Added request search and status filters, request switching, explainable bid comparison, proposal and acceptance dialogs, seller-message feedback, typed TanStack Query adapters, a local buyer API contract, and linked public request views. Verified typecheck, lint, production build, desktop interactions, accepted-bid state, the no-bid state, and a 390px mobile layout without horizontal page overflow.
- `2026-09-04` — Generated Stitch screen `773d0be6f9ff4cf0af311f0e490a0d0b` for `/requests/new`; integrated it as a responsive, four-step React Hook Form flow with Zod validation, draft persistence, TanStack Query publishing, and a local API adapter. Verified typecheck, lint, production build, field validation, keyboard navigation, and successful publish state.
