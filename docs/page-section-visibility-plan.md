# Master plan: Pages & Sections visibility

Execution update, 11 Oct 2026: owner submitted the local implementation request.
P0–P6 execution and actual QA evidence are recorded in
[page-section-visibility-local.md](page-section-visibility-local.md).
Original planning/kickoff text below remains the specification/history; its
“documentation only” status no longer describes this authorized local pass.
Production actions and commit/push remain separately unauthorized.

Date: 11 Oct 2026. Status: PLAN ONLY. Owner requested a detailed handoff for a
new AI. This document proposes implementation; it does not authorize production
SQL, provider changes, deployment, content mutations, commit or push.

## 1. Objective and definition of instant

Add a fourth admin tab, Pages & Sections. Owner can activate/deactivate each
public content page and independently show/hide its top-level content sections.
Disabled pages render the approved full-screen Page Under Development design.
Disabled sections are absent from rendered HTML and leave no empty wrapper.
Content, photos, selection state and database records remain stored.

The handoff must let a new AI begin local implementation after the owner asks
for execution, without rediscovering the design and behavior decisions.

Runtime target: after a successful visibility save, the NEXT fresh HTTP page
request and fresh Astro client navigation read the committed revision without
waiting for a Vercel build. This is not a 0ms latency promise. A page already
open is a snapshot; refresh/navigation applies the new state. Automatic changes
to an open visitor tab, realtime subscriptions and polling are out of v1 scope.
Admin feedback target <=100ms for local busy feedback; actual authenticated
save/read latency must be measured, not inferred from mocks.

## 2. Grounded current baseline

- `astro.config.mjs`: Astro 7.3.3, output static, @astrojs/vercel 11.0.13,
  viewport prefetch and @astrojs/sitemap already configured.
- `src/pages/index.astro`, recruitment and partners directly compose components.
  There is currently no page/section visibility registry or settings API.
- `src/pages/about.astro` and hall-of-frames currently ONLY render Navbar and
  ArcaneChamber. Restoring original compositions must be explicit; changing
  a boolean alone cannot reveal content absent from the page source.
- `src/components/ArcaneChamber.astro` currently accepts about/hof only; has
  fixed links to Home, Recruitment, Partners, Contact, no large Footer.
- Native source artwork: `assets/on development/ondp.png`. Generated assets and
  `scripts/verify-on-development.mjs` are the approved local baseline.
- `src/scripts/admin-shell.js`: keep-alive Projects, Team, Pendaftar panels,
  lazy mounting, prewarming, dirty guard. Three entry pages duplicate this shell:
  `/admin/`, `/admin/team/`, `/admin/recruitment/`.
- `server/cms-auth.mjs`: createCmsAuth().authorize(request) verifies sealed
  shared session, trusted Auth user and CMS grant; POST validates Origin/CSRF.
  Returns actor/session/setCookie or error Response. Reuse unchanged.
- `server/cms-admin.mjs`: existing CRUD and background publication hooks.
  Visibility saves must NOT call existing deploy hooks or alter CRUD semantics.
- `server/cms-public.mjs`, `/api/cms/content`, and `cms-live-sync.js` refresh
  Projects/Team in existing DOM. They do NOT implement full-page visibility.
  Do not overload these contracts for the new feature.
- `scripts/cms-client.mjs` builds the strict six-collection schemaVersion1
  snapshot via six RPCs. Keep this schema, content and loader untouched.
- Local QA before planning: check 0 errors/0 warnings/36 hints, build24pages,
  spacing40, format, SEO24, Navbar20widths, dedicated development verifier PASS.
  Legacy verify.mjs still assumes original About/HoF compositions.
- Working tree has owner/existing uncommitted edits. Record status and diff
  before editing. Preserve unrelated Navbar/contact/Footer/team-verifier work.
  Do not reset, stash, overwrite or claim all dirty files as this feature.

Current remote/provider state was not queried in this planning pass. Verify it
read-only before a release; historical two-domain instructions are superseded
by later production-only checkpoints. Never infer push targets from old prose.

## 3. Architecture decision proposed for execution

Recommended v1: on-demand rendering for all visibility-controlled public pages.
Keep output static globally; opt individual routes into `prerender = false`
using the existing Vercel adapter. Assets remain static/CDN served, existing
content still comes from the bundled CMS build snapshot plus existing live sync.
Only the SMALL visibility configuration is read per public request.

Official prerequisites, checked when planning:

- [Astro on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/)
  documents selective prerender=false with an adapter.
- [Astro routing reference](https://docs.astro.build/en/reference/routing-reference/)
  describes prerender and getStaticPaths; dynamic SSR routes must resolve params
  at request time instead of relying on getStaticPaths props.
- [Sitemap integration](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
  must be rechecked against installed version for SSR route discovery.

MANDATORY local spike before broad conversion: build one real About route with
mock visibility, inspect .vercel/output routing/functions, assert content no
longer has an overriding static HTML file, and test standalone api/* coexistence
and media rewrite. Astro 7 preview/adapter behavior must be tested locally and
then on an approved deployment. No new adapter/library without demonstrated need.

Public response headers: Cache-Control, CDN-Cache-Control and
Vercel-CDN-Cache-Control no-store. No ISR, SWR or cross-request visibility cache
in v1; deduplicate the read ONLY within the same request via Astro.locals or
explicit context passed to components. Read once for page, navbar, Footer and
all conditional links; mixed revisions within a response are forbidden.

Avoid client-only CSS hiding as the primary architecture: it would leave old
content in initial HTML, can flash before fetch, and needs a separate complete
content tree to reactivate About/HoF. Do not implement it as an unreviewed shortcut.
Static + rebuild remains an alternative if owner prioritizes static hosting,
but does not meet this plan's no-rebuild runtime target. Record the tradeoff
and ask before abandoning the recommended architecture after a failed spike.

## 4. Visibility registry: stable IDs and scope

New shared registry: `src/data/site-visibility-registry.mjs` (proposed).
Registry is code-owned: page ID/path/label, parent, allowed section IDs, component
and anchor mappings, protected slots. Admin can change booleans only, not paths,
IDs, order, arbitrary selectors, URLs, HTML, CSS or page creation.

Primary pages and individually toggleable sections:

| Page ID        | Path             | Sections and existing components                                                                                                                               |
| -------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| home           | /                | philosophy:Philosophy, what-we-do:WhatWeDo, domains:Domains, projects:Projects, recruitment-cta:Recruitment                                                    |
| about          | /about/          | vision-mission:VisiMisi, philosophy:Philosophy variant=about, ecosystem:OurEcosystem, team:OurTeam                                                             |
| hall-of-frames | /hall-of-frames/ | featured:HallOfFramesFeatured, projects:HallOfFramesProjects, milestones:HallOfFramesMilestone                                                                 |
| recruitment    | /recruitment/    | who-should-join:WhoShouldJoin, what-you-will-do:WhatYouWillDo, available-roles:AvailableRoles, timeline:SelectionTimeline, faq:Faq, snippets:Snippets, cta:Cta |
| partners       | /partners/       | partners:OurPartners, why-partners:WhyPartners                                                                                                                 |
| contact        | /contact/        | ContactHero includes hero, form and info cards in one composition; no independent section toggle in v1                                                         |

Primary heroes, Navbar, Footer, Sound and Splash are protected presentation slots,
not section toggles. Home page is protected ACTIVE. Contact remains toggleable as
a whole page; splitting its monolithic hero/form/cards is a separate geometry
change. Never present a disabled fake section switch for unsupported granularity.

Additional public page switches: six `/hods/{id}/`, six
`/recruitment/roles/{id}/` with id=data/core/language/vision/product/growth,
and `/recruitment/apply/`. Total public page records: 19 including Home.
Use explicit IDs `hods-data`, `role-data`, etc. and `recruitment-apply`.
Each detail page's body is protected as one composition in v1: no per-paragraph
or per-tab hiding. Internal /lab/*, admin and API routes are never toggleable.

Default seed preserves current visibility: About/HoF false; all other pages
true, all section preferences true. Proposed first owner mutation is
home.projects=false. Do not silently also disable hall-of-frames.projects:
section settings are per-page even when they share a collection.

## 5. Effective state and dependencies

pageEffective = own enabled AND parent pageEffective; Home always true.
Recruitment role/apply pages inherit recruitment. HoDS pages have Home as parent.
sectionEffective = pageEffective AND own section preference.
When a page is disabled, preserve section preferences; show them in admin as
inherited unavailable, not rewritten false. Reenabling restores prior preferences.
Likewise, disabling Recruitment preserves each role/apply preference.

Disabled known page returns 200, canonical URL retained, robots noindex,follow,
and ArcaneChamber with registry label + filtered active destinations. This is an
editorial development state, not an unknown route. Unknown ID returns404.
Enabled page uses original content, original typography/geometries and Footer.
No automatic promise of launch date/progress. No large Footer in development mode.

RECRUITMENT_OPEN controls intake separately. Disabling recruitment/apply pages
does not modify this flag or the submission API. Admin must explicitly explain
'Visibilitas halaman tidak mengubah status penerimaan pendaftaran.' Closing
intake is a separate owner action, not a side effect of this feature.

Visibility is editorial, not an authorization boundary. Existing public media
and content endpoints may remain accessible. Sensitive content removal requires
a separate access-control plan; do not claim hidden data is private.

## 6. Navigation, CTA and fragment rules

- Navbar and Footer page links retain known inactive primary pages: visiting
  them leads to On Development; aria-current reflects the URL. No grey
  unreadable labels, no fake disabled anchor, no layout width changes.
- ArcaneChamber recommended destinations are active pages only, in order Home,
  Recruitment, Partners, Contact, excluding current route. Home always supplies
  an escape. Extend Props to pageId/pageName/destinations with compatible
  about/hof usage during migration; no unsafe label HTML.
- Action CTAs only render when their page/section target is effectively active.
  Keep secondary CTA groups responsive when only one link remains.
- Home Hero Explore projects targets home.projects (#projects); omit that
  button when false. Home Join and Recruitment CTA require recruitment active.
- RecruitmentHero Apply (#available-roles) requires available-roles active.
  Recruitment CTA community link and other #available-roles links likewise.
- DomainRail links filter or omit disabled individual HoDS destinations without
  inserting disabled buttons; active domain cards preserve their artwork and
  geometry, variable card counts require renderer and carousel tests.
- AvailableRoles cards target role pages; render only enabled destination cards.
  When none remain, omit the effective section and its anchor CTAs; store its
  preference unchanged and label this dependency in admin.
- RoleDetail Apply requires recruitment-apply active plus existing intake UI
  rules. Do not bypass closed intake state.
- OurTeam Growth Join card requires recruitment active. Do not delete member data.
- Role/HoDS Back links: if their contextual section is hidden, return to the
  active parent page top with label 'Back to Recruitment' / 'Back to Home'.
  Preserve the existing ?from=recruitment behavior when valid.
- On reload or pasted URL with missing/hidden anchor, keep the same page and
  land at top safely; no scroll exception, infinite retry or invisible section.
- Rebuild a complete link inventory with rg before coding; examples above are
  not an exhaustive assertion about every current href.

Freshness: viewport prefetch and client document reuse must not supply old page
HTML after a save. Audit installed Astro ClientRouter and prefetch behavior;
disable prefetch on visibility-controlled links if needed, test actual network
requests. Refresh/back/forward/bfcache cases need explicit proof. Browser Back
can restore an old document; on persisted pageshow revalidate revision and reload
once if different, preserving safe position when possible. No reload loop.
Server HTML already sent cannot be retroactively revoked; ordinary open-tab
content need not update until refresh/navigation.

## 7. Separate configuration schema and DB proposal

Do not add visibility to the strict six-collection CMS snapshot. Proposed separate
`src/data/site-visibility-snapshot.json` for explicit offline QA only, validated
by shared `server/site-visibility-contract.mjs` against the registry.

Proposed DTO:

```json
{
  "schemaVersion": 1,
  "revision": "opaque-uuid",
  "pages": {
    "home": { "enabled": true, "sections": { "projects": true } },
    "about": { "enabled": false, "sections": { "team": true } }
  }
}
```

Example is abbreviated, NOT a valid full config fixture. A real response must
contain all registry pages and exact section sets; strict booleans, no unknown
keys, no missing required fields, validated revision, Home true. Public DTO
excludes actor/audit details. Registry/version changes require explicit migrations.

Additive SQL proposal, names finalized during local implementation:

- private.site_visibility_state singleton: schema_version, revision uuid,
  configuration jsonb, updated_at timestamptz. Check singleton and schema;
  validate against explicit SQL whitelist matching JS registry.
- private.site_visibility_events: revision, actor Auth ID, request UUID,
  payload hash, before/after changed flags, timestamp. No applicant data.
- private.site_visibility_requests: actor+request UUID unique, canonical payload
  hash and successful result for exact retry. Storage bounded/retention defined
  without pruning unrelated audits.
- public.site_visibility_load() returns public DTO, service_role only in v1.
  Public SSR uses service credential server-side, never exposes it in browser.
- public.site_visibility_save(actor_id, expected_revision, request_id, changes)
  service_role only; explicitly reverify active existing CMS grant in SQL.

Private tables RLS enabled with deny policies; no direct table grants for anon,
authenticated or service_role. Wrappers SECURITY DEFINER, fixed safe search_path,
qualified names; revoke PUBLIC/helper execute. Use existing Management API write
transport pattern if installed PostgREST safeupdate still blocks mutations;
prove this locally rather than invent a parallel privileged HTTP mechanism.

Atomic order: verify permission; serialize same actor/request UUID; exact successful
replay before revision conflict; lock singleton row; compare expected_revision;
validate registry changes; apply all changes atomically; generate revision and
append event/request result in SAME transaction. A no-op save returns unchanged
revision without audit churn. Different payload for same request UUID =>409
ID_CONFLICT. Concurrent different requests at same revision => one200/one409.
Failure rolls back all objects, no partially saved switches.

Seed once: preserves current page/section settings; no ON CONFLICT overwrite
of owner configuration on rerun. No modifications to existing CMS, recruitment,
Auth users, allowlists, grants, Storage or env.

## 8. Endpoints and runtime loader

New `api/admin/site-visibility.js`, backed by
`server/site-visibility-admin.mjs`. GET loads config and session csrf. POST
accepts ONLY operation save with payload:

```json
{
  "operation": "save",
  "payload": {
    "expectedRevision": "opaque-uuid",
    "requestId": "uuid",
    "changes": [{ "pageId": "home", "sectionId": "projects", "enabled": false }]
  }
}
```

sectionId omitted for a page change. Max request32KiB, max64changes, exact key
checks, duplicate target rejection, strict boolean, Home false rejected. Validate
body before DB mutation, session/Origin/CSRF before upstream privilege. GET
unauthenticated401; forbidden403; invalid400; media type415; method405;
conflict409; bounded upstream failures502/503. Return session cookie rotation
from authorize and no-store headers. Never echo raw provider bodies/secrets.

Success: `{ok:true,data:<complete-config>,csrf:<session-token>}` after DB commit.
No publicationPending, no rebuild status, no hook. Server commit establishes
availability to future fresh reads; UI says 'Perubahan tersimpan. Berlaku pada
kunjungan berikutnya.' A failed verification GET is distinct from failed save.

`server/site-visibility.mjs` request loader uses service-only read with bounded
timeout (proposed5s, subject to measurements), validates DTO, request dedupe.
Explicit local mode uses only the separate offline snapshot. Production missing
config/table/RPC, timeout or malformed response must NOT fall back to a possibly
enabled stale snapshot. Return a503 availability page with Retry-After and
no-store; do not masquerade as owner's Under Development selection. Build/init
must not import server credentials into browser modules. Audit bundle output.

No public settings API is required for normal rendering. If bfcache revision
probe needs one, expose only validated revision via service-backed GET, no-store,
bounded response; keep independent from /api/cms/content. Add it only when the
local freshness spike proves it necessary, document the exact contract.

## 9. Page rendering integration

Fetch config at page/middleware boundary before rendering. Pass the SAME object
to page composition, Navbar, Footer, destination-aware components. Shared pure
helpers getPageState/getSectionState/canNavigateToTarget must be usable in Node
tests; no runtime global config mutable across requests.

Restore About active composition from existing components: AboutHero, VisiMisi,
Philosophy variant=about, OurEcosystem, OurTeam, Footer, Motion. Hall active:
HallOfFramesHero, HallOfFramesFeatured, HallOfFramesProjects,
HallOfFramesMilestone, Footer, Motion. Inspect props/history to preserve exact
baseline; do not redesign originals or use outdated dimensions as live facts.

SSR dynamic HoDS/role routes resolve Astro.params.id against existing datasets;
404 unknown IDs, avoid missing getStaticPaths props and arbitrary reflection.
Disabled parent suppresses child content server-side, including apply form.
Inactive sections should not initialize scripts/observers or fetch their live
content. Motion/carousels must tolerate absent selectors and zero/one items;
dispose/reinitialize with astro:before-swap/page-load. Do not replace component
scripts with broad DOM string injection.

Contact whole-page switch, application page switch and detail pages require
generalized development template. Font/layout/button behavior remains as approved;
no new background or unrelated UI redesign.

SEO: disabled page noindex,follow; enabled page restores current meta. SSR pages
must remain represented in sitemap by explicit public route list if build-time
discovery loses them. Keep known development URLs listed if static sitemap is
retained: sitemap membership need not reflect instantaneous state, but response
robots must. Dynamic exact-state sitemap is optional future work.
Update seo-audit to inspect runtime HTML for SSR URLs rather than pretending
missing dist/*.html are valid. Preserve admin/lab exclusions and unique titles.

## 10. Admin layout and interaction specification

New `src/components/admin/AdminPagesPanel.astro`, scoped
`src/scripts/site-visibility-editor.js`. Add tab ID pages, hash /admin/#pages.
Update AdminNavigation active union and ALL three shell entry pages; no new
standalone duplicate admin app or second login/session.

Custom UI has no Figma node. Match Dark Arcane surfaces, Bluu Next heading700,
Manrope controls/body, clear contrast, strict NEW spacing8/16/24/32. Desktop
page list + selected-page detail; mobile stacked accordion/list with full labels,
no horizontal overflow. Main shell padding32px24px existing; rows padding16px,
panel gap24px. Don't touch unrelated panel geometry.

Each page row: label/path, saved effective status, accessible switch. Home shows
protected state. Detail: page switch, available section switches, inherited
status descriptions and Open page link. No ambiguous 'active' when parent off.

Switches edit a LOCAL draft. One explicit 'Simpan perubahan' commits all changed
flags; 'Batalkan perubahan' restores last confirmed config. Track dirty state,
show pending-change count, integrate existing shell isDirty(), preserve drafts
on temporary tab switch only if existing dirty guard permits. No network writes
on accidental toggle; no save-all that overwrites unseen fields.

On save: disable relevant mutation controls, aria-busy, existing-style spinner
and toast; no false success before server ack. On409 retain draft, show current
server config and conflict choices to reload or deliberately reapply, NEVER
silently overwrite. On uncertain timeout preserve exact requestId/body for
explicit retry; UUID changes only for a genuinely new request. Stale load
generations must not erase fresh draft/acknowledged revisions.

GET-first bootstrap through authorize returns csrf; use existing shared auth
login/logout/refresh, clear config/draft on401/403/logout. Keep-alive module
exports mount/getInstance/isDirty consistent with current shell. Guard duplicate
shell init; cleanup observers/listeners on remount. No new prewarm storm: pages
config at most one initial read per mount, first tab switch reuses mounted state.
Explicit Reload reads fresh config and guards dirty draft.

## 11. Proposed file map

| Area                        | Files                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan/kickoff                | this file, page-section-visibility-kickoff.md                                                                                                                 |
| Registry and offline config | src/data/site-visibility-registry.mjs, site-visibility-snapshot.json                                                                                          |
| Validation/policy           | server/site-visibility-contract.mjs                                                                                                                           |
| Runtime/admin handlers      | server/site-visibility.mjs, site-visibility-admin.mjs, api/admin/site-visibility.js                                                                           |
| DB                          | new additive supabase/migrations timestamp_site_visibility.sql                                                                                                |
| Admin                       | AdminPagesPanel.astro, site-visibility-editor.js, admin-shell.js, AdminNavigation.astro, all three admin entry pages                                          |
| Public                      | 6 primary page files, hods/[id].astro, recruitment/roles/[id].astro, recruitment/apply.astro, optional src/middleware.ts                                      |
| Navigation                  | ArcaneChamber, Hero, RecruitmentHero, DomainRail, AvailableRoles, RoleDetail, HoDSDetail, Cta, Recruitment, OurTeam, Navbar, Footer after complete href audit |
| Platform                    | astro.config.mjs, vercel.json only if the spike demonstrates routing need; SEO audit and runtime sitemap list                                                 |
| Tests                       | visibility contract/handler/DB tests, browser verifier, updated admin mocks and runtime SEO/visual verification                                               |

Names are proposed new files, not claims these modules already exist.

## 12. Ordered work packages for next AI

P0 read-only: read required handoff, git status/diffs, installed versions,
route/link inventory, existing original-page composition and current migrations.
Record baseline sources/screenshots. No secrets printed, no provider mutation.

P1 local architecture spike: fake config; SSR About; existing API/media route
coexistence; next-request updates; no-JS disabled page; client prefetch and Back
freshness. Measure TTFB added cost and cold request. Record pass/fail and decision.
Remove spike artifacts from product source when incorporating final implementation.

P2 registry/contract/offline config + additive SQL LOCAL. Ephemeral PostgreSQL
test seed/rerun/ACL/invalid input/atomicity/replay/conflict. No production apply.

P3 runtime and authenticated settings API. Test shared auth/CSRF/rotated cookie,
method/type/body/deadline/error contracts and no hook. Use injected fetch mocks.

P4 admin fourth tab. Verify once per panel and all three entry paths, dirty
guard, switching with no fetch repeat, logout and race cases.

P5 public integration: Home/projects first, validate and lock; then About,
HoF, Recruitment, Partners, Contact, then dependent detail/apply pages. Each
page/section gets a recorded layout/link/QA pass before moving to the next.
Retain latest On Development baseline and restore originals only when active.

P6 full local QA and reviewable release: source diff/schema/SQL hashes, no
secrets, all tests, SEO migration, runtime failure behavior, regression matrix.
Report exact remaining deployment prerequisites. No automatic commit/push.

P7 production only after concrete authorization: review additive SQL and backup
definitions/settings, apply once, verify catalog/ACL/default state read-only;
then owner instruction 'commit dan push' for concrete reviewed release, deploy
and verify exact SHA/alias READY. Existing static release continues serving
while SQL defaults are provisioned. New runtime must not deploy before DB exists.

P8 live acceptance, separately authorized concrete scope: read-only owner and
public checks first. Owner-confirmed first change home.projects=false; show
next fresh page/request has no Projects and no stale Explore link, no rebuild.
If using synthetic toggle/revert tests, approve exact IDs/state/restore scope;
never accidentally activate unfinished About/HoF to ordinary visitors. Record
live latency, no-hook proof, final config/revision, and no unrelated content write.

## 13. Required tests and evidence

Contract/DB: exact19page registry, independent sections, Home protection,
parent inheritance, missing/unknown/duplicate keys, nonboolean rejection,
bounded input, no-op, valid batch atomicity, stale revision, two concurrent
writers, exact timeout retry, sameUUID differentpayload, grant revoke, direct
table and wrapper role denials, seed rerun preserves owner state.

Admin: anonymous401/nonowner403, POST missing/wrong CSRF403, shared login and
refresh, rotated Set-Cookie propagated, global logout clears fourth panel;
slow GET, failed GET, read arriving after save, double-click save, dirty tab
guard, cancel restores saved state, conflict retaining draft, uncertain retry
uses sameUUID, tab prewarm one-read budget and all three shell entry paths.

Public at 320/390/768/1440/2560, reduce and normal: active baseline font/geometry,
inactive page background/title/filtered CTAs/no large footer, section absent
from response HTML and no gap, Home Projects off/on, every active destination
click, zero/one DomainRail/roles card, contextual Back fallback, missing hashes,
Astro swaps/refresh/history/bfcache, no-JS response, active/disabled child URLs,
unknown ID404, endpoint failures503 not stale exposure, no render script errors.

Runtime freshness test uses mutable in-process mock revision first (no real
write); next GET and prefetched/client navigation must change without rebuild.
Live test only after deployed runtime + authorized save: compare DB ack time,
response revision and raw HTML. Existing /api/cms/content revision is unrelated.

Commands (adapt endpoint/runtime preview for SSR; a Python dist-only server
cannot execute these future on-demand pages):

```sh
CMS_DATA_SOURCE=local npm run check
npm run format:check
CMS_DATA_SOURCE=local npm run build
npm run audit:spacing
npm run test:cms
npm run test:recruitment
node --test tests/site-visibility*.test.mjs
PREVIEW_URL=http://localhost:<owned-runtime-port> node scripts/verify-site-visibility.mjs
PREVIEW_URL=http://localhost:<owned-runtime-port> npm run audit:navbar
PREVIEW_URL=http://localhost:<owned-runtime-port> npm run verify:vt
PREVIEW_URL=http://localhost:<owned-runtime-port> node scripts/responsive-audit.mjs
npm run seo:audit
git diff --check
```

Add tests/scripts during implementation; don't report proposed commands as run.
Legacy About/HoF visual assertions must be made state-aware, preserving exact
active baseline assertions; don't delete strict checks to get a green run.
Static HTML parity target becomes normalized SSR response parity for enabled
pages excluding only justified registry metadata; public content must not drift.
Record .vercel/output SSR routing, function counts, credentials scan and schema
fingerprints. No claim of 24 static pages after opting pages into SSR.

## 14. Failure, rollback and completion

Partial migration/apply/deploy => stop dependent release; inspect state read-only,
never reseed blindly. Runtime visibility read failure =>503 no-store, not enabled
fallback. This trades availability for respecting owner hide decisions; owner
can choose a different failure policy explicitly before implementation.

Wrong flag => owner-authorized revision-guarded save restoring only affected
flags. Runtime code rollback => reviewed previous deployment may restore old
static visibility (including Projects), so state reconciliation is required
before rollback. Do not promise old static release honors new DB flags.
Keep additive tables/data on code rollback; no destructive automatic down SQL.

Done local means implementation, ordered QA, docs and reviewable diff complete.
Done live means applied+deployed+owner acceptance, next-request freshness and
no-rebuild proof, verified final flags and actual performance measured.
Until then label proposed/local/applied/deployed/accepted separately.

Non-negotiable: ZERO EMOTE, strict8point NEW spacing, existing fonts/buttons,
no unrelated redesign or CMS payload change, no secrets/PII, no commit/push
until exact instruction 'commit dan push'. Current session is documentation only.
