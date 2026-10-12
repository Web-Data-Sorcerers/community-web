# SEO plan — Indonesian AI and data community, 12 October 2026

Next AI handoff and local-execution prompt: [seo-indonesia-next-ai-kickoff.md](seo-indonesia-next-ai-kickoff.md).

Status: PLAN ONLY. Owner selected “Komunitas AI dan data di Indonesia”.
Baseline released SHA79c60b8a973b4d68af7f140a7e2562711157d92e.
This pass performs read-only public GETs and source review, plus documentation.
No application changes, build, provider changes, Search Console submission,
CMS/visibility writes, commit, push or deployment.
Evidence: artifacts/seo-plan/live.json. Nineteen registered public routes read.
Revision b5cb65e9-cf25-4f07-9972-cc91b0843bc8; actual observed flags supersede
historical notes: About/HoF/Partners noindex; Contact indexable. Never reset flags.

## Goal and baseline

Primary goal: attract people looking for an AI/data community in Indonesia, then
help suitable people understand the community and recruitment. Brand queries
remain a secondary baseline. Search demand/volume/rankings are not measured.
No Search Console account reports or actual Google-selected canonicals accessed.
Missing HTML verification tag does not establish lack of DNS verification.

Existing foundation: SSR page content, unique titles/descriptions, canonical,
OG/Twitter metadata, Organization/WebSite/Breadcrumb structured data, robots and
sitemap.19routesHTTP200, 16 currently indexable and3 intentional noindex.
Lab sound is noindex,nofollow; an unknown route returns404.
Presence checks passing do not prove rankings, schema eligibility or indexing.

Confirmed issues:

1. All19 canonical URLs, base entity URLs, robots sitemap declaration and sitemap
   locations point to data-sorcerers-community-sigma.vercel.app, even when served
   from community.data-sorcerers.com. Both HTTPS origins serve200 rather than
   redirecting the old public origin. HTTP custom origin correctly308s to HTTPS.
2. Build-generated sitemap lists all19 URLs including About/HoF/Partners, which
   currently intentionally return noindex. Visibility changes do not rebuild it.
3. Six role schemas carry datePosted2026-10-01, validThrough2026-10-20. Observed
   data-role page also says “Deadline: 20 Oktober 2026”. SelectionTimeline uses
   owner poster dates12Oct–12Nov2026. Visible content and metadata disagree.
4. Home metadata and most public prose are English; Home H1 is the brand slogan.
   These are not syntax errors, but do not clearly address the selected Indonesian
   search intent. Content strategy needed, not just keyword insertion.
5. FAQPage is emitted independently of the FAQ section's visibility; JobPosting
   independently of enabled role composition. Suppressed content must not remain
   asserted as page content in schema. FAQ Google rich result is deprecated2026.
6. Existing SEO script accepts whichever canonical origin it sees first; it can
   pass when every page consistently targets the wrong domain. It does not
   prove sitemap/indexability or schema date/content agreement.

## Package 1 — canonical origin and crawl consistency

Deliverables:
- Use community.data-sorcerers.com as the production public canonical origin,
  including Astro site, fallback URLs, canonical, OG, entity IDs/URLs, breadcrumbs,
  robots and sitemap. Check whether SITE_URL is registered before adjusting env;
  do not claim a code default fix overrides a deployed env value.
- One URL builder based on registry paths; consistent slash policy, query-free
  canonicals for equivalent role/application queries. Preserve query parameters
  in redirects (including recruitment links); no path migration in this package.
- Plan permanent redirects of obsolete public Vercel-alias pages to corresponding
  custom-host pages. Limit exact known public host/path combinations; avoid
  redirecting preview deployments, localhost, admin or API endpoints and breaking
  Auth/Origin/CSRF. Provider settings need their own scoped review before mutation.
- Strengthen SEO audit with explicit expected origin, registry path and actual
  canonical/OG/schema agreement instead of first-seen-origin inference.

Acceptance: canonical/OG/entity links on all19 public routes use expected custom
origin, old public links preserve paths/query and avoid loops, previews work,
admin/API/Auth remain unchanged, unknown404 remains404. No DNS migration needed.

## Package 2 — fresh indexability and sitemap

Deliverables:
- Serve a sitemap from existing SSR routing using one validated fresh visibility
  load and code-owned route registry. Exclude pages effectively disabled by parent
  inheritance, admin/lab/API and noncanonical variants. Stay within12function
  packaging; no extra standalone function without proving budget.
- Keep sitemap index/robots aligned with the selected custom domain. If replacing
  the static sitemap route, remove/disable the matching generated file and verify
  routing/headers in the actual Vercel package; do not leave two competing routes.
- Preserve no-store/fresh visibility semantics, return503 on a loader failure
  instead of an empty-success sitemap or silently cached obsolete flags.
- Do not fabricate lastmod on every request. Omit unless a real content-update
  timestamp is available. Sections removed by visibility stay absent in SSR.
- Recommend noindex,follow on the transactional application form and omit it from
  sitemap, keeping discovery via recruitment/role landing pages. This is a product
  choice to review, not a claim that an application form must never be indexed.
- Keep the existing noindex chamber on disabled routes and lab/admin protection.
  Do not block pages in robots merely to prevent indexing: crawler must see noindex.

Acceptance: sitemap only contains canonical indexable routes and XML200; fixture
ON/OFF/parent cases update on next fresh request, revision/failure behavior PASS,
no production toggles for QA. Candidate list is currently16indexable URLs, or15
if the proposed application noindex choice is adopted. No automatic flag changes.

## Package 3 — truthful structured data and recruitment dates

Deliverables:
- Share the owner-approved campaign start/end between timeline, role deadline and
  role schema. The CMS snapshot is rebuilt from remote content: editing generated
  snapshot dates alone is not durable. Use an explicit campaign source/helper or
  separately approved CMS correction, preserving existing CMS schema/contracts.
- End date12Nov2026; do not invent an exact closing hour. datePosted must be the
  actual first publication date, not automatically campaign start/current date.
- Determine whether these are genuine volunteer opportunities eligible for
  JobPosting. VOLUNTEER is supported; community membership is not automatically
  equivalent to a job. Confirm responsibilities, work arrangement and geography.
  TELECOMMUTE must reflect actual remote terms; do not relabel hybrid as100%remote.
- Emit JobPosting only on visible, eligible individual role pages and govern
  expired/closed opportunities with truthful status/validThrough or schema removal;
  do not reset expired dates merely to look fresh. Recruitment intake flag and
  visibility remain distinct systems, with no automatic cross-mutation.
- Conditional FAQ schema only if corresponding visible Q&A exists; retain useful
  FAQ UI. No promised FAQ expanded search result: Google deprecated itMay2026.
- Stable Organization/WebSite @id, consistent organization description and official
  Instagram/LinkedIn sameAs plus actual logo/contact. No fabricated address,
  ratings, salary, authors, LocalBusiness or awards.

Acceptance: parseable schema, Rich Results Test for supported relevant types,
UI/schema date and content agreement, no hidden JobPosting/FAQ assertions in
fixture disabled cases; recruitment backend untouched. Syntax success alone
is not eligibility or guaranteed display in Search.

## Package 4 — Indonesian search-intent content

Keyword candidates, hypotheses only (no search-volume estimates):
- Main: komunitas AI Indonesia; komunitas data science Indonesia.
- Supporting: komunitas machine learning; komunitas riset AI; kolaborasi proyek AI.
- Recruitment: open recruitment komunitas AI; bergabung komunitas data science.

Suggested mapping:
- Home: one authoritative overview of the community, who it serves, what members
  do, domains and how to join. Proposed title “Data Sorcerers | Komunitas AI dan
  Data di Indonesia”. Proposed description: “Komunitas AI dan data di Indonesia
  untuk belajar, bereksperimen, riset, dan membangun proyek bersama. Kenali bidang
  kami dan cara bergabung dengan Data Sorcerers.” Validate actual claims/copy.
- Add clear visible Indonesian supporting prose while preserving approved slogan,
  magical direction and 8point spacing. Do not add hidden keyword blocks or force
  redesign of the Figma H1. Align substantial visible content with metadata.
- Recruitment: Indonesian explanation of eligibility, roles, volunteer conditions,
 12Oct–12Nov2026 campaign and selection. Suggested title “Open Recruitment
  Komunitas AI 2026 | Data Sorcerers”. Describe who is eligible accurately;
  community is not a beginner course according to existing agreement.
- HoDS domain pages: explain what teams study/build, tools and real outcomes.
  Role pages: qualifications and contribution commitments. Distinct purposes,
  not two versions of the same keyword-stuffed page.
- About/team/project credibility when owner actually enables those pages/sections;
  no automatic unhide. Verified team/work examples, consent and real external links.
- If bilingual international access is required later, use substantive separate
  /id/ and /en/ versions with reciprocal hreflang/self-canonicals. Do not invent
  translation URLs or switch language based on browser headers. A full bilingual
  routing migration is deferred, not required for the first Indonesia package.
- Apply Indonesian lang only to genuinely Indonesian content; metadata language
  and OG locale should align. Google infers language primarily from visible prose.
- Review meaningful image alt text; decorative artwork can keep empty alt.

Acceptance: understandable visible copy, unique intent/title/description per page,
correct language semantics, preserved desktop/mobile typography/tokens/CTA routes.
No fixed character count guarantee or unnecessary meta keywords tag.

## Package 5 — measurement and real mobile experience

- Review Search Console ownership first; domain verification may already exist
  despite missing HTML tag. Domain property data-sorcerers.com or URL-prefix
  https://community.data-sorcerers.com depending access. DNS/meta/provider
  verification changes are a separate authorized action.
- After release: submit canonical sitemap and inspect Home/recruitment/a role,
  requested versus Google-selected canonical, discovery/indexing exclusions,
  impressions/clicks/CTR/query mix. No search-engine indexing/ranking guarantee.
- Weekly compare branded and nonbranded Indonesian queries, indexed landing pages
  and suitable recruitment conversions. Avoid interpreting site: searches as a
  complete index report or lab SEO scores as actual ranking performance.
- Core Web Vitals goals from Google: LCP<=2.5s, INP<200ms, CLS<0.1; validate field
  distributions where available. Small/new origins may have insufficient CrUX data.
- Mobile optimizations were just released; lab startup long tasks are not field
  INP. Measure production LCP/CLS with and without the owner-required splash,
  actual phones/WhatsApp browsers and cold loads. Propose splash-duration changes
  only from evidence and owner UX approval. Preserve HD hero and audio intent.
- Any conversion analytics should record aggregate event outcomes, never form
  answers/contact/receipt identifiers. No analytics service installed in this plan.

## Package 6 — credible ongoing publishing

After technical/copy baseline, publish one verified useful item per week initially:
real project writeups, experiments/benchmarks with reproducible evidence, or a
community collaboration/learning pathway. Prefer first-party real work over
mass-produced generic AI articles. Named consenting authors, date, sources,
clear outcome, relevant internal links and useful accessible images.

First candidates: what projects Data Sorcerers members build; how its domain teams
collaborate; joining requirements and contribution examples. Do not invent
projects, member achievements or comparison metrics just to fill pages.

Build real referrals from official profiles, consenting campus/community/partner
pages and published repositories; do not buy links or contact others in this
planning pass. Topic competition and traffic potential require future keyword/GSC
research, not fabricated volume estimates.

## Work order, boundaries and completion

1. Review canonical/indexing and campaign-source decisions.
2. Locally implement packages1–3 and corresponding semantic SEO regression checks.
3. Review visible Indonesian copy; locally implement package4 with responsive QA.
4. Scoped owner release instruction before commit/push/deployment. Provider/DNS,
   Search Console submissions and CMS/live edits explicitly identified separately.
5. Measure after release; package6 is ongoing editorial work, not a one-time SEO fix.

Validation: Node22 check/build, expected-origin/sitemap/schema audit, visibility
and recruitment tests as touched, packaged12function check if sitemap changes,
SSR with JS disabled for text/link discovery, mobile spacing/overflow/splash/VT,
noindex/admin/Auth invariants. Use fixtures/mocked application writes only.
Preserve all existing dirty documents/assets and released mobile improvements.
Do not use stale HTML/visibility caching to improve an SEO score.

Success: correct chosen public domain, consistent dates/truthful schema, fresh
indexability, clearer Indonesian landing content and measured organic discovery.
Not a promised first page, fixed score100 or guaranteed rich result.

## Primary references checked during this pass

- Canonical/redirect consistency: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Sitemap canonicals: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Schema relevance: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- JobPosting dates/volunteer/work terms: https://developers.google.com/search/docs/appearance/structured-data/job-posting
- FAQ deprecationMay7,2026: https://developers.google.com/search/updates
- Language/visible content: https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
- Core Web Vitals: https://developers.google.com/search/docs/appearance/core-web-vitals
