# Navigation and button latency investigation — 11 Oct 2026

Owner requested inspection of slow page navigation, tab switching and buttons.
This pass changes documentation only. No application source, production setting,
database state, deployment, commit or push was changed.

Production inspected: `9ffce5ea859a87cd44f4126e9e7c6c60240cb857`, deployment
`dpl_oioXmVjBR1efQZMCMTWvj87Tyy2C`, primary Vercel alias. Existing dirty handoff
documents remain preserved. Read-only evidence lives in ignored
`artifacts/navigation-performance-20261011/`.

## Findings and evidence

| Finding                                                  | Status              | Evidence and limits                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public navigation delay reproduced                       | Verified            | 18 completed real browser navigations, desktop 1440 and mobile viewport 390, normal and reduced motion. Click to `astro:page-load`: 672–2087 ms, median 1482 ms. Earlier first pass also recorded a 3513 ms mobile About navigation. Agent network is included; these are not owner-device timings or guarantees.                                                                                                                  |
| Waiting for HTML/preparation dominates                   | Verified            | In the completed pass, preparation took 632–2049 ms; after preparation to page-load only 30–102 ms, median 59 ms. HTML TTFB and transfer account for most of the wait. Three modest long tasks (52–66 ms) occurred in the completed normal-motion samples; no seconds-long main-thread task or page error was observed.                                                                                                            |
| Function/database geography differs                      | Verified            | Read-only Vercel project GET: `functionDefaultRegions=["iad1"]`, Fluid enabled. Supabase project GET: `ap-southeast-1`, `ACTIVE_HEALTHY`. Public HTTP response `x-vercel-id` included `sin1::iad1`. The SSR output has no per-function region override.                                                                                                                                                                            |
| Fresh visibility adds a request-time upstream dependency | Verified            | `server/site-visibility.mjs` performs one uncached Supabase visibility read RPC for each public request. Public HTML deliberately has no-store headers. The schema query reads the singleton settings row; this investigation does not prove query execution time from inside Vercel.                                                                                                                                              |
| Cross-region traffic contributes to latency              | Supported inference | Compute is in Washington while the database is in Singapore. Exact contribution cannot be isolated without colocated production comparison or upstream/server timing instrumentation. Six direct reads from the agent host took 127–742 ms and public recruitment fetches 851–2750 ms; these are different paths and cannot be subtracted to claim Vercel-to-database timing.                                                      |
| CSS is a secondary navigation waterfall                  | Verified            | Astro's installed router waits for newly introduced stylesheet links before swapping. First destination stylesheets took 37–249 ms in the completed pass. Revisiting routes removes this asset delay but still waits for fresh HTML.                                                                                                                                                                                               |
| Navbar entrance repeats                                  | Verified in source  | `Navbar.astro` arms `is-ready` on each page-load and replays 600 ms animations with stagger; desktop CTA starts after 500 ms. `nav-warm` skips the main hero entrance but does not skip this navbar entrance. This adds a visual settling delay after data preparation.                                                                                                                                                            |
| Public navigation has no pending indicator               | Verified in source  | No application listener for `astro:before-preparation`/`astro:after-preparation`. The old page remains while the request is pending, making a working click look unresponsive.                                                                                                                                                                                                                                                     |
| Cross-page Button uses the same slow path                | Verified            | Home hero Join Us to Recruitment took 1572 ms in the final button sample (earlier 1613 ms). Shared Button has no artificial action timeout.                                                                                                                                                                                                                                                                                        |
| Same-page anchor behaves differently                     | Verified            | Recruitment Apply Now reached `#available-roles` without a destination HTML fetch to `/recruitment`. The sample shows image loads and viewport-triggered role prefetches while scrolling.                                                                                                                                                                                                                                          |
| Non-navbar links can still prefetch HTML                 | Verified            | Only Navbar explicitly opts out. Installed Astro ClientRouter initializes `prefetchAll:true`; config specifies viewport strategy. Browser recorded `/recruitment/roles/data`, `/core`, `/language` speculative GETs after scrolling. The config comment describing explicit opt-in does not reflect this ClientRouter default. Cost/concurrency impact is not quantified. Do not blindly expand HTML prefetch or cache visibility. |
| Warm admin shell switches quickly without owner login    | Verified, limited   | Six switches changed the visible panel in 14–30 ms in final sample and made no network requests. Modules prewarm and mounted panels remain in DOM. This does not prove authenticated owner content readiness, first-load latency, or save/upload latency; those remain pending owner-session reproduction.                                                                                                                         |
| Production errors during sampled navigation              | Verified, limited   | Zero browser page errors in the 18 completed navigations; all HTTP timing samples returned 200. This is sampled evidence, not a claim of zero production errors globally.                                                                                                                                                                                                                                                          |

The initial browser script incorrectly opened the mobile menu before clicking the
Home logo; the menu correctly intercepted that click. That run timed out in the
test driver and its first-pass artifact is retained separately. The completed
run corrects the interaction and includes all 18 cases. No site source was changed.

## Current visibility observation

At `2026-10-11T13:11:48.703Z`, the read-only loader returned revision
`716138bd-f7b2-4ae9-ba05-e6be5158d801`: Home enabled, `home.projects=false`, About
and Hall of Frames disabled; other section preferences enabled. This differs
from the earlier release acceptance seed and is an externally observed change.
This agent did not issue any visibility save or restore. Do not overwrite the
current owner configuration or report the earlier seed as current state.

## Proposed next work, not executed

1. Prioritize colocating compute with the existing Singapore database. Concrete
   provider/release candidate: add top-level `"regions": ["sin1"]` to
   `vercel.json`, preserving all rewrites, headers, runtime packaging and shared
   Auth. Confirm generated function region and all 12 functions after build;
   compare the same browser paths before/after deployment. Hobby supports one
   function region. No database migration, account, grant, allowlist or plan change
   is required by this candidate.
2. For subsequent local UI work, preserve the existing Button, fonts and strict
   spacing. Show immediate navigation pending feedback and skip repeated navbar
   entrance on warm navigation. This improves acknowledgement/settling, while
   server optimization addresses actual wait. Handle cancellation and errors.
3. Review speculative HTML prefetch explicitly with the fresh-visit contract.
   Prefer immutable asset hints/connection reuse where measured useful. Preserve
   fresh visibility reads, no-store HTML and no visibility-save deploy hook.
4. Reproduce the owner's authenticated admin scenario before changing its
   prewarm, Auth or content-loading behavior. Warm unauthenticated shell timing
   cannot justify changing shared authentication.

Production provider/config and deployment require separate explicit approval.
New commit/push requires explicit owner instruction with the release scope.
Concrete region candidate needs local generated-output validation before a
production release approval packet is considered ready.

Rollback candidate for a region release: current working deployment
`dpl_oioXmVjBR1efQZMCMTWvj87Tyy2C` / commit `9ffce5e`, preserving current live
visibility state. If a dashboard default is changed instead of the versioned
candidate, restore the recorded `iad1` setting under separately authorized
rollback. Do not restore older visibility defaults as part of a runtime rollback.

Expected state after any approved optimization: latest saved revision on the
next fresh visit without rebuild; existing routes, 19 page and 21 section controls,
shared CMS Auth/Origin/CSRF and content preserved. Lower measured navigation wait
is the acceptance target; no 0 ms or automatic open-tab update promise.

Official references: [Vercel function region configuration](https://vercel.com/docs/functions/configuring-functions/region)
recommends placing compute close to its data source and documents the single-region
Hobby limit; [Astro lifecycle reference](https://docs.astro.build/en/reference/modules/astro-transitions/)
defines the preparation/swap events used in these timings. Installed source was
also inspected for stylesheet waiting and ClientRouter prefetch defaults.
