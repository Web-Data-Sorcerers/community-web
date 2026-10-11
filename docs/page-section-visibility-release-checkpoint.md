# Pages & Sections release checkpoint

Owner explicitly requested “commit and push” after reviewing the local UI.
This authorizes committing and pushing the reviewed work; earlier restrictions
on production SQL, provider/config changes, deployment and live toggles remain
separate. No extra interpretation of historical dual-remote instructions.

## Concrete reviewed release

- Current local and remote main before commit: `144e6812cda44c5f59b3152bffe6f0d027bc2e6b`.
- Current origin fetch/push URL: `https://github.com/Web-Data-Sorcerers/community-web.git`.
  Production remote resolves to the same repository; do not push twice.
- Scope: Pages & Sections SSR/config/API/admin and UI refinement, local QA/tools/
  migration proposal/documentation, plus preserved existing On Development,
  official contact/social links, Navbar contrast and Team-verifier work.
- Reference/source On Development PNG and reproducible WebP assets included;
  ignored fixture/artifacts/build output/dependencies/secrets excluded.
- Local acceptance already PASS: P0–P6 and UI refinement. Exact limits are in
  `page-section-visibility-local.md` and `page-section-visibility-ui-refinement-local.md`.

## Production prerequisite verification

Read-only check at 2026-10-11T09:48:07+00:00:
POST `/rest/v1/rpc/site_visibility_load` with an empty body returned HTTP404,
code `PGRST202`. Backend credentials/response data were not printed or committed.
No schema/config/data write was performed. The required public loader RPC is
not available through the configured Supabase API.

Master plan P7 explicitly requires “New runtime must not deploy before DB exists.”
Missing visibility reads intentionally return HTTP503 on all controlled public
routes. Handover records main as an auto-deploy path. Therefore this release
must not be pushed to main before the prerequisite is provisioned and verified.
No provider setting or alternative branch deployment is changed to bypass this.

## Ready for separate approval

The concrete additive migration is
[`20261011160000_site_visibility.sql`](../supabase/migrations/20261011160000_site_visibility.sql).
SHA256: `62844c643ca608582334647824978663b758753c8623b87a6ac7622dd7a1b82c`.
It adds the visibility validator, three private visibility tables with RLS,
service-only load/save RPCs, atomic revision/replay handling, and default seed.
Existing six CMS collections, recruitment intake, accounts, CMS grants and
allowlist are unchanged. About/HoF remain off; Home/Projects remain on.
Ephemeral PostgreSQL acceptance has 29 passing checks; this does not substitute
for production apply and catalog/ACL verification.

Proposed next actions, requiring owner approval:

1. Read-only backup/catalog check, then apply this reviewed migration once in
   a transaction. Verify the added functions/tables, ACLs and exact default flags.
2. Review actual provider runtime/route/environment readiness read-only. If any
   provider configuration needs changing, present that concrete change separately.
3. Once prerequisites pass, push the committed release once to origin/main,
   acknowledging the connected production deployment; verify exact SHA and
   public/admin routing. Do not execute a separate deploy hook or live toggle.
4. Keep live save/toggle acceptance separate; do not turn Projects off in production.

Current checkpoint: local commit preparation authorized; main push held pending
production prerequisite/deployment authorization. Do not describe the feature
as live or reuse this commit/push instruction for additional unrelated releases.
