# Navigation performance P1 — region sin1 release

Owner explicitly authorized: “commit dan push paket P1 region sin1 beserta
verifier dan dokumen buktinya, termasuk deployment main dan verifikasi
production read-only.” This authorization covers one P1 main push and its
connected deployment. P2 public UX and P3 admin remain local and are excluded
from this commit. No SQL, dashboard/env mutation, deploy hook, live save/toggle/
restore/upload/submit or rollback is authorized or performed.

## Commit scope

Exactly these five files:

- `vercel.json`: add only `regions: ["sin1"]`; existing routing, functions,
  headers, runtime repair and Node22 engines remain intact.
- `scripts/verify-navigation-package.mjs`: local routing, Node22 packaged SSR,
  11 standalone APIs + one SSR function, no function region override.
- `scripts/verify-navigation-readiness.mjs`: provider GET, Supabase project GET,
  read-only visibility loader RPC and public/anonymous GET acceptance. Resolves
  current deployment and primary alias dynamically, supports expected SHA and
  region, records sanitized evidence. No owner login or private data reads.
- `scripts/verify-navigation-performance.mjs`: serial GET/HEAD-only browser
  timing; same-origin network, destination settled by two animation frames,
  median and nearest-rank p95 by width/motion, network/cold-state provenance.
- This release record.

Existing dirty/untracked planning and handoff documents are preserved outside
this commit. The local feedback refinement removing the top line, warm navbar,
prefetch policy and admin bounded prewarm are excluded from P1.

## Pre-push evidence — 11 October 2026

HEAD and remote main: `9ffce5ea859a87cd44f4126e9e7c6c60240cb857`.
Origin has one push URL: `https://github.com/Web-Data-Sorcerers/community-web.git`.
Current READY and primary alias matched:
`dpl_oioXmVjBR1efQZMCMTWvj87Tyy2C`. Actual runtime22.x, 12 Node functions,
compute iad1, provider default24.x and default region iad1 unchanged.
Supabase ACTIVE_HEALTHY in ap-southeast-1 (Singapore).

14:26:21 UTC full read-only acceptance: 19 public200/no-store/revision,
6 admin forms200/no-store/noindex, 4 anonymous private401, revision/content/
intake200, existing public CMS WebP200, two unknown routes404.
Visibility revision `716138bd-f7b2-4ae9-ba05-e6be5158d801`: Home ON,
home.projects=false, About/Hall of Frames OFF, 19 pages/21 sections. Latest
preferences were read and preserved; no reseed or save. Current content hash
and media response are captured for comparison after release.

Local region-only archive is HEAD plus the one region line, separately from
P2/P3. Node22.23.3 build/check PASS (0 errors, 0 warnings, 20 existing hints).
Rechecked local discovery/routing PASS: Node22 SSR, 11 root APIs +1 SSR,
no SSR region override. Isolated shipped-function boot outside workspace PASS:
19 routes, real shared Auth/Origin/CSRF with synthetic upstream, permission
recheck and fresh visibility save/read/restore entirely in memory, unknown
outbound0. This is local correctness evidence, not production live-write
acceptance. The initial archive verifier rerun lacked Git metadata; rerunning
with explicit read-only GIT_DIR/GIT_WORK_TREE passed without changing source.

Serial primary-alias baseline immediately before this release: 1440×900,
40 navigations per motion condition (80 total), splash seen, sound muted,
agent-host Chromium, network included, function cold/warm uncontrolled.
No other browser suite ran concurrently. No page errors, pending leaks,
overflow or blocked outbound.

| Condition                      | Samples | Median click → destination frame |      p95 | Range          |
| ------------------------------ | ------: | -------------------------------: | -------: | -------------- |
| Normal motion                  |      40 |                        1108.95ms | 1630.8ms | 715–1693.4ms   |
| Reduced motion                 |      40 |                         1013.3ms | 1541.4ms | 669.1–1570.7ms |
| Combined descriptive aggregate |      80 |                         1072.9ms | 1598.8ms | 669.1–1693.4ms |

Do not subtract direct RPC host timing from HTML timing to claim Vercel→DB
latency. Edge sin1 alone does not establish compute region. Actual deployment
regions and the dynamic responses' second x-vercel-id segment must agree.
This single-host before/after run is an observed comparison, not a universal
latency guarantee or a 0ms promise.

Ignored evidence: `artifacts/navigation-performance-p1-release/`, including
preflight-full/preflight.json, before/timing.json, before/summary.json,
region-only-build.log, package-recheck.log, packed-recheck.log and preservation
hashes. No production credentials or private applicant data are in evidence.

## Deployment acceptance at commit freeze

PENDING: release SHA, connected deployment READY, Current/alias matching,
actual Node22/12 functions/compute sin1, repeat full read-only acceptance,
unchanged visibility and CMS hash/media, repeated 80-sample paired timing,
build/runtime log check. Results will be recorded locally after the push;
no second documentation push or automatic retry deployment is implied.

Reproduce (Node22; existing credentials loaded only for read-only readiness):

```sh
node scripts/verify-navigation-package.mjs
NAV_ARTIFACT_DIR=artifacts/navigation-performance-p1-release/check \
  NAV_EXPECT_SHA=<release-sha> NAV_EXPECT_REGION=sin1 \
  node --env-file=.env.local scripts/verify-navigation-readiness.mjs
PREVIEW_URL=https://data-sorcerers-community-sigma.vercel.app \
  NAV_WIDTHS=1440 NAV_ROUNDS=4 \
  NAV_ARTIFACT_DIR=artifacts/navigation-performance-p1-release/after \
  node scripts/verify-navigation-performance.mjs
```

Packaging discovery uses installed Vercel CLI52.0.0's detectBuilders module at
`/home/faiz/.npm-global/lib/node_modules/vercel/dist/chunks/chunk-VPI2ZRPP.js`.
It requires a local built artifact and Git baseline, and never runs deploy,
link, pull or provider mutations. `.env.local` is not required for local build
or synthetic packed verification.

## Rollback candidate

Working pre-P1 release: SHA `9ffce5ea859a87cd44f4126e9e7c6c60240cb857`,
deployment `dpl_oioXmVjBR1efQZMCMTWvj87Tyy2C`, URL
https://data-sorcerers-community-gwpwr42g2-faizs-projects-6e23e5b2.vercel.app.
Rollback promotion needs separate explicit authorization; do not restore flags,
reseed/drop SQL, mutate provider settings or promote failed032fdf9.
Owner positive Auth and live-write acceptance remain pending and are outside P1.
