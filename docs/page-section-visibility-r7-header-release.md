# Pages & Sections — R7 admin header release

11 Oktober 2026. Owner explicitly approved “commit dan push fix header admin,
termasuk deployment main” through the scoped approval question. This release
only adds the trailing-slash admin header pattern and related execution docs.
No database/account/grant/allowlist/intake/provider env/Node/plan changes or
live save/toggle/restore. One Git main push; no extra deploy hook/redeploy.

## Preceding runtime repair result

Commit `f8a87cad260071aa227b0e3bf637bd21af8c371a` was pushed once after approval.
Deployment `dpl_4KkryTf8fX2T91sTvoqwHCs2SsbM` READY, primary alias matched at
12:53:09 UTC. Actual deployment Node22.x (project setting24.x unchanged),
provider reports12 Node functions. Runtime log sample50 rows has zero native
binding failures and zero5xx. Nineteen public routes200 and consistent seed
revision, browser/CDN no-store, Home Projects+Explore present; About/HoF chamber
and noindex follow. Revision API200, private visibility/Projects/Team/Pendaftar
anonymous401. Unknown detail404, content API source=supabase, media200WebP,
recruitment accepting=true. No real saves or data mutation for acceptance.

Twenty serial Home RTT samples546–1347ms, median818.5ms, network included;
cold/warm conditions not controlled. Not a load test or0ms guarantee.

Important cache evidence: origin packed function emits three no-store headers.
Real client sees Cache-Control/CDN-Cache-Control no-store and X-Vercel-Cache MISS;
Vercel-CDN-Cache-Control is consumed by proxy as described in
[official Vercel docs](https://vercel.com/docs/caching/cache-control-headers).
Initial client assertion requiring that consumed header failed, then the
verification was corrected to account for documented proxy behavior. No source
cache policy was weakened. Existing tests of origin three headers remain strict.

Full read-only acceptance gathered all remaining checks even after discovering
admin header failure. It still exits failed for that actual gate, rather than
suppressing the assertion. Evidence:
`artifacts/site-visibility/r7-release-20261011/public-acceptance.json`.

## Header issue and exact fix

Actual GET without slash (`/admin`, `/admin/team`) returns no-store and
X-Robots-Tag noindex,nofollow. Same pages with slash return200 but Cache-Control
public,max-age=0,must-revalidate and no X-Robots-Tag. Meta robots remains noindex
and private APIs stay401/no-store; no personal data was fetched.

Existing source `/admin/:path*` compiled regex does not match trailing slash.
`vercel.json` now adds source `/admin/(.*)` with the same two headers, preserving
the old rule for slashless paths. Official installed routing-utils transform
error=null; six paths with/without slash all match no-store/noindex locally.
No response handler/Auth/UI change. This is a versioned deployment header fix,
not a provider account setting change. Prettier and git diff --check PASS.

## Release acceptance and limits

At freeze final new SHA and deployment are pending. Match remote/main, READY,
Current and primary alias, recheck all19 public routes and six admin forms,
revision/private APIs/content/media/intake. Browser review of preceding runtime
repair covers320/390/768/1440 layouts and navigation/Back; final result is recorded
after QA completes. Header-only change does not require repeating unchanged UI
suite; final live routes/headers must be reread.

Owner authenticated config GET remains pending without an existing owner
session; no password requested, reviewer account created or synthetic network
intercept used on production. Live save-to-public/no-hook acceptance R6 remains
separate, unapproved. No claim of full authenticated production acceptance yet.

Expected final seed state: Home/ProjectsON, About/HoF Under Development;19 page
preferences21 section preferences intact. Fresh visit following confirmed save
should read new revision without rebuild; no automatic open-tab update promise.

Rollback candidate for this header-only release:
`dpl_4KkryTf8fX2T91sTvoqwHCs2SsbM` / `f8a87ca` (public/API repaired, admin slash
header limitation). Initial baseline deployment144e681 also retained. Rollback
requires separate approval and no SQL/drop/config preference reset.

Evidence directory: `artifacts/site-visibility/r7-header-release-20261011/`.
Post-acceptance docs remain dirty without another automatic commit/push.
