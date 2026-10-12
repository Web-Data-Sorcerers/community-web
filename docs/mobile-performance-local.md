# Mobile performance — local implementation, 12 October 2026

Owner continued after the detailed investigation with “okee terus”. Local
optimization and QA were authorized. Owner subsequently requested “commit dan
push” for these optimizations and the responsive recruitment confirmation.
Release record: [mobile-performance-release.md](mobile-performance-release.md).
Baseline HEAD/remote is `a397373db83333b5edf0c1e98a40ac004bbd3e1a`.
[Investigation and work packages](mobile-performance-investigation-plan.md)
remain historical baseline evidence; this record supersedes their PLAN ONLY
status for this local work.

## Implemented scope

### Audio preparation and background behavior

- `sound-ambient.ts`: cache PeriodicWave per harmonic instrument in its own
  context, assemble the offline graph in roughly 4 ms batches, and yield between
  impulse-generation batches. Waltz uses 3 PeriodicWave constructions instead
  of 128; the score, tempo, gains, stereo pan and 54-second loop stay intact.
- Render 12 seconds of previous-cycle material plus the complete loop, rather
  than two full cycles. The present envelope/reverb tails fit within that window.
  Waltz preparation becomes 66 rather than 108 seconds of audio, with 264 rather
  than 458 scheduled oscillators. Future longer envelopes must revisit preroll
  and repeat PCM/seam validation.
- Live SFX reverb initialization also yields while filling its impulse. Early
  cues play immediately rather than wait for that impulse; reverb sends become
  available once preparation finishes. Splash's existing direct ritual bed and
  glass accents retain their scheduling.
- `sound.ts`: suspend the live AudioContext when hidden and resume the same
  context/source when returning. Only contexts suspended by our visibility
  handler are automatically resumed; autoplay blocking keeps the real-gesture
  fallback. Pending-render/profile generation guards remain.
- No downloaded audio, dependencies, speaker orb or stored mute preference added.

### Mobile motion

- `Motion.astro` selects a small `motion-mobile.ts` module for widths <=767 px
  or coarse pointers, including touch tablets. Desktop loads its original GSAP
  module dynamically; reduced motion skips both modules.
- Mobile uses IntersectionObserver on individual entrance elements and short
  200 ms native animations. No hero parallax or magnetic/pointer effects.
- CSS freezes continuous Philosophy, What We Do, Starfield, role-glow and CTA
  decoration on mobile/coarse input. Static artwork, gradients, card separators
  and the short View Details gradient/interaction remain.
- Static star layers use inset 0 rather than the oversized drift area. Mobile
  no longer promotes these inactive decorations with will-change.
- Generation checks, observer/animation cleanup and timeout cleanup protect
  Astro swaps and media-query changes. Existing desktop motion is retained.
- Observed motion JS decoded payload: approximately 119,728 -> 2,928 bytes on
  the mobile test route, including its small loader and mobile module.

### Home splash

- Mobile canvas 504x284 and fog texture 64x48; desktop retains 1008x568/256x192.
- Mobile paints the soft mist once, with 6 banks, 4 strands/48 subdivisions and
  20 motes. Desktop keeps its animated 12 banks/16 strands/96 subdivisions/68 motes.
- Detailed SVG rings/runes remain visible but static on mobile. One small HTML
  gradient arc rotates instead of animating many SVG groups; will-change is
  limited to that short-lived rotating arc.
- The progress circle is isolated in its own SVG so updating it does not change
  the detailed seal's SVG tree. Mobile progress paints at most roughly 16 times
  per second and omits its live drop-shadow; geometry, color and completion remain.
- Stop/visibility cleanup is explicit. No splash extension to wait for audio.
  Owner's refresh-Home-only replay, non-Home bypass, reduced motion and hash
  restoration remain, with the original 3s/6s deadlines and leaving behavior.

## Measured comparison

Evidence: `artifacts/mobile-performance-local/metadata.json`, `controlled.json`,
`summary.json`, `audio-parity.json`, `cold.json` and their probe scripts/logs.

An isolated archive of release a397373 was built using Node 22 and the same
installed dependency versions. Both servers use the same existing local
visibility fixture, without changing it. Baseline/candidate ports 4371/4370.
Three alternating before/after pairs, separate fresh browser contexts, viewport
390x844, DPR3, touch, CPU4x, allowed-audio test policy, loopback network. Scroll
phases run approximately 1500 ms each; no other agent browser suite runs during
the controlled performance benchmark. User/background applications are not
isolated. Do not compare these timings directly with live-network measurements.

| Controlled local measurement                            | Baseline              | Candidate       |
| ------------------------------------------------------- | --------------------- | --------------- |
| Median longest startup task, session already saw splash | 1219 ms               | 81 ms           |
| Individual longest startup tasks                        | 1232 / 1219 / 1012 ms | 92 / 77 / 81 ms |
| Median offline render elapsed                           | 12.68 s               | 3.47 s          |
| Scheduled Waltz oscillators / PeriodicWave              | 458 / 128             | 264 / 3         |
| Median scroll TaskDuration, Philosophy                  | 1059.9 ms             | 309.0 ms        |
| Median scroll TaskDuration, What We Do                  | 1144.3 ms             | 267.6 ms        |
| Median scroll TaskDuration, Footer                      | 453.0 ms              | 220.2 ms        |

These comparisons demonstrate substantially less startup/main-thread work.
They are not field INP, real-device FPS, network navigation timing or a universal
percentage improvement. The steady-scroll benchmark was recorded after audio/
mobile-motion changes and before subsequent refinements isolated to the splash.
The final splash is measured separately in `cold.json`.

Calculated stereo Float32 PCM allocation for Waltz:

- Render buffer: 19.78 -> 12.08 MiB.
- Retained complete loop: still 9.89 MiB.
- Render plus copied loop coexistence: 29.66 -> 21.97 MiB, excluding graph,
  impulse, engine and browser overhead. These are calculated sizes, not measured
  whole-browser/device memory. No memory-leak-free certification is claimed.

PCM comparison against the original module at release HEAD:

| Preset  | Duration unchanged | Maximum absolute sample difference |
| ------- | ------------------ | ---------------------------------- |
| Waltz   | 54 s               | 8.94e-8                            |
| Library | 28.2352916667 s    | 7.15e-7                            |
| Castle  | 30 s               | 5.96e-8                            |

All peaks remain <0.5 and seams <0.015. This validates the score/loop tail
optimization numerically, without claiming an owner listening review.

## Verification and review

Final cold Home diagnosis at the same CPU4x/DPR3 conditions, two alternating
pairs: longest task 778/804 ms before versus 115/143 ms after. Splash completed
around 3.36-3.42s after navigation origin; the minimum was not shortened. Whole
cold-window rAF p95 still measured about 83ms, including startup. This is an
improvement over the heavily constrained baseline but **does not prove smooth
60fps splash on a physical phone**. Warm steady scroll is the separate benchmark
above. Further graphics decisions require real-device/paint evidence rather
than assuming the headless GPU represents Android.

Completed checks: Node22 check/build 0 errors/0 warnings, 44 recruitment tests,
10 visibility tests, strict spacing 40 components, Navbar 20 widths, SEO24,
scoped formatting, View Transitions/Back/hash/single-cue and no browser errors.
Three audio presets at 390/1440 and both motion preferences pass peak/RMS/seam,
rapid switching, hidden context clock pause/resume and source persistence.
Existing responsive confirmation passes mock submit/receipt/focus/containment
at 9 widths x both motion modes, plus enlarged text. No production submission.

Final browser PASS: seven width/input/motion cases (360/390/414 touch, 820 touch,
1440 fine pointer, 390/1440 reduced), no horizontal overflow, no desktop runtime
on mobile, static continuous decoration, retained card divider/gradient underline,
client navigation/source persistence and rapid hidden/visible handling. Reduced
motion stays background-silent; a real gesture may create its existing context.
Splash audio PASS under allowed and gesture-required policies at 390/1440, late
gesture skips loading audio, reduced stays silent. Home replay/swap/Back/hash/
storage PASS at both widths and both motion settings. Browser errors: none.
Warm Home/Philosophy and final splash 390px screenshots visually reviewed.
Parallel browser runs initially stopped; acceptance uses completed reruns.
Final source is unchanged after these functional runs except a CSS comment
formatting correction, with scoped Prettier and diff checks passing.

Preview: `http://127.0.0.1:4370/`, local PC only, with an isolated visibility
fixture. Its enabled sections are for QA, not a statement of production flags.
The previous responsive recruitment-success fix remains local and preserved;
its original diff remains 35 additions/11 deletions and mock-submit QA is rerun.

## Scope deliberately retained

- Hero assets, image quality, fonts, spacing and design tokens stay unchanged.
  Mobile motion changes stop manipulating the hero image; no reduced-resolution
  hero variant or fake upscale introduced.
- Navbar/form glass is retained: the investigation did not demonstrate a
  consistent filter benefit. Further glass changes need GPU/device evidence.
- SSR middleware, Supabase RPC, no-store headers, fresh visibility, admin Auth,
  four-tab session behavior, recruitment backend/storage/idempotency unchanged.
- No 10-15s visibility TTL, stale HTML cache, region/provider/config change.
- No live save/toggle, applicant submission or asset upload. Browser performance
  probes block non-GET/HEAD; registration QA uses loopback mocks only.
- Real Android/iPhone/WhatsApp-browser, thermal/battery-saver behavior and owner
  audio/visual acceptance remain to be checked. No 0ms or all-device 60fps claim.
- Original splash minimum remains a deliberate wait, even after its rendering
  work is reduced. Shortening that minimum is a separate product decision.
- All pre-existing dirty documents/assets stay preserved; no staging/release.
