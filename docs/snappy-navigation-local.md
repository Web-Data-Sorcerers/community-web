# Snappy navigation — local implementation, 12 October 2026

Owner authorized local execution with “gassss” after reviewing the detailed plan.
Initial production baseline: `6811a50`. Owner subsequently authorized
“coba commit dan deploy”, including the main push needed for the connected Vercel
deployment. Scope is the tested navigation changes and their documentation.
Production saves and provider configuration changes remain outside scope.
Existing unrelated dirty documentation is preserved. Release acceptance pending.

## Implementation

- BaseLayout uses an explicit 80ms Astro fade in both directions and `swap`
  fallback. ClientRouter, its route announcer, history and sound context remain.
- Shared Button, Contact Submit and Recruitment step/submit actions receive
  immediate pressed opacity and scale. Reduced motion uses opacity only.
- One bundled delegated pointerdown listener paints touch feedback before the
  browser decides whether to apply `:active`. It does not prevent default or
  delay navigation/submission. Release, cancellation, scroll, before-swap,
  window blur and pageshow clear the marker. Disabled/busy controls are ignored.
- Global implicit HTML prefetch and Navbar HTML prefetch are disabled after
  measuring duplicate HTML requests. No layout/font/artwork/spacing tokens change.
- Visibility middleware, server loader, revision checks, Auth and save transport
  are unchanged. No stale visibility cache is introduced.

## Prefetch experiment

Generated Node 22 SSR harness on loopback, Chromium with HTTP caching enabled,
390px touch and 1440px desktop, normal and reduced motion. The dedicated verifier
observes requests without Playwright routing, which would disable HTTP caching.
The page/menu is given 1200ms to finish speculative work before activation.

Baseline hover produced a speculative `/partners` HTML request on desktop and
another HTML fetch on click; mobile had no speculative request before tap.
The viewport candidate produced speculative `/partners` requests in all four
conditions, followed by another HTML fetch on click in all four. Public HTML
retains `no-store`. Therefore viewport HTML prefetch was rejected: it adds
server/RPC traffic without removing the navigation fetch in this environment.
Final candidate has zero speculative controlled HTML requests and one
`/partners` navigation fetch in each condition.

This is Chromium evidence, not a claim about every browser. A document cache or
SWR visibility cache would need a separate freshness design. A singleton TTL of
10–15 seconds cannot guarantee a confirmed save is reflected by the next fresh
request on every serverless instance; the existing contract/tests prohibit it.

## Verification

- Node 22.23.3 check/build: 0 errors, 0 warnings.
- Visibility tests: 10 pass; recruitment tests: 42 pass.
- Strict spacing: 40 components pass; Navbar: 20 widths pass.
- SEO: 24 pages pass using the generated SSR harness.
- Navigation UX: 15 cases pass, including delayed/superseded navigation,
  abort, 503 and failed stylesheet/script loading, no status/progress DOM.
- View Transitions smoke: pass, including sound cue/context, reduced motion,
  component reinitialization, Back/Forward and deep-link reload; no pageerrors.
- Public visibility: 28 cases pass, including acknowledged fixture save followed
  by a fresh visit, revision changes during client history, parent inheritance
  and disabled page/section composition. Only a new `/tmp` fixture is mutated,
  and the verifier restores it.
- Dedicated navigation verifier: 24 navigations across four conditions;
  native fade durations 80ms, first-frame touch/mouse feedback, gesture cleanup,
  no stuck pending state/overflow/pageerrors. Reduced motion has no pressed scale.
- Dedicated prefetch inventory: zero speculative HTML, zero browser errors.

Timing is measured click to two animation frames after DOM swap, separately from
`astro:page-load`, and does not mean animation completion or full asset readiness.
Baseline normal-motion median was 192.9ms (12 samples, p95 287.7ms); the final
serial run measured 165.95ms (12 samples, p95 216.9ms). Reduced-motion median was
179.95ms before and 152.1ms after. Local fixture
timing includes no production Supabase round-trip. Small samples and host/browser
noise prohibit a production latency or universal 0ms claim. The verified outcome
is bounded animation, immediate feedback and removal of unused speculative reads.

Evidence: `artifacts/snappy-navigation/{before,viewport,after}/proof.json`,
experiment/build/QA logs in `artifacts/snappy-navigation/logs/`; existing browser
verifiers also retain their own artifact paths. Reproduce with
`scripts/verify-snappy-navigation.mjs` against the generated loopback harness.

The existing UX verifier was updated to assert the released removal of
`.navigation-status` and to compare Home Projects against its initial fixture
state rather than hardcoding an owner production preference into all fixtures.
