# Home refresh splash — local plan, 12 Oct 2026

Owner explicitly chose “Munculkan ulang hanya saat refresh Home”. Local work
only; prior commit/push authorization was consumed by2d17446. No new release.

Existing Splash custom composition/artwork is preserved (no new Figma node or
asset). This pass changes trigger only; Nasalization splash wordmark and existing
Bluu Next/Manrope page tokens, all spacing/geometry and current3–6s capped loader
remain. Reduced motion bypasses splash. No visibility/backend/cache changes.

Trigger matrix: initial fresh Home may play existing splash; refreshing Home
plays again even if ds:splash already exists. Non-Home document loads/reloads
skip splash. In-session Astro navigation to/from Home and Back/Forward bypass
it. A document-lifetime initialization guard prevents the persisted navigation
entry's reload type from incorrectly triggering on a later Astro Home swap.
Storage failure remains fail-open. Keep hash restoration and sound lifecycle.

Execute BaseLayout head trigger, preserving Splash animation implementation.
Verify390/1440, normal/reduced motion, initial Home, repeated Home reload,
first non-Home load/reload, client Home navigation after a Home reload, Back,
scroll unlock, Home hash reload, unavailable storage and no browser errors.
Node22 check/build, targeted format/spacing and VT smoke. Update handoff/evidence;
no commit/push/deploy without a new explicit owner instruction.

## Local acceptance

Trigger implemented only in BaseLayout. First document-run guard and actual
navigation.type reload allow Home refresh replay. Non-Home loads/reloads and
Astro swaps bypass the overlay; swaps always retain splash-done/nav-warm so
first-entry non-Home users also get settled page navigation. Splash assets,
animation/durations/fonts/spacing remain unchanged.

Node22 check/build0errors/0warnings, strict spacing40 PASS. Browser390/1440 ×
both motion modes PASS: fresh Home, repeated refresh, non-Home fresh/reload,
Home client swap after reload, Back, hash restoration, scroll unlock, storage
failure fail-open and browser errors0. Initial harness clicked a hidden mobile
Navbar CTA; scoped it to the hero. Then it wrongly required skipped overlays
to be removed from DOM after every swap; corrected to verify inactive/hidden
overlay, preserving actual existing markup behavior. No production style fix
was needed for these harness assumptions. Existing VT/sound smoke PASS with
pageerrors:none, context persistence and hash restore110px.

Evidence: artifacts/home-refresh-splash/. Preview http://127.0.0.1:4364/ uses
isolated local visibility fixture. No commit/push/deploy/live/backend mutation.
Production stays2d17446. Safari/WebKit not tested in this local Chromium pass.

## Release authorization — 12 Oct 2026

Owner explicitly instructed “commit dan push” for this Home refresh splash
change. One scoped commit/main push and connected deployment authorized;
baseline HEAD/remote2d174463ca678e10841b5097d4dec4116c29b837 matched.
Local checks above passed. Pre-release live revision:
b5cb65e9-cf25-4f07-9972-cc91b0843bc8. New SHA/deployment/live acceptance pending.
No live save/toggle/submission, provider or database mutation. Unrelated dirty
documents/reference assets preserved; earlier local-only statements are historical.
