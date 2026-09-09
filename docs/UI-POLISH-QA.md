# EMBER UI polish verification

Date: 2026-09-08

Scope: finish the enterprise frontend polish. No backend integration, real authentication, payment processing, or deployment work is included.

## Completed fixes

- Replaced the clipped mobile navigation strip with an expandable, labelled menu. Added 44px+ controls, active destinations, Escape-to-close with focus return, and outside/focus-away dismissal.
- Preserved EMBER's black, white, cool-gray, and red palette. Introduced readable action red (`#D92D20`, 4.83:1 with white) and red ink (`#BD271B`, 6.05:1 on white), while keeping bright Ember Red for brand accents.
- Corrected shared panel CSS layering so screen-specific background utilities work. Added a dependable keyboard focus outline fallback.
- Reflowed buyer filters, metrics, bid cards, and selected-offer actions across phone/tablet widths. Added search labels and loading/error skip-link targets.
- Kept request-form footer actions inside narrow viewports. Added named 44px step controls, linked field errors, visible file-upload focus, and focus transfer on step changes.
- Separated the demand-map canvas from its selected-cluster details so markers cannot cover the callout. Added mode pressed states and responsive filters.
- Replaced seller overlays with labelled Radix dialogs, including focus trapping, Escape dismissal, responsive scrolling, and safe-area spacing.
- Rebalanced messaging into two columns at tablet/small desktop widths, with deal details available in a dialog. Kept the composer usable on phones with 16px input text and a shrinkable text field.
- Fixed opportunity timeline columns and the invisible white-on-white Save controls on dark surfaces.
- Updated notification offsets for the compact header and preserved the homepage's sticky header by using horizontal clipping rather than a scroll container.

## Verification

| Check | Result |
| --- | --- |
| Storefront ESLint | Pass |
| Storefront TypeScript (`--noEmit --incremental false`) | Pass |
| Optimized Next.js production build, including TypeScript | Pass |
| Production HTTP smoke suite | Pass: 12 pages and 6 API checks |
| Core-page viewport overflow checks | Pass: 320px, 375px, 768px, 1280px, 1920px, and 812×375 landscape |
| Browser console during final production sweep | No captured warnings/errors |
| Mobile navigation | All destinations visible; Escape returns focus to toggle |
| Request form | Steps 1–4 usable at 375px; focus advances; action buttons stay within viewport |
| Seller dialogs | Phone layout checked; keyboard focus stays inside; Escape returns to `/seller` |
| Messaging | Phone conversation and 1024px two-column layout checked; deal dialog works |
| Opportunity timeline | Four-week selection renders four aligned columns |
| Skip link | Moves focus to `#content` |
| Reduced motion | Compiled `prefers-reduced-motion` override verified |

Core pages checked: home, buyer, demand, seller, opportunity detail, messages, new request, public request, authentication, and checkout. Seller bid and test-plan dialogs were additionally checked in the browser.

The HTTP smoke test checks the test-plan route title because Radix portals mount after hydration; dialog content and keyboard behavior were verified separately in the browser.

These are scoped engineering and visual checks, not a formal accessibility certification. A full assistive-technology audit and OS-level large-text/reduced-motion testing were not performed. The application remains demo-backed; production services are separate work.

## Commands

From `apps/storefront`:

```powershell
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/lib/tsc.js --noEmit --incremental false
node node_modules/next/dist/bin/next build
node node_modules/next/dist/bin/next start --port 3001 --hostname 127.0.0.1
```

From the repository root while the production preview is running:

```powershell
$env:EMBER_SMOKE_BASE_URL = 'http://127.0.0.1:3001'
node scripts/storefront-smoke.mjs
```
