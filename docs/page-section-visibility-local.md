# Pages & Sections local execution

Catatan status setelah pass ini: P0–P6 dan refinement kemudian masuk commit
lokal `51ce1984112283ad533e018dbebcb6b3730a138a` setelah izin owner. Belum dipush/live.
Pernyataan no-commit di bawah merekam izin pada saat pass lokal tersebut.
Lanjut [kickoff aktif](page-section-visibility-kickoff.md) dan
[plan release](page-section-visibility-production-release-plan.md); jangan rerun
P0–P6 dari nol. QA tercatat bukan bukti acceptance production.

Owner authorized P0–P6 on 11 Oct 2026. Production SQL, provider configuration,
deployment, live toggles, commit and push remain unauthorized.

## P0 baseline and work order

Required six documents read. Existing dirty changes recorded in ignored
`artifacts/site-visibility/existing-status.txt` and `existing.diff`; preserved.
CMS snapshot SHA recorded before work. Complete link inventory recorded there.
Installed Astro 7.3.3 / Vercel adapter 11.0.13. Node local 26.10.0;
adapter emits Node 24 function (existing engine 22 unsupported by installed Astro).
No dependency or provider change is planned.

## Per-pass design and QA plan

This feature changes composition and destination policy, not existing component
geometry/artwork. Existing source and reference assets remain authoritative.
No new Figma node exists for admin or generalized development composition.

Admin: Dark Arcane existing tokens (#050507, #141122, #0e0c18, #ffffff,
#a8a3b8, #9b7bff). Bluu Next Bold 700 heading, Manrope body and controls.
Desktop left page selector and right details, mobile stacked, left aligned.
32/24 shell padding retained; new rows padding16, gaps8/16/24/32.
Existing Button styles for save/cancel/reload. Native accessible switches,
explicit draft count, saved vs inherited state and no content deletion.
QA at320/390/768/1440; keyboard, dirty guard, conflict, retry, logout and races.

Public pass order and inventory (each section gets independent off/on HTML proof):

1. Home: protected Hero (1430:2041), philosophy (1430:2052), what-we-do
   (1430:2089), domains (1430:2138), projects (1430:2146), recruitment-cta
   (1430:2162), protected shared Footer. Projects first. Existing 1440 references,
   100svh content; CTA554 and Footer geometry retained.
2. About: protected Hero1439:4185, vision-mission1439:4190,
   philosophy1439:4219, ecosystem1439:4258, team1688:2933 and shared Footer.
   Restore original composition only for enabled state, default off retained.
3. Hall of Frames: protected Hero1439:4507, featured1439:4512,
   projects1439:4655, milestones1439:4699, shared Footer; default off retained.
4. Recruitment: protected Hero1436:3506, who-should-join1436:3512,
   what-you-will-do1436:3517, available-roles1436:3564, timeline1436:3637,
   faq1436:3675, snippets1436:3684, cta1436:3687 and shared Footer.
5. Partners: protected Hero1439:4788, partners1439:4793,
   why-partners1439:4937 and shared Footer.
6. Contact: protected whole composition1445:5066 (height954), shared Footer.
7. Six HoDS, six role details and apply: whole composition switches only,
   request-time dataset lookup, unknown404, parent inheritance, safe Back links.

For every public pass: preserve Bluu Next/Manrope, artwork and spacing; check
raw HTML absence (no empty wrapper), active DOM geometry, filtered links and
script errors before moving on. General development view uses approved
ondp.png assets, 1440x903 reference viewport,100svh minimum,144/64 clearance,
8/24/32 copy gaps,16 action gap and24 mobile gutter. No large Footer.
Final QA covers no-JS, freshness/history, zero/one cards,503 failures,
SEO/sitemap, admin regression and unchanged CMS schema/snapshot.

## P1 spike

Selective SSR About built locally with mutable file fixture. Preliminary output
has no static About HTML. Adapter output alone omits standalone api functions;
local Astro route bridge forwards existing handlers, including media path, with
no changes to auth or handler contracts. Final proof and timing pending.

Official references checked during execution:
[on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/)
and [sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/).

P1 PASS: mutable About fixture, next GET, Astro client navigation and
Back/Forward observed updated HTML with no rebuild; no static About output.
API handler503 (unconfigured local auth) and invalid media400 retained.
Local cold/warm samples28.34/6.08/5.09ms, not production or authenticated timing.
Installed ClientRouter fetches HTML per navigation; Navbar explicit viewport
prefetch will be disabled. Native bfcache requires revision probe on persisted
pageshow; no polling or ordinary open-tab update.

P2 registry/contract PASS4 Node tests. SQL local proposal has three private RLS
objects, service-only wrappers and strict code-owned whitelist. Replay records
retained indefinitely, capped10000/actor; new requests at cap reject LIMIT.
Local PostgreSQL lacks PostgREST safeupdate, so writes reuse the established
Management API transport instead of claiming a new safeupdate proof.

P5 Home / Projects: SSR HTML fixture off/on PASS; section absent and Explore CTA absent when off, returned when on. No content deleted.

P5 home.philosophy: off/on raw HTML, all three no-store headers and current revision PASS. Inactive component absent.

P5 home.what-we-do: off/on raw HTML, all three no-store headers and current revision PASS. Inactive component absent.

P5 home.domains: off/on raw HTML, all three no-store headers and current revision PASS. Inactive component absent.

P5 home.recruitment-cta: off/on raw HTML, all three no-store headers and current revision PASS. Inactive component absent.

P5 about: off/on raw HTML, all three no-store headers and current revision PASS. Inactive page uses approved chamber and noindex, follow.

P5 about.vision-mission: off/on raw HTML, all three no-store headers and current revision PASS. Inactive component absent.

P5 about.philosophy: off/on raw HTML, all three no-store headers and current revision PASS. Inactive component absent.

P5 about.ecosystem: off/on raw HTML, all three no-store headers and current revision PASS. Inactive component absent.

P5 about.team: off/on raw HTML, all three no-store headers and current revision PASS. Inactive component absent.

P5 hall-of-frames: off/on raw HTML, all three no-store headers and current revision PASS. Inactive page uses approved chamber and noindex, follow.

P5 hall-of-frames.featured: off/on raw HTML, all three no-store headers and current revision PASS. Inactive component absent.

P5 hall-of-frames.projects: off/on raw HTML, all three no-store headers and current revision PASS. Inactive component absent.

P5 hall-of-frames.milestones: off/on raw HTML, all three no-store headers and current revision PASS. Inactive component absent.

P5 recruitment: off/on raw HTML, all three no-store headers and current revision PASS. Inactive page uses approved chamber and noindex, follow.

P5 recruitment.who-should-join: off/on raw HTML, all three no-store headers and current revision PASS. Inactive component absent.

P5 recruitment.what-you-will-do: off/on raw HTML, all three no-store headers and current revision PASS. Inactive component absent.

P5 recruitment.available-roles: off/on raw HTML, all three no-store headers and current revision PASS. Inactive component absent.

P5 recruitment.timeline: off/on raw HTML, all three no-store headers and current revision PASS. Inactive component absent.

P5 recruitment.faq: off/on raw HTML, all three no-store headers and current revision PASS. Inactive component absent.

P5 recruitment.snippets: off/on raw HTML, all three no-store headers and current revision PASS. Inactive component absent.

P5 recruitment.cta: off/on raw HTML, all three no-store headers and current revision PASS. Inactive component absent.

P5 partners: off/on raw HTML, all three no-store headers and current revision PASS. Inactive page uses approved chamber and noindex, follow.

P5 partners.partners: off/on raw HTML, all three no-store headers and current revision PASS. Inactive component absent.

P5 partners.why-partners: off/on raw HTML, all three no-store headers and current revision PASS. Inactive component absent.

P5 contact: off/on raw HTML, all three no-store headers and current revision PASS. Inactive page uses approved chamber and noindex, follow.

P5 recruitment-apply: off/on raw HTML, all three no-store headers and current revision PASS. Inactive page uses approved chamber and noindex, follow.

P5 hods-data: off/on raw HTML, all three no-store headers and current revision PASS. Inactive page uses approved chamber and noindex, follow.

P5 hods-core: off/on raw HTML, all three no-store headers and current revision PASS. Inactive page uses approved chamber and noindex, follow.

P5 hods-language: off/on raw HTML, all three no-store headers and current revision PASS. Inactive page uses approved chamber and noindex, follow.

P5 hods-vision: off/on raw HTML, all three no-store headers and current revision PASS. Inactive page uses approved chamber and noindex, follow.

P5 hods-product: off/on raw HTML, all three no-store headers and current revision PASS. Inactive page uses approved chamber and noindex, follow.

P5 hods-growth: off/on raw HTML, all three no-store headers and current revision PASS. Inactive page uses approved chamber and noindex, follow.

P5 role-data: off/on raw HTML, all three no-store headers and current revision PASS. Inactive page uses approved chamber and noindex, follow.

P5 role-core: off/on raw HTML, all three no-store headers and current revision PASS. Inactive page uses approved chamber and noindex, follow.

P5 role-language: off/on raw HTML, all three no-store headers and current revision PASS. Inactive page uses approved chamber and noindex, follow.

P5 role-vision: off/on raw HTML, all three no-store headers and current revision PASS. Inactive page uses approved chamber and noindex, follow.

P5 role-product: off/on raw HTML, all three no-store headers and current revision PASS. Inactive page uses approved chamber and noindex, follow.

P5 role-growth: off/on raw HTML, all three no-store headers and current revision PASS. Inactive page uses approved chamber and noindex, follow.

## P3 runtime and API

`server/site-visibility.mjs` validates one config per public request. Explicit
`SITE_VISIBILITY_SOURCE=local` uses a bundled default or an explicit local file;
local source is rejected when VERCEL is set. Supabase mode uses the separate
service-only load RPC with a 5s deadline and a bounded 32KiB body. It never falls
back to stale enabled defaults on remote failure. All visibility HTML/settings/
revision responses set Cache-Control, CDN-Cache-Control and
Vercel-CDN-Cache-Control to no-store. Errors expose no upstream body or secrets.

Settings endpoint `/api/admin/site-visibility` reuses unchanged CMS Auth. Shared
session, Origin, CSRF and grant checks precede privileged work; cookie rotation is
propagated on success/error. Writes use the existing encoded Management API
transport and recheck grant within SQL. Strict save envelope, boolean allowlist,
UUIDs, 32KiB request bound, duplicate JSON keys/targets and Home protection are
validated. Successful exact retries replay before revision conflict; mismatched
payload returns ID_CONFLICT. Real changes alone create a revision/event. No-op
keeps revision, with a replay receipt. No deployment hook is called.

## P4 admin

Pages & Sections is the fourth keep-alive tab in `/admin/`, `/admin/team/` and
`/admin/recruitment/`, reachable as `#pages`. One initial visibility read per
mounted panel; idle prewarm is reused. Drafts do not write until explicit batch
save. Cancel/reload, dirty navigation guard, inherited state and saved state are
visible. Conflicts retain the draft for explicit reload/reapply and new save.
Unknown write outcomes retain exact UUID/body for explicit retry. Generations
prevent late results from reviving expired state; mutation controls lock during
save/uncertainty. Global logout clears the fourth panel and other mounted cached
workspaces. Labeled native switches preserve keyboard focus through rendering.
No new login identity, collection editor or recruitment intake control is added.

## P6 verification and release review

The generated adapter has one `_render` function on nodejs24.x, nineteen public
SSR routes, existing API/media bridges, and five static HTML documents (three
admin entrypoints and two lab pages). The route bridge was necessary because the
local adapter artifact does not itself package standalone `api/*.js` handlers.
Existing CMS public content/media handlers are forwarded unchanged in behavior;
their default snapshot is bundled so fallback works in the generated function.
SEO audit now reads 19 runtime responses plus five static documents and validates
exactly 19 public sitemap URLs. It requires PREVIEW_URL for the SSR build.

Local fixture save-to-next-visit proof uses browser transport fixtures plus a
mutable file served by the actual generated Vercel function. Shared Auth and
SQL atomic save/replay are tested separately with injected upstream and ephemeral
PostgreSQL. This is not production end-to-end acceptance or production latency.
Persisted pageshow proof dispatches a controlled persisted event; Astro client
Back/Forward is exercised with real browser navigation. No claim of universal
native-browser bfcache eligibility.

Production prerequisites: review additive SQL and back up definitions/settings;
separately authorize production apply and verify defaults/ACL/catalog; review the
installed adapter's Node24 function/runtime/routing in the actual provider setup;
then separately authorize commit/push/deploy for the reviewed release. DB must
exist before deploying the SSR runtime. Finally authorize exact live acceptance
IDs/state/restore scope. Current production remains on its existing release.

Rollback: keep additive config/events/receipts; do not drop data automatically.
A rollback to a previous static release can expose its built content despite
newer hidden flags. Inspect latest state and agree on the serving behavior before
any production rollback.

## Final local acceptance — PASS

P0–P6 local execution complete. No production SQL, provider/account/grant/
allowlist change, deployment hook, deployment, live toggle, commit or push.
Existing dirty work retained; no reset/stash. Home Projects seed remains true;
About/Hall of Frames seed remains false. Source registry has 19 pages / 21
sections; snapshot hash is unchanged:
`4345f1abe445aa2a400c31413ccc058707a77105a7e388dc8d1074e78da94857`.

| Gate                                       | Actual result                                                                                                                                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Astro check / final build                  | PASS, 0 errors / 0 warnings, 36 existing hints; 19 public SSR / 5 static HTML, one generated function                                                                                                         |
| Format / diff                              | Prettier PASS; git diff --check PASS                                                                                                                                                                          |
| Spacing                                    | 40 public components PASS; new admin panel and shared chamber targeted PASS                                                                                                                                   |
| Visibility contract/runtime/Auth           | 10 PASS, including native fetch stalled-body abort within 5s configured deadline and oversized body cancellation                                                                                              |
| Additive SQL, ephemeral PostgreSQL 18.6    | 29 PASS: seed/rerun, atomic save/no-op/event, replay/conflict/race, rollback, ACL and grant recheck                                                                                                           |
| Existing CMS / Recruitment                 | 98 PASS + 10 Team SKIP; 42 PASS                                                                                                                                                                               |
| Pages admin                                | 12 route/width combinations PASS at 320/390/768/1440, one-read budget, save/cancel/dirty guard/conflict/exact retry/logout                                                                                    |
| Admin races                                | 3 PASS: late read, failed read, late write + double-click; expired state stays cleared                                                                                                                        |
| Existing Projects / Team / Pendaftar admin | Each PASS at four widths using HTTP fixtures                                                                                                                                                                  |
| Public visibility browser                  | 28 cases PASS, errors [], including all 19 defaults, fixture save -> next visit, parent inheritance, contextual Back, 0/1 cards, no-JS, history, persisted revision probe, 503/recovery and API/media routing |
| Development composition                    | 14 layouts PASS incl short screens, enlarged text, decoded desktop/mobile art, keyboard/menu, four links/back and motion                                                                                      |
| Active original visual suite               | PASS with explicitly all-active local fixture; browserErrors []                                                                                                                                               |
| View Transitions / Navbar                  | PASS, pageerrors none; 20 widths PASS                                                                                                                                                                         |
| Responsive                                 | 18 routes x 26 widths = 468 combinations PASS                                                                                                                                                                 |
| Default SSR main/Footer parity             | 19/19 exact normalized fingerprints against isolated pre-feature baseline including owner dirty changes                                                                                                       |
| SEO                                        | 24 documents PASS, exactly 19 public sitemap routes, admin/lab excluded; normalized canonical path also handles slashless links                                                                               |
| Compiled secrets / schema                  | 0 secret findings; 12 existing migrations and Auth/intake sources preserved                                                                                                                                   |

Evidence in ignored `artifacts/site-visibility/`: initial status/diff, baseline
HTML, per-gate logs, `db-proof.json`, `admin-proof.json`, `race-proof.json`,
`public-proof.json`, `parity-proof.json`, `release-proof.json`, active panel
screenshots at four widths. Larger baseline responsive/visual artifacts retain
their existing script locations. Local response samples with file fixture:
p50 about 6.86ms / p95 about 17.61ms (20 contact requests). These are local
observations, not remote database/network, provider cold start, production
latency, or a 0ms guarantee.

Parity normalizes Astro scope attributes, bundled scripts and whitespace,
and compares complete main/Footer composition. It does not discard visible
content or rewrite links. All-active legacy assertions separately validate the
preserved About/Hall of Frames original components. The initial isolated build
needed copied local dependencies rather than symlinked dependencies to avoid an
Astro compiler metadata-path error; no dependency was installed or changed.

### Reproduce locally

Create an owned fixture from `src/data/site-visibility-snapshot.json`; use
`SITE_VISIBILITY_SOURCE=local`, `CMS_DATA_SOURCE=local` and an explicit
`SITE_VISIBILITY_FILE` pointing at that file. Build with `npm run build`.
Run `node scripts/serve-site-visibility.mjs` with the same local fixture env;
default port is 4348, bound only to 127.0.0.1. The harness serves the actual
`.vercel/output` generated function and its static directory, not a dist-only
Python server. Restart the harness after rebuilding so its manifest and assets
match.

Use `PREVIEW_URL=http://127.0.0.1:4348` for runtime QA/SEO. Run
`verify-site-visibility-public.mjs`, `verify-site-visibility-admin.mjs`,
`verify-site-visibility-races.mjs` and `verify-site-visibility-db.mjs`.
`verify-site-visibility-pass.mjs <page-id> [section-id] [HTML-marker]` checks one
owned local fixture pass and restores its original bytes. Public pass/verifier
refuses a remote hostname. Keep fixture-changing checks sequential; admin mocks
can run independently. For legacy visual/VT/responsive QA only, explicitly set
all fixture page flags true, then restore default fixture bytes. This never
changes a remote configuration. Default-composition parity uses recorded
baseline HTML and the default fixture.

Private save QA uses synthetic HTTP transport and separate shared-Auth/ephemeral
SQL checks. A normal application login/save still needs the existing shared
backend; application Auth has no bypass or second identity. Production SQL
proposal is ready for review at
`supabase/migrations/20261011160000_site_visibility.sql`; it remains unapplied.

### Interactive owner review fixture

The local harness additionally supports an explicit review transport, isolated
from application Auth and production writers. It starts with a synthetic review
session, writes only an explicit `/tmp/` fixture, blocks other private admin
endpoints, and refuses Vercel or a non-local visibility source. This mode is
only for trying the Pages & Sections UI; other admin tabs do not load real data.
The harness remains bound to 127.0.0.1. Never enter real account credentials in
this synthetic review session.

```sh
cp src/data/site-visibility-snapshot.json /tmp/ds-visibility-review.json
SITE_VISIBILITY_SOURCE=local CMS_DATA_SOURCE=local \
SITE_VISIBILITY_FILE=/tmp/ds-visibility-review.json \
SITE_VISIBILITY_REVIEW_FIXTURE=1 PORT=4348 \
node scripts/serve-site-visibility.mjs
```

Open `http://127.0.0.1:4348/admin/#pages`. Select Home, turn Projects off,
save, then visit `/` afresh: Projects and its Explore destination disappear.
Turn Partners off and save, then visit `/partners/`: the existing Page Under
Development composition appears. Home itself remains protected; About and
Hall of Frames start off. Changes to the review fixture persist until it is
replaced with the snapshot. Replacing it requires reloading the admin UI before
the next edit. A browser smoke check confirmed real harness POST success,
next-request SSR freshness, restored Projects and zero browser errors.

The review transport validates the shared contract, checks Origin/fixture CSRF,
serializes writes and simulates revision conflicts and request-ID replay. It
does not replace the separate shared-Auth and ephemeral SQL QA above, or prove
production routing/latency. Public visitors with an already open tab do not
automatically receive changes.

## UI refinement berikutnya — lokal

Owner kemudian menyetujui refinement layout dan kejelasan kontrol. Hasil
implementasi, pass 19 halaman/21 section, screenshot dan batas QA ada di
[page-section-visibility-ui-refinement-local.md](page-section-visibility-ui-refinement-local.md).
Perilaku runtime, registry, shared Auth dan default seed tetap sama.
