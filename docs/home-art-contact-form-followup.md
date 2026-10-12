# Home art, role contact and application focus — local work

Later update12 Oct2026: owner authorized remaining plans. Shared session is now
implemented locally; admin-shared-session-local.md supersedes the earlier
PLAN ONLY section below. Detail/form follow-up also complete locally; see
recruitment-simplification-detail-plan.md. No commit/push/deploy.

Owner requested latest artwork for Home only, hide the role Contact Person,
fix outlined empty boxes under registration inputs, and PLAN shared admin login.
Baseline2a79695. No commit/push/deploy, provider/Auth/CMS/visibility writes.

## 1. Home hero — execute and verify first

Existing Figma node1430:2041:
https://www.figma.com/design/JYUzJK1hFqaEwL6DpdDvjp/Web-Community-DS?node-id=1430-2041
1440×903 reference; current owner-approved100svh composition. Owner artwork
overrides former reference art: assets/background/terbaru.png1586×992. Use
native1586 and1440 responsive WebP at high quality, no enlargement or invented4K
detail. Preserve image-fit/position, typography Bluu Next70072/86 desktop,
Manrope40018/25, padding80, max1280, content gap64/copy16/actions24 and existing
responsive measured exceptions. Keep every other hero's artwork unchanged.
Verify image decoding/currentSrc, intrinsic dimensions, overflow and screenshots
at390DPR3,1440DPR1/2; compare compressed image with native source quantitatively.

## 2. Role Contact Person — after hero lock

Hide only the role-detail contact card shown by owner. Retain contacts/WhatsApp
in data and source for later restoration; absent from rendered HTML/focus order.
This is a scoped owner override of existing role detail, no new Figma design.
Preserve padding80/24, cards/chips/fonts/CTA and surrounding layout; validate all
six role routes and Apply Now links, check/build/spacing.

## 3. Registration focus bug — after role lock

Custom registration form has no supplied Figma node. Existing8-point layout,
Manrope and controls unchanged. Root cause in RecruitmentForm styles:
input:focus-visible + span/div globally outlines any next sibling, including
empty span.field-error after text inputs. Limit sibling focus outlines to radio/
checkbox types. Keep text input's own border/glow and keyboard focus indication
on custom radio/checkbox widgets; preserve error text/aria-invalid/live region.
Verify filled city/name/email fields have no outlined empty span, real invalid
messages remain readable, keyboard selections remain visibly focused. No real
application submission; isolated browser fixture only.

## 4. Admin login — plan only

Four panels: Projects, Team, Recruitment, Pages; current shell keeps modules
mounted. Existing same-origin sealed cookie Auth is already shared. Login emits
ds:admin-session-started from all panels, but only Pages currently listens to it.
Panels prewarmed anonymously can retain a stale login prompt after another panel
logs in. This is a source-supported cause, not owner-session reproduction yet.

Proposed work order:

1. Reproduce login in each source panel with synthetic Auth/private reads, then
   switch all4tabs without a second credential submission. Also test direct
   /admin, /admin/team, /admin/recruitment entry URLs and reload on same origin.
2. Central shell session state: checking/anonymous/authenticated/expired; one
   login surface, credential handling stays with existing secure backend cookie.
   A confirmed login wakes mounted anonymous panels via fresh read/bootstrap;
   unmounted panels read the same session when selected. Deduplicate rechecks;
   preserve active-first bounded scheduling rather than concurrent background GETs.
3. Never re-login or clear session solely for a network timeout/server error.
   Distinguish401 expiry,403 permission/origin/CSRF, and503/network failures.
4. Preserve per-panel draft/selection, late-request generation guards, local CSRF
   acquisition from authorized reads, per-panel ACL and uncertain-save handling.
   Logout ends the shared session once and updates all panels. No access token,
   password or session cookie copied into localStorage or panel data attributes.
5. Keep a consistent canonical origin. Cookies cannot be shared implicitly between
   custom domain and vercel.app; inspect configured allowlist and redirect behavior
   read-only before proposing any provider/origin change. Existing403 on Vercel
   alias must not be masked by repeating a login.
6. Test4source panels×4destinations, reload/Back, expiry/logout/failed login,
   slow/failing reads, save conflicts/draft preservation and keyboard/mobile.
   Real owner-session acceptance remains pending; do not save/upload/toggle live.

Implementation of admin login consolidation is not part of this authorized fix
pass; owner asked for its plan. Build a separately reviewable local patch after
approval of this plan. Source candidates: admin-shell, existing panel bootstrap
interfaces and admin shell login UI. Server Auth/schema/provider unchanged unless
separate evidence and authorization requires a concrete change.

## Local acceptance — 12 Oct 2026

Home uses native1586×992 and1440×901 WebP quality96 (282480/249550 bytes),
without upscale. Native compression RGB mean absolute error1.223/255 against
owner PNG. Browser390DPR3 and1440DPR1/2 decoded correct new artwork, no overflow;
screenshots in artifacts/home-contact-form/. Existing typography/layout unchanged.
All six detail routes omit Contact Person and preserve their Apply Now links.

Node22 check/build PASS, zero errors/warnings; recruitment42 tests PASS; strict
8-point spacing40components PASS. Existing recruitment browser verifier PASS:
4flows,416panel/width cases, six role destinations/client navigation, no errors.
Focused-input verifier PASS at320/390/768/1440 and both motion modes: empty error
span has no outline after name/email/city input; custom radio keyboard focus
remains visible; real invalid email still has aria-invalid and readable error.
The initial verifier assumed2px radio outline; global focus styling resolves3px.
Corrected the assertion to check visible focus, without changing production CSS.

Local preview http://127.0.0.1:4364/ uses isolated /tmp visibility fixture and
local CMS data. Synthetic registration transport only; no live application,
CMS, visibility or Auth mutation. Admin modules/backend were not edited.
Admin plan remains for owner review. No commit/push/deploy.
