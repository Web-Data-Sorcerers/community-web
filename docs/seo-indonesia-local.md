# SEO Indonesia — Local Implementation & Verification Record

Date: 12 October 2026
Workspace: `/home/faiz/ds/ds5opencode`
Git Baseline: `79c60b8a973b4d68af7f140a7e2562711157d92e` (HEAD / origin/main)
Live Production: `dpl_8bqBc9EBRr7daNDikz5262YjRg3p` (READY, Node 22, sin1, 12 functions)
Live Visibility Revision: `b5cb65e9-cf25-4f07-9972-cc91b0843bc8`

---

## 1. Summary of Execution Scope

Owner authorized local execution of Packages 1–3 and preparation of concrete Package 4 Indonesian copy drafts for review:
1. **Package 1**: Canonical origin consistency, domain configuration, robots.txt, Open Graph, structured data identifiers, and legacy host redirects.
2. **Package 2**: Dynamic sitemap generated via SSR respecting Pages & Sections Visibility, eliminating static sitemap routing collisions, with fail-closed upstream handling and no fake `lastmod`.
3. **Package 3**: Recruitment campaign date alignment (12 Oct–12 Nov 2026), truth-in-advertising structured data (`JobPosting` on active roles only, `FAQPage` on visible recruitment only).
4. **Package 4**: Concrete Indonesian search-intent copy drafts prepared for owner review (Home, Recruitment, Roles, HoDS).
5. **Quality Assurance**: Complete local verification across Node 22 type-checking, Astro build, serverless function packaging, unit and integration test suites, and 24-route SEO audit.

No commit, push, deployment, live CMS, Supabase, Vercel, DNS, or Google Search Console actions were performed.

---

## 2. Package 1: Canonical, Domain, Robots, OG & Schema Consistency

### Implemented Changes
- **Single Source of Truth for URLs** (`src/data/site-url.mjs`):
  - Defined `DEFAULT_SITE_URL = 'https://community.data-sorcerers.com'`.
  - Defined `LEGACY_PUBLIC_HOST = 'data-sorcerers-community-sigma.vercel.app'`.
  - Exported `getSiteOrigin()`, `canonicalUrl(path, site)`, and `getLegacyHostRedirect(requestUrl)`.
  - Strips query parameters and hashes from canonical links.
  - Enforces consistent trailing slashes on directories and omits trailing slashes on file paths (e.g., `/sitemap.xml`).
- **Astro Config** (`astro.config.mjs`):
  - Configured `site: getSiteOrigin()`, resolving to `https://community.data-sorcerers.com` across builds and SSR runs.
- **BaseLayout** (`src/layouts/BaseLayout.astro`):
  - Standardized `<link rel="canonical">` to use `canonicalUrl()`.
  - Aligned Open Graph (`og:url`) to match canonical URL exactly.
  - Aligned schema.org entities: `@id: canonicalUrl('/#organization', site)` and `@id: canonicalUrl('/#website', site)`.
  - Updated `sameAs` to official profiles: `https://www.instagram.com/datasorcerers` and `https://www.linkedin.com/company/data-sorcerers`.
- **Public Pages**:
  - Refactored canonical and breadcrumb item construction across `src/pages/about.astro`, `src/pages/contact.astro`, `src/pages/hall-of-frames.astro`, `src/pages/partners.astro`, `src/pages/hods/[id].astro`, `src/pages/recruitment.astro`, `src/pages/recruitment/roles/[id].astro`, and `src/pages/recruitment/apply.astro`.
- **Host Redirect Middleware** (`src/middleware.ts`):
  - Added `getLegacyHostRedirect()` handler issuing HTTP 308 Permanent Redirects when requests arrive at `data-sorcerers-community-sigma.vercel.app`.
  - Preserves exact path and query strings.
  - Strictly exempts `/admin`, `/api`, and Astro internal `/_*` routes to avoid breaking administrative sessions, API calls, or asset pipelines.

---

## 3. Package 2: Dynamic Sitemap Following Pages & Sections Visibility

### Implemented Changes
- **Elimination of Route Collision**:
  - Removed static `@astrojs/sitemap` integration from `astro.config.mjs`, resolving conflicts between static build files and runtime SSR endpoints.
- **Dynamic Sitemap Engine** (`server/sitemap.mjs`):
  - Implemented `buildSitemapXml(urls)` and `buildSitemapIndexXml(entries)`.
  - Implemented `handleSitemapRequest()` and `handleSitemapIndexRequest()`.
  - Queries `loadSiteVisibility()` once per request with zero shared caching (strictly adhering to no-store fresh visibility requirements).
  - Evaluates effective visibility: excludes disabled pages (`about`, `hall-of-frames`, `partners`, etc.) and parent-disabled child routes.
  - Excludes non-public routes (`/admin`, `/api`, `/lab`, `/chamber/`).
  - Omits unverified/synthetic `<lastmod>` timestamps to comply with Google Search Central guidelines.
  - Fails closed with HTTP 503 if upstream visibility data cannot be retrieved.
- **SSR Sitemap Endpoints**:
  - `src/pages/sitemap.xml.ts`: Dynamic sitemap listing active indexable pages.
  - `src/pages/sitemap-index.xml.ts`: Dynamic sitemap index.
  - `src/pages/sitemap-0.xml.ts`: Dynamic shard referenced by index.
- **Robots.txt** (`src/pages/robots.txt.ts`):
  - Emits canonical sitemap references:
    - `Sitemap: https://community.data-sorcerers.com/sitemap.xml`
    - `Sitemap: https://community.data-sorcerers.com/sitemap-index.xml`
  - Maintains `Disallow: /admin/` and `Disallow: /api/`.

---

## 4. Package 3: Recruitment Dates & Truthful Structured Data

### Implemented Changes
- **Unified Campaign Source** (`src/data/recruitment-campaign.mjs` and `src/data/recruitment-campaign.ts`):
  - Single source of truth for campaign metadata:
    - `startDate: '2026-10-12'`
    - `endDate: '2026-11-12'`
    - `datePosted: '2026-10-01'` (original announcement date preserved; no synthetic refreshing)
    - `deadlineText: 'Deadline: 12 November 2026'`
- **Role Data & Timeline Sync**:
  - Updated `src/data/roles.ts` to overlay `deadline: RECRUITMENT_CAMPAIGN.deadlineText`, synchronizing role cards with the poster timeline.
  - Updated `src/components/SelectionTimeline.astro` to consume dates and labels directly from `RECRUITMENT_CAMPAIGN`.
- **Truthful Role Schema** (`src/pages/recruitment/roles/[id].astro`):
  - Set `validThrough: '2026-11-12T23:59:59+07:00'`.
  - Set `employmentType: 'VOLUNTEER'`.
  - Set `jobLocationType: 'TELECOMMUTE'` with applicant location requirement set to Indonesia (`ID`).
  - Gated schema emission: `JobPosting` structured data is emitted only when both `recruitment` and the specific role page are enabled in visibility. When disabled, only the breadcrumb list schema is emitted.
- **Truthful FAQ Schema** (`src/pages/recruitment.astro`):
  - Gated schema emission: `FAQPage` structured data is emitted only when `recruitment` and the `faq` section are both visible.

---

## 5. Package 4: Indonesian Copy Drafts (Prepared for Owner Review)

The following copy proposals are prepared to capture search intent for "komunitas AI dan data di Indonesia" without altering the Figma visual identity, approved magical slogans ("Sorcery In Data, Magic In AI"), or the 8-point layout grid.

### Search Intent & Keyword Architecture
- **Primary Keywords**:
  - `komunitas AI Indonesia`
  - `komunitas data science Indonesia`
  - `komunitas AI dan data di Indonesia`
- **Secondary / Supporting Keywords**:
  - `komunitas machine learning Indonesia`
  - `belajar AI dan data science`
  - `riset dan proyek AI mahasiswa`
  - `open recruitment komunitas AI 2026`

---

### Page-by-Page Copy Drafts

#### 1. Home Page (`/`)
- **Search Intent**: Informational / Navigational — users looking for an active AI and data community in Indonesia to learn, collaborate, and build projects.
- **Current Title**: `Data Sorcerers — AI & Data Innovation Community` (48 chars)
- **Draft Title**: `Data Sorcerers | Komunitas AI dan Data di Indonesia` (49 chars)
- **Current Description**: `An AI & Data Innovation Community where students, researchers, and engineers learn, experiment, and build meaningful technology together.` (138 chars)
- **Draft Description**: `Komunitas AI dan data di Indonesia untuk belajar, riset, eksperimen, dan membangun proyek teknologi bersama. Jelajahi domain inovasi dan cara bergabung.` (154 chars)
- **Hero Visible Supporting Copy Proposal**:
  - *Current*: "An AI & Data Innovation Community where people learn, experiment, research, and build meaningful technology together."
  - *Proposed Option A (Bilingual / Recommended)*: Retain English hero slogan & subtitle for international brand identity, add localized introductory paragraph in Philosophy / What We Do sections.
  - *Proposed Option B (Indonesian Subtitle)*: "Komunitas inovasi AI dan data di Indonesia tempat mahasiswa, peneliti, dan praktisi belajar, bereksperimen, dan berkarya bersama."
- **Four Pillars Indonesian Subtitle**:
  - "Empat Pilar Inovasi: Belajar terstruktur, eksperimen ide, riset aplikatif, dan pengembangan solusi AI nyata."

#### 2. Recruitment Page (`/recruitment/`)
- **Search Intent**: Commercial Investigation / Transactional — individuals seeking to join an Indonesian AI community, looking for timelines, requirements, and available roles.
- **Current Title**: `Open Recruitment — Data Sorcerers Community` (42 chars)
- **Draft Title**: `Open Recruitment Komunitas AI 2026 | Data Sorcerers` (49 chars)
- **Current Description**: `Join Data Sorcerers AI community. Explore open roles across Data Intelligence, Core AI, NLP & Reasoning, Computer Vision, Product, and Growth.` (145 chars)
- **Draft Description**: `Pendaftaran terbuka Data Sorcerers 2026. Bergabung dengan komunitas AI dan data di Indonesia melalui peran teknis, produk, dan manajemen komunitas.` (148 chars)
- **Recruitment Hero Supporting Copy Proposal**:
  - *Draft Subtitle*: "Mulai babak barumu bersama Data Sorcerers. Salurkan rasa ingin tahu menjadi kapabilitas nyata melalui riset, eksperimen, dan proyek kolaboratif."
- **Eligibility & Volunteer Notice Proposal**:
  - "Keanggotaan bersifat kerelawanan (volunteer) dengan komitmen kontribusi aktif. Terbuka bagi talenta yang memiliki fondasi dasar dan siap berkolaborasi dalam ekosistem riset serta produk AI."

#### 3. Available Role Pages (`/recruitment/roles/[id]`)
- **Search Intent**: Detail evaluation — understanding specific domain expectations, skill requirements, and deliverables.
- **Title Pattern**: `{Role Title} — Open Recruitment | Data Sorcerers`
- **Description Pattern**: `Lowongan relawan {Role Title} di Data Sorcerers Indonesia. Periode pendaftaran 12 Oktober – 12 November 2026. Pelajari kualifikasi dan tanggung jawab peran.` (160 chars)

#### 4. HoDS Domain Pages (`/hods/[id]`)
- **Search Intent**: Deep exploration of research tracks (Core AI, NLP, Computer Vision, Data Intelligence).
- **Title Pattern**: `{Domain Title} — Divisi AI Data Sorcerers Indonesia`
- **Description Pattern**: `Fokus riset, studi teknologi, dan proyek kolaboratif divisi {Domain Title} di komunitas Data Sorcerers Indonesia.`

---

### Indexing Policy & Metadata Implementation: `/recruitment/apply`, Home, Recruitment, Contact
- **Decision Executed**: Owner approved Option 1 (`noindex, follow` on `/recruitment/apply`).
- **Implementation**:
  - `src/layouts/BaseLayout.astro`: Added `robots` prop support.
  - `src/pages/recruitment/apply.astro`: Set `robots="noindex, follow"`.
  - `server/sitemap.mjs`: Excluded `recruitment-apply` from dynamic XML sitemap to prevent `noindex` collision.
  - `src/pages/index.astro`: Updated title to `Data Sorcerers | Komunitas AI dan Data di Indonesia` and description.
  - `src/pages/recruitment.astro`: Updated title to `Open Recruitment Komunitas AI 2026 | Data Sorcerers` and description.
  - `src/pages/contact.astro`: Updated description for Indonesian AI community search intent.

---

## 6. Verification and Quality Assurance Evidence

### 1. Static Type Checking (`npm run check`)
- Command: `npm run check`
- Result: **0 errors, 0 warnings across 367 files** (40 hints).

### 2. Astro Production Build (`npx astro build`)
- Command: `npx astro build`
- Result: Server built cleanly in 4.24 seconds with `@astrojs/vercel` serverless adapter.

### 3. Vercel Function Architecture (`scripts/verify-navigation-package.mjs`)
- Command: `node scripts/verify-navigation-package.mjs`
- Verification Output:
  - Total Serverless Functions: **12 functions** (budget exact: 11 root API routes + 1 SSR `_render.func`).
  - Node.js Runtime: `nodejs22.x`.
  - Deployment Region: `sin1` (Singapore).

### 4. Sitemap & Visibility Tests (`tests/seo-sitemap-visibility.test.mjs`)
- Command: `node --test tests/seo-sitemap-visibility.test.mjs`
- Result: **5/5 PASS** (201.97ms duration).
  - `canonicalUrl generates consistent query-free canonicals matching registry` PASS
  - `sitemap reflects visibility state: disabled and parent-disabled pages excluded` PASS
  - `sitemap handlers return valid XML with no-store headers and fail closed on upstream error` PASS
  - `campaign dates are unified across RECRUITMENT_CAMPAIGN and roles` PASS
  - `legacy host redirect preserves query and path but excludes admin/api/preview` PASS

### 5. Site Visibility Integration Tests (`tests/site-visibility*.test.mjs`)
- Command: `node --test tests/site-visibility*.test.mjs`
- Result: **10/10 PASS** (5247.84ms duration).
  - All permission, CSRF, origin check, inheritance, and timeout tests pass.

### 6. Recruitment Tests (`npm run test:recruitment`)
- Command: `npm run test:recruitment`
- Result: **42/42 PASS**.

### 7. End-to-End SEO Audit (`scripts/seo-audit.mjs`)
- Executed against local preview instance (`PREVIEW_URL=http://127.0.0.1:4372 node scripts/seo-audit.mjs`).
- Result: **All 24 pages tested: 0 failures**.
  - All canonical URLs resolve to origin `https://community.data-sorcerers.com`.
  - `robots.txt` points to canonical `sitemap.xml` and `sitemap-index.xml`.
  - `sitemap.xml` returns HTTP 200 with valid XML and no disabled chambers.
  - Structured data (`Organization`, `WebSite`, `BreadcrumbList`, `FAQPage`, `JobPosting`) verified.

---

## 7. Next Actions & Owner Decision Points

1. **Review Package 4 Copy Proposals**:
   - Approve Title & Meta Description changes for Home and Recruitment.
   - Choose between Bilingual Hero (Option A) or localized subtitle (Option B).
   - Decide on `/recruitment/apply` indexing status (`noindex, follow` vs indexable).
2. **Release Authorization**:
   - When owner approves the changes and copy, issue explicit "commit dan push" instruction.
3. **Deferred Post-Release Actions (Packages 5 & 6)**:
   - Google Search Console sitemap submission and URL inspection under `https://community.data-sorcerers.com`.
   - Core Web Vitals field monitoring.
   - Weekly editorial publishing of verified member projects.
