# Navigation follow-up — plan and local execution, 12 October 2026

## Release authorization

Owner approved local preview and explicitly authorized “commit dan push”. One
scoped main commit/push includes the CSS manifest integration/warmer, BaseLayout
import, request timing, local static-cache parity, two asset verifiers and related
plan/fullscreen notes. Connected deployment and read-only live acceptance follow.
Unrelated dirty documents/reference PNGs stay local; no CMS, SQL, visibility save
or provider setting changes. Production SHA/acceptance will be recorded locally
after this push; no second documentation commit/push is implied.

Owner authorized detailed planning and local execution after recruitment release
d82e327. No new commit/push/deploy, CMS saves, provider changes or SQL. Preserve
all existing dirty documents and reference artwork.

## Baseline and work order

Released: sin1, fresh no-store visibility, instant transition:none, CTA press
feedback. Viewport HTML prefetch was rejected previously; no10–15s config/SWR
cache is compatible with the next-fresh-request contract.

1. Measure live browser navigation with HTTP caching enabled:390/1440, both
   motion modes,20 samples each. Public navigation only, no form submissions.
   Track HTML, CSS, preparation/swap, two-frame destination, tasks/errors,
   request methods and revision. Cold browser is not a cold function guarantee.
2. Address measured first-route CSS waterfall. Generate a small public manifest
   from Astro's built SSR route styles, never hardcode asset hashes or request
   destination HTML to discover styles. Warm CSS for current Navbar destinations
   only after load/idle, sequentially and at low priority. Cap unique assets6;
   skip hidden tab, Save-Data and2g connections. Preserve Astro's normal loader
   for rapid clicks before warming, failures and deployment version changes.
   No hero/video/JS/private/admin warming; CSS preloads do not apply styles.
3. Add Server-Timing for visibility load and SSR response creation. Request-only
   measurements, no config values/secrets/URLs, no telemetry uploads. Preserve
   all no-store headers, validation, fail-closed behavior and fresh saves.
4. Compare local before/after cache-enabled first visits and repeats, including
   controlled network latency. Check real CSS reuse and total bytes, no speculative
   HTML/private requests, visibility fixture next-request freshness, rapid
   supersede/Back/hash/errors, reduced motion, warm Navbar and immediate CTA.
   Retain only changes with demonstrated benefit and bounded extra traffic.

No UI section is redesigned; Figma geometry,8-point spacing, Bluu Next/Manrope,
assets, card lines and animation tokens remain. Infrastructure scope: Astro build
integration, BaseLayout script import, separate idle asset warmer, middleware
timing and targeted QA. Local check/build/format/spacing and existing navigation,
visibility, package verifiers must pass as appropriate. Scope ends at a reviewable
local candidate; production performance after these changes remains unmeasured.

## Live baseline

80 samples: aggregate median261.9ms/p95441.9ms, range136.8–624.7ms.
Per condition20 samples:390 normal276.75/592.7;390 reduce254.2/315.9;
1440 normal272.8/417.1;1440 reduce247.3/317.0 (median/p95 milliseconds).
Median HTML response114ms; first destinations introduced CSS fetches59–368ms.
No pending leaks, overflow, non-GET/HEAD requests or browser errors. Browser
HTTP cache was enabled; no Playwright request interception. Agent-host Chromium,
network and uncontrolled server warmth included. Evidence:
artifacts/navigation-next/live-baseline/{timing,summary}.json.

References: installed Astro7.3.3 router waits for destination stylesheets before
swap; [Astro lifecycle](https://docs.astro.build/en/reference/modules/astro-transitions/).
[Server-Timing](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Server-Timing)
exposes request duration measurements to browser resource timing.

## Completed local implementation and verification

Astro hook generates navigation-styles.json with6 public Navbar routes. Hashes
come from built route metadata; all CSS URLs resolve to actual build assets.
Manifest transport revalidates once per router context; failures resolve to no
hints. CSS preloads run sequentially at idle, low priority, max6 unique files,
5s bounded transport, no scripts/images/HTML/private APIs. Existing styles are
skipped. Idle work stops starting assets during active navigation or hidden tab;
Save-Data and2g skip. Astro remains responsible for fresh HTML and normal fallback.

Server-Timing includes visibility load (including parsing/validation) and response
creation, not full streamed-body completion. Failed visibility still returns503
with no-store. No endpoint URLs, secrets or saved values are included.

Initial local harness had no cache policy for hashed assets; corrected only
/_astro to Vercel's observed public,max-age=31536000,immutable. SSR remains
no-store. Early exploratory timing without this correction is retained separately
and is not the acceptance comparison.

Final controlled comparison: four fresh contexts (390/1440, warming disabled or
enabled), reduced motion, CDP latency80ms/downstream250000bytes/s,3s idle before
activation;28 navigations total,10 first destinations in each variant. CSS
network transfers on warmed first destinations:0; baseline first CSS took
108–268ms. Five additional CSS assets were loaded during idle in this fixture.
Local harness transfers uncompressed bodies and uses synthetic visibility; this
is CSS-reuse evidence, not production speedup or device/Safari acceptance.
Driver activation-to-frame values include Playwright action overhead; do not
compare them with the live click-event baseline. Cache-disabled explorations and
final cache-enabled comparison are separate logs.

Guards PASS: Save-Data/2g make no manifest request; manifest503/null/hostile URLs
do not block navigation or request HTML/private/external destinations.
Node22 check/build0errors0warnings, visibility10 tests, public visibility28,
UX15 delayed/race/failure cases, VT history/hash/deep-link/errors, package12
functions/Node22/sin1 config, speculative controlled HTML0, spacing40 PASS.
Final snappy24 navigations verify no fade and first-frame CTA feedback.
Production remains d82e327; no release or production writes.

Artifacts: artifacts/navigation-next/live-baseline/ and local/.
Reproduce asset checks with scripts/verify-navigation-assets.mjs and
scripts/verify-navigation-asset-guards.mjs against local4364. Generated server:
CMS_DATA_SOURCE=local npm run build under Node22; PORT4364,
SITE_VISIBILITY_SOURCE=local,SITE_VISIBILITY_FILE=/tmp/ds-recruitment-followup-visibility.json,
node scripts/serve-site-visibility.mjs. Preview fixture is separate from production.
