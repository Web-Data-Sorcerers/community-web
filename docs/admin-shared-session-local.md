# Shared admin session — LOCAL COMPLETE

Owner authorized remaining plans with “eksusi plan yang belum dan gas”.
Baseline2a79695; no release/provider/DB/live writes. Preserve existing dirty work.

## Composition and boundaries

Owner goal: login once, move Projects/Team/Recruitment/Pages without repeating
credentials. Same-origin HttpOnly sealed cookie already provides server session.
Keep existing login controls as the active panel's entry to that single session;
only the active panel is visible. Avoid a second credential form, token storage,
and replacement of existing secure Auth endpoints. Central shell owns checking/
anonymous/authenticated/expired state and resumes anonymous mounted panels after
confirmed login. Historical “one login surface” proposal is implemented by the
active existing surface plus shared shell state, preserving root-scoped IDs.
No supplied Figma node; no new artwork or geometry. Bluu Next/Manrope and Dark
Arcane palette unchanged. No new spacing outside8/16/24/32. One bounded private
read at a time for resumed panels; active panel finishes first. Existing backend
ACL/Origin/CSRF/save protocol and generation guards unchanged.

## Steps and acceptance

1. Reproduce anonymous prewarm followed by login and4×4tab switches in synthetic
   transport. Show no second credentials request on same origin/reload.
2. Expose ensureSession on each module: await its original bootstrap, deduplicate
   rechecks, skip a visible workspace or any draft/busy/uncertain state. Healthy
   editors must never reload or discard drafts from another module's login event.
3. Emit confirmed-login event after the initiating panel's bootstrap settles;
   shell resumes other mounted anonymous panels serially. On later selection,
   retry a still-anonymous panel with shared cookie. Failures remain panel-local;
   do not infer logout from network/503 or convert403 to a password error.
4. On confirmed logout expire all modules once and invalidate the resume queue.
   Shell listeners use one lifecycle AbortController; handle initial restored
   session based on successful visible workspace, without caching private data.
5. Test all4login sources,4destinations, direct3entry URLs/reload, failed login,
   slow initial401 raced with login, network failure/retry, logout during pending
   reads, dirty Pages/Projects/Team and recruitment-detail drafts. Existing mocks
   only, no real passwords/private applicant reads/uploads/visibility saves.
6. Run existing CMS, recruitment-review and visibility/race browser checks plus
   Auth contracts. Record WebKit availability; do not claim real Safari or owner
   identity acceptance from synthetic Chromium checks.

## Implemented and verified

admin-shell owns shared state and a generation-bounded serial resume queue.
admin-session createSessionResumer waits for initial reads, deduplicates clicks,
and skips connected healthy/draft/busy/uncertain editors. Each panel exposes
ensureSession and dispatches login success after its own bootstrap. Panels use
the same existing sealed HttpOnly cookie; no credential/token persistence added.
Projects/Team hide stale login form on successful private reads. Logout invalidates
queued work and retains existing module generation guards; listener lifecycle
uses AbortController. Idle prewarm waits while resume work is active.

Synthetic browser16conditions (320/390/768/1440×4login sources), all4destinations,
failed login, stale anonymous read, transient503/retry, direct3entry URLs/reload,
shared logout and draft preservation PASS. Test harness initially retried a failed
Recruitment login without refilling its cleared password; corrected the harness,
not the secure form behavior. No real account/production credential acceptance.

3resumer tests +10visibility tests PASS. CMS98PASS/10knownTeamSKIP; Projects/Team
browser4widths each PASS; Recruitment review6widths PASS. Pages12combinations/
3races PASS; public visibility28PASS; isolated packed Node22 shared Auth/Origin/
CSRF/permission/freshSSR checks PASS with unknown outbound0. Browser proof:
artifacts/admin-shared-session/proof.json; consolidated logs:
artifacts/recruitment-admin-followup/. WebKit unavailable. No release/live writes.
