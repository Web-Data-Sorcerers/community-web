# Pages & Sections release checkpoint

## R4 release diizinkan — 11 Oct 2026

Owner memberi instruksi eksplisit “commit dan push scope release tersebut,
termasuk deployment main”. Scope: commit fitur51ce198 + fix packaging visibility

- seluruh dokumen handoff/preflight terkait yang existing.
  [Execution record](page-section-visibility-r4-release.md) mencatat freeze/push/deployment/acceptance.
  Baseline sebelum push12:12 UTC: loader valid19/21 revision seed, Home/ProjectsON,
  About/HoFOFF; Current/alias READY144e681. Provider config dan live toggle/restore
  tetap tidak diizinkan. Checkpoint PLAN ONLY dan pending commit di bawah historis;
  izin release ini hanya untuk scope yang disebut, bukan future push umum.

## R3 fix packaging lokal — 11 Oct 2026

[Fix dan bukti rerun](page-section-visibility-r3-function-fix-local.md): owner menyetujui move visibility entry ke
server + update bridge import. Detector11 API +1 SSR expected12; Node22
check/build, 54 tests dan compiled shared Auth/routing synthetic PASS.
Production loader read-only tetap seed: Home/ProjectsON, About/HoFOFF,19/21.
Fix belum committed; HEAD51ce198 bukan final candidate. Tidak push/deploy,
provider/config mutation atau live toggle. R3 provider manifest/R5/R6 pending.
Checkpoint proposal R3 di bawah merupakan bukti sebelum fix ini.

## R3 provider preflight — 11 Oct 2026, 11:13–11:21 UTC

[Bukti R3 dan proposal fix minimal](page-section-visibility-r3-provider-preflight.md):
backend production/target content+revision identik; Node22 build/check/tests10
dan19 local SSR reads dengan real DB PASS; remote CMS prebuild/latest snapshot
build terisolasi PASS. Engines22 mengesampingkan provider24; artifact22 terbukti.
Release candidate51ce198 tertahan: CLI memilih12 standalone API +1 SSR expected13,
melebihi Hobby12. Belum provider rejection/deploy. Proposal belum diterapkan:
move visibility entry keluar root api/ dan update import bridge (expected12).
Perlu izin fix source lokal karena scope aktif preflight/docs; tidak mengubah
source/config/provider/SQL/save/toggle/commit/push dalam pass R3. R2 tetap PASS.

## Update Paket A / R2 — 11 Oct 2026, 11:06–11:07 UTC

[R2 production DB](page-section-visibility-r2-production-db.md) selesai setelah owner “gass”
dengan scope Paket A SQL exact + verifikasi yang diumumkan. Migration applied
sekali, loader200 valid tiga reads, catalog/defaults/ACL/RLS/denials PASS;
fingerprints existing identik. Cache reload tidak diperlukan. Home/Projects ON,
About/HoF OFF di config19/21; web Current144e681 masih lama, fitur belum live.
Status PLAN/R0 sebelum SQL di bawah adalah snapshot historis. Tidak
provider/deploy/save/toggle/restore/commit/push. R3 gates dan instruksi baru
“commit dan push” dengan scope release jelas tetap diperlukan; live toggle dan
restore izin terpisah. Existing dirty/source/hash terjaga.

Checkpoint terkini: commit lokal `51ce1984112283ad533e018dbebcb6b3730a138a`
selesai; push tertahan. Owner kemudian meminta PLAN ONLY dan handoff AI baru.
Dokumen planning sesudah commit belum committed; tidak ada izin commit/push
baru dalam prompt handoff. Lihat [kickoff aktif](page-section-visibility-kickoff.md)
dan [plan release R0–R7](page-section-visibility-production-release-plan.md).
API 404 tercatat pada waktu di bawah, bukan pemeriksaan production terbaru.

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

Current checkpoint: local commit `51ce1984112283ad533e018dbebcb6b3730a138a`
completed; main push held pending production prerequisite/deployment authorization. Do not describe the feature
as live or reuse this commit/push instruction for additional unrelated releases.

Owner then requested “nah plan dulu”. Follow the detailed
[production release plan](page-section-visibility-production-release-plan.md),
PLAN ONLY. No further commit/push or production mutation in this planning pass.
