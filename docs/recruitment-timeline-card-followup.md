# Recruitment timeline and card follow-up — local work, 12 October 2026

## Release authorization

Owner explicitly authorized “commit and push” after approving both card lines.
Release scope: timeline dates/TBA and responsive wrapping, static fading divider
and fading short action underline, instant page swap, related verifier changes,
the exported divider, this evidence document and fullscreen follow-up notes.
One main commit/push triggers the connected deployment. Preserve unrelated
dirty documents and owner reference PNGs; no CMS/visibility/provider changes.
Release SHA and production acceptance will be recorded locally after push.

## Static divider visibility correction

Owner supplied `assets/assets recruitment page/button/card role 4.png` and
approved the short underline. Fix only the long separator above View Details:
retain the exported white50% to transparent100% vector, full content width and
static state. Use a1px minimum and prevent flex shrinking so the hairline stays
visible on mobile and1x displays. Preserve footer spacing and all other card
styling. Verify its actual screenshot pixels at rest on desktop/mobile, hover
invariance, and run local build/spacing/format. No commit/push/deployment.

Owner authorized local implementation with “okee berarti gas nih?” after the
Figma-backed plan. Baseline HEAD/remote main: c0d7593. No commit, push,
deployment, production CMS save, visibility save or provider changes authorized.
Preserve all existing dirty documentation. Work one section at a time:
Timeline, Available Roles, then navigation measurement.

## Master work plan: Selection Timeline

- Figma: https://www.figma.com/design/JYUzJK1hFqaEwL6DpdDvjp/Web-Community-DS?node-id=1436-3637
  Node 1436:3637, 1440 × 812. Existing fullscreen composition remains.
- Content authority: owner-supplied /home/faiz/Downloads/Oprec DS.png,
  registration period 12 October–12 November 2026. OPEN RECRUITMENT displays
  `12 Oct – 12 Nov 2026`; the other five phases display `TBA`. Date header remains
  `Date`. ISO dates are represented by semantic time elements.
- Layout: desktop padding80, heading/table gap56, table max1280; mobile
  padding64/24 and gap40. Keep existing measured Figma exceptions18/32 and
  typography: Bluu Next Bold700 heading56/67.2; Manrope phases26/39 and
  mobile18/27. Let mobile rows/body grow for the actual date text; add an
  8-point column gap to keep wrapped phase/date cells separated.
- Preserve existing background, table rim, separators and source artwork.
- Verify six exact values, ISO dates, header, 320/390/430/768/1440px, enlarged
  text, no overlap/overflow/clipping; check, build, format, spacing.
- Audit existing role deadline conflict (snapshot says20 October), but do not
  change CMS records or intake rules as part of this timeline update.

## Master work plan: Available Roles

- Figma section: https://www.figma.com/design/JYUzJK1hFqaEwL6DpdDvjp/Web-Community-DS?node-id=1436-3564
  1440 ×843, padding80, header/grid gap58 (measured exception), grid1280,
  columns20 and rows40. Keep existing fullscreen section and responsive grid.
- Inventory: header1436:3565; cards1436:3570 Data,1436:3581 Core,
  1436:3592 Language,1436:3604 Vision,1436:3615 Product,1436:3626 Growth.
  All cards413 ×235; title Manrope700 26/39, summary400 16/24;
  radius20, padding18/28, title/summary gap16 (measured existing exceptions).
- Representative card: https://www.figma.com/design/JYUzJK1hFqaEwL6DpdDvjp/Web-Community-DS?node-id=1436-3604
  Foot1436:3608 contains static divider1436:3609 before action1436:3610.
  At413px, divider355px at localy170; action119 ×32 at localy184. Footer
  gap14 is a measured Figma exception; preserve proportional cqw sizing.
- Button variants: https://www.figma.com/design/JYUzJK1hFqaEwL6DpdDvjp/Web-Community-DS?node-id=1218-1347
  default1218:1345 and active1218:1346; Manrope500 16/32, gap8,
  arrow20. Active has0.5px underline spanning text+arrow119px.
- Use exported divider vector, existing exact arrow/glow assets; retain card
  rim and artwork. Static divider never animates. Separate content-width
  underline animates scaleX on card hover/focus in180ms (implementation choice,
  not a Figma timing claim), with instant reduced-motion state. No nested links.
- Verify rest/hover/focus/touch/reduce on six cards, divider invariant position,
  content-width underline, no layout shift, correct role destinations and
  repeated Astro navigation. Update existing verifier's obsolete expectation
  that long dividers are hidden at rest. Export references1x/2x and use sharp
  for geometry/region comparisons; keep existing assets as historical evidence.

## Navigation follow-up

Measure c0d7593 behavior after the two section passes, separating HTML/network,
stylesheet preparation, swap, first destination frame and animation completion.
Compare local80ms baseline with60ms/none only when measurements justify it.
Do not re-enable rejected viewport HTML prefetch or add visibility TTL/SWR.
Keep request-time freshness, Auth/save, history and sound context.

## Verification record

### Owner correction: fading underline, 12 October 2026

Inspect the owner references in `assets/assets recruitment page/button/` and
active Figma node1218:1346. Keep the long static divider above the action,
including its white-to-transparent right edge. Replace the short action's
solid white underline with the same rightward fade: white through50%, then
transparent at100%. Preserve its content width, hover/focus animation, measured
hairline appearance and reduced-motion state. The transformed0.5px underline
was absent in Chromium1x screenshots despite its computed active state; use a
1px minimum for reliable rasterization (a documented rendering exception). Rebuild the isolated local preview
and inspect screenshots at desktop/mobile sizes; no production changes.

Completed locally. Production remains unchanged; HEAD remains c0d7593.

- Runtime Node22.23.3 installed only under `/tmp/ds-recruitment-node22` because
  the shell default is Node26 and the existing npm cached executable was Node20.
  No workspace dependency/lockfile changes.
- Node22 check/build:0 errors/0 warnings (existing hints retained).
- Timeline:5 widths320/390/430/768/1440 + enlarged text PASS; exact six values,
  header, ISO dates, column non-overlap and overflow checks.
- Cards:10 conditions (five widths × both motion modes), all six cards hover/
  focus, static divider invariance, content-width underline, keyboard Enter/
  Back, text containment and zero browser errors PASS.
- Desktop foot measured x29.016/y169.641, divider355.297×0.5;
  actionx29.016/y184.141,118.719×32.031. Reference413×235 has divider355,
  action119×32. Existing card/title/glow geometry preserved. The fractional
  locator screenshot is414×236; aligned crop uses top1, width413/height235.
  Region MAE: divider11.20, action16.49, full card15.01. Residuals include
  hairline antialiasing, font rendering, pre-existing artwork/title alignment;
  this scoped correction does not claim full-card pixel identity.
- Recruitment tests42 PASS; visibility tests10 PASS.
- Public visibility28 PASS, including acknowledged synthetic save→fresh visit,
  history revision changes, inheritance, no-JS SSR, fail-closed503 and recovery.
  Only the isolated `/tmp` fixture is mutated and restored. Initial harness
  review mode returned a synthetic200 for the private API where this verifier
  expects missing-provider503; rerun with review mode off PASS. Manual invalid
  fixture reads also returned503 for Home/About/Recruitment. No app fix needed.
- Navigation final24 cases across390/1440 and both motion modes PASS: zero
  Astro fade animations, first-frame enabled CTA feedback, cancelled/disabled
  press cleanup, zero speculative HTML/browser errors.
- View Transitions smoke PASS (history/hash/deep-link/component reinit and sound
  context); Navbar20 widths PASS; navigation UX15 cases PASS.
- Spacing40 components PASS; SEO24 pages PASS.
- Changed source/scripts and this plan pass targeted Prettier. Repository-wide
  format check reports10 pre-existing document failures:AGENTS,ai-handoff,
  assets,instant-navigation-next-ai-kickoff,navigation-performance-local,
  navigation-performance-new-ai-kickoff,navigation-performance-p2-p3-release,
  navigation-performance-plan,snappy-navigation-local,HANDOVER. Their previous
  work is preserved; no global formatter run.
- Full historical visual verifier was not run: it targets original content on
  pages now disabled by default. The two requested sections use focused browser
  checks and Figma references; unrelated screenshot mismatches are not altered.

Navigation comparison (serial Chromium, local fixture,12 samples/motion/run):

| Candidate           | Normal median/p95 | Reduced median/p95 |
| ------------------- | ----------------- | ------------------ |
| Existing80ms fade   | 174.75/209.90ms   | 157.35/192.90ms    |
| First none run      | 165.95/198.90ms   | 152.25/182.90ms    |
| Verified final none | 168.35/191.20ms   | 154.00/173.60ms    |

Metric is click→two animation frames after swap, not physical pixel observation
or full asset/animation completion. Final normal preparation median28.05ms,
DOM swap78.70ms, page-load86.35ms. The small difference and similar reduction
under reduced motion do not prove a broad performance gain. Retain none for the
owner's instant-swap direction and verified removal of fade; native capture,
rendering and fresh network work still take time. No Supabase latency is included
in this fixture and no production timing/0ms claim is made. Rejected viewport
HTML prefetch stays disabled; no visibility TTL/cache added.

Evidence: `artifacts/recruitment-followup/`, plus
`artifacts/snappy-navigation/recruitment-followup-{80,none,final}/proof.json`.
Figma exported references/active variant are kept in the follow-up artifact
folder; exported vector is shipped from `public/images/recruitment/role-divider.svg`.
Preview: `http://127.0.0.1:4364/recruitment` (explicit local visibility fixture;
private real Auth/provider transport is not configured).

Reproduce with Node22 and `CMS_DATA_SOURCE=local npm run build`, start
`scripts/serve-site-visibility.mjs` with `PORT=4364`,
`SITE_VISIBILITY_SOURCE=local` and
`SITE_VISIBILITY_FILE=/tmp/ds-recruitment-followup-visibility.json` (copy the
visibility snapshot there first), then run the existing visibility/VT/Navbar/
UX verifiers against `PREVIEW_URL=http://127.0.0.1:4364`. Do not enable the review
transport for the public verifier; it mocks admin saves itself. Navigation:
`SNAPPY_PHASE=recruitment-followup-final SNAPPY_ANIMATION=none
SNAPPY_VERIFY_FINAL=1 node scripts/verify-snappy-navigation.mjs`.
The focused section browser scripts used in this pass are retained locally at
`/tmp/ds-recruitment-{timeline,cards}-qa.cjs`.

Role deadline conflict remains an audit item: local CMS snapshot says20 October,
poster registration ends12 November. No CMS/intake/deadline mutation was made.

Fade correction verification: Node22 check/build0errors0warnings; targeted
format and spacing PASS. Screenshot pixel comparison with underline hidden
confirms white-to-transparent fade: brightness delta215 at10%,213 at50%,106
at75%,20 at95%. Long divider visible above the action in the captured card.
Evidence: artifacts/recruitment-followup/fade-on.png and fade-pixel-proof.json.

Cards rerun PASS:10 width/motion conditions across6 cards, hover/focus and
keyboard Enter/Back, no browser errors. No commit, push or deployment.

Static-divider correction acceptance: Node22 check/build0errors0warnings,
spacing and targeted formatting PASS. Cards10 conditions across6 cards with
hover/focus and Enter/Back PASS. Actual rest screenshots at390/1440 show the
long separator above the action. Pixel comparison with hidden separator proves
visibility and fading: desktop brightness deltas159/159/80/15 at10/50/75/95%;
mobile150/150/75/15. See static-divider-{390,1440}.png and
static-divider-pixel-proof.json under artifacts/recruitment-followup/.
