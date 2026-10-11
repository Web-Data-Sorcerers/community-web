# Pages & Sections — R4 release execution

## R7 local repair ready — 11 Oct 2026

[Runtime cause, isolated repro, fix and approval packages](page-section-visibility-r7-runtime-repair.md):
production logs prove Rolldown native binding boot failure; exact packed function
reproduced outside workspace. Local build rule removes unused compiler import;
packed shared Auth/19routes/21sections/freshSSR synthetic PASS,54 tests PASS.
Two exact visibility API rewrites prepared locally; cloud routing still PENDING.
Primary alias remains failed release032fdf9 until approved recovery/new release.
Rollback approval question pending; repair not committed/pushed, live flags intact.

## Actual result — R4 READY, R5 FAILED

Owner-approved commit/push completed. Final SHA
`032fdf984dbe31c9d18fda660d75704e000e1177` pushed once to origin/main;
remote SHA verified identical. Deployment
`dpl_BXduXxUzuiw6Bsc4KBipr1aKf69h` reached READY and primary alias switched
to it, verified12:15:06 UTC. Provider runtime stats report12 Node functions;
build log signals show CMS prebuild/check/build and Node22, without build errors.

Actual read-only R5 checks FAILED: all19 controlled public routes return500
`FUNCTION_INVOCATION_FAILED`, no visibility revision. Three static admin routes
return200; `/api/admin/site-visibility` and `/api/site-visibility/revision` return404.
Existing `/api/cms/content` returns200. This is actual production failure;
local fixture/shared Auth tests did not establish provider runtime acceptance.
No positive owner login/save acceptance or live toggle performed.

Rollback candidate deployment URL Home rechecked200 after failure:
`dpl_5Kp2u5fzhVTgnVUMtykugjKUef3o` / SHA
`144e6812cda44c5f59b3152bffe6f0d027bc2e6b`.
Concrete proposed recovery: provider rollback/promotion to that existing
successful deployment, then verify Current/alias and read-only routes. No new
Git push/build, no SQL/config/grant/intake changes, no live preference restore.
Expected recovered state is the previous web version; additive DB and seed
preferences remain intact. Production rollback requires separate owner approval;
not executed. Runtime cause remains unknown: historical CLI logs yielded no
rows, runtime stream timed out. Do not claim database empty or reapply migration.

Post-release evidence update is dirty documentation; no second commit/push
which could trigger another deployment. Historical freeze text below remains.

11 Oktober 2026. Owner explicitly approved “commit dan push scope release
tersebut, termasuk deployment main”. This authorizes this reviewed release and
connected main deployment. Provider configuration and live toggle/restore remain
separate. No deploy hook, extra redeploy, force push, reset, stash or amend.

## Reviewed scope and gates

Release includes feature commit `51ce1984112283ad533e018dbebcb6b3730a138a`
(Pages & Sections SSR/config/API/admin/refinement, approved On Development,
contact/social links, Navbar and preserved Team verifier), plus the minimal
visibility entry move/import and all related dirty/untracked planning/handoff
documents. Ignored artifacts, credentials, dependencies and runtime fixtures
are excluded. Existing diffs are preserved.

R2 production DB/ACL/RLS/API PASS, migration SHA256
`62844c643ca608582334647824978663b758753c8623b87a6ac7622dd7a1b82c`.
Pre-push read12:12:47 UTC: valid19 pages/21 sections; seed revision
`00000000-0000-4000-8000-000000000001`, Home/ProjectsON, About/HoFOFF.
Remote main still `144e6812cda44c5f59b3152bffe6f0d027bc2e6b`.

Local fix verification: Node22 check/build PASS, 54 tests PASS, compiled real
shared Auth/routing with synthetic upstream PASS; detector expected11 APIs+1SSR.
See [local fix evidence](page-section-visibility-r3-function-fix-local.md).
All scoped files Prettier PASS; git diff --check PASS. No UI/schema/grant/intake
or provider setting changes in the final packaging fix.

## Freeze, deployment and acceptance

At documentation freeze, final commit SHA and deployment ID are pending. Record
actual SHA in ignored execution artifact after commit; exact SHA must match
remote main, Git-triggered production deployment Current and primary alias.
READY/manifest and live read-only R5 acceptance must be verified after push.
Owner authenticated GET remains pending until existing shared login is tested
by owner; live save/freshness/no-hook acceptance requires separate R6 approval.
Do not label authenticated production acceptance PASS from synthetic fixtures.

Evidence directory: `artifacts/site-visibility/r4-release-20261011/`.

## Expected state and rollback candidate

Home and Projects remain ON; About/HoF show Under Development; all21 section
preferences seededON. Existing content and recruitment intake remain intact.
Fresh visit after a confirmed visibility save reads the latest revision without
rebuild; no0ms or automatic open-tab update promise. No live save during R4/R5.

Verified rollback candidate before push: READY
`dpl_5Kp2u5fzhVTgnVUMtykugjKUef3o` at
`144e6812cda44c5f59b3152bffe6f0d027bc2e6b`, currently primary alias
`data-sorcerers-community-sigma.vercel.app`. Rollback promotion/restore needs
separate authorization; no destructive SQL rollback/drop.
