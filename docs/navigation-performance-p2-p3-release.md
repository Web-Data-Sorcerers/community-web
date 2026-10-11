# Navigation performance P2 & P3 — release record

## Scope and Authorization (11 Oct 2026)

Owner explicitly authorized release: `commit dan push P2 dan P3`.
Combined release package covering:
- **P2 (Public Navigation UX & Explicit Prefetch):**
  - `astro.config.mjs`: `prefetch: { prefetchAll: false, defaultStrategy: 'viewport' }` prevents unclicked speculative HTML requests.
  - `src/components/Navbar.astro`: `:global(html:not(.nav-warm))` isolates 600ms entrance animation to cold boot only; warm transitions do not replay.
  - `src/layouts/BaseLayout.astro`: adds `.navigation-status` pill (16px Manrope, `#ede8ff` on `#050507`, fixed bottom-left offset 24px + safe area). **Top loading progress bar is permanently deleted (0 instances).**
  - `src/scripts/site-visibility-navigation.js`: generational pending navigation tracking, try/catch/finally error handling, automatic cleanup on abort/error/pageshow, 20s watchdog timer, and `nav-warm` class addition during `astro:before-swap`.
- **P3 (Admin Bounded Prewarm):**
  - `src/scripts/admin-shell.js`: sequential prewarming via `MutationObserver` on panels waiting for active panel readiness (`#workspace`, `#login-form`, `#login`), eliminating background request competition during active panel bootstrap.
- **Verification Tooling:**
  - `scripts/verify-navigation-ux.mjs`: 15 interactive Playwright browser cases across 4 viewports (320, 390, 768, 1440), normal/reduced motion, double-click race, 503/abort simulation, watchdog.
  - `scripts/verify-navigation-prefetch.mjs`: asserts 0 speculative controlled HTML requests on viewport/focus/hover/scroll.
  - `scripts/verify-navigation-admin.mjs`: asserts 0 competing background requests during simulated 1800ms active panel load.

## Local QA Freeze PASS

Executed before commit:
- `npm run check`: PASS (0 errors, 0 warnings, 335 files).
- Prettier on modified P2/P3 files: PASS (0 issues).
- `npm run audit:spacing`: PASS (Strict 8-point audit on 40 components).
- `scripts/verify-navigation-package.mjs`: PASS (11 root APIs + 1 SSR = 12 functions, sin1 region in vercel.json).
- `scripts/verify-navigation-ux.mjs`: PASS (15 cases, 0 errors, 0 top progress bar).
- `scripts/verify-navigation-prefetch.mjs`: PASS (0 speculative HTML requests).
- `scripts/verify-navigation-admin.mjs`: PASS (0 competing background requests, 19-68ms warm tab switches).
- `scripts/verify-vt.mjs`: PASS (all 26 assertions pass).
- `scripts/navbar-audit.mjs`: PASS (all 20 widths pass, Figma geometry exact).
- `scripts/seo-audit.mjs`: PASS (24 pages, canonical origin, robots + sitemap OK).
- Regression tests: `tests/site-visibility*.test.mjs` (10 PASS), `tests/cms*.test.mjs` (98 PASS / 10 SKIP), `tests/recruitment*.test.mjs` (42 PASS).
- Secret audit: 0 findings in `src/`.

Rollback target for P2/P3: Accepted P1 sin1 deployment `dpl_7bredDjDLDsY18nxTqGHymQgsVnS` (commit `45cc86466b573fa067f0c98281e391afff502e75`).
