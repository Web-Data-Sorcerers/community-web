# Pages & Sections — R7 runtime repair lokal

## R7 repair release authorized — 11 Oct 2026

Owner explicitly instructed “commit dan push fix runtime/routing beserta
deployment main”. Scope: astro.config.mjs granular compiler treeshake rule,
vercel.json two visibility rewrites, isolated packaging verifier and related
dirty evidence/handoff docs. One main push with connected deployment; verify
actual new SHA/READY/alias and R5 reads. [Repair evidence](page-section-visibility-r7-runtime-repair.md).
At freeze release SHA/deployment acceptance pending; exact results will be
recorded in artifacts/site-visibility/r7-release-20261011/ and local docs after
push. No additional SQL, provider env/plan/Node setting changes or live toggle.
Rollback remains separately unapproved; owner chose new repair release.
Earlier pending approval/failure checkpoints below are historical evidence.

11 Oktober 2026. Owner meminta penjelasan failure dan bantuan memperbaiki.
Local diagnosis/fix/QA dilakukan; belum commit/push/redeploy, provider settings,
rollback atau live save. Separate rollback approval question pending.

## Penyebab dan reproduksi

Actual production request logs melalui read-only Vercel request-logs API memberi
24 rows. Controlled public requests gagal saat boot dengan `Cannot find native
binding`, dari `node_modules/rolldown/dist/shared/binding-DlR5d34p.mjs`, missing
`@rolldown/binding-wasm32-wasi`/native fallback. Generated Vercel entrypoint
membawa bare `import "rolldown"` karena adapter entrypoint mengimpor konstanta
melalui build-time adapter index. Compiler export tidak digunakan oleh SSR.

Exact packed `_render.func` sebelum fix dicopy ke `/tmp` di luar workspace dan
import dengan Node22 + environment tanpa credentials. Boot exit1 dan native
binding error yang sama. Ini membuktikan dependency ancestor/workspace menutupi
packaging failure dalam QA lama; compiled direct fetch terdahulu tidak menguji
boot dengan hanya shipped dependencies. Tidak menghapus lockfile/node_modules,
reinstall dependencies atau mengulang SQL berdasarkan generic error hint.

Root API functions existing tetap berjalan; dua endpoint visibility yang lewat
Astro SSR bridge mendapat404 di actual domain. Penyebab routing merger belum
terbukti dari provider routes (null pada metadata), sehingga proposed explicit
rewrites harus diterima sebagai correction candidate, bukan cloud PASS.

## Fix lokal konkret

- `astro.config.mjs`: Vite/Rolldown treeshake rule hanya bare external module
  `rolldown`, sideEffects=false. Unused compiler import hilang dari generated
  entrypoint; imported exports yang benar-benar used tetap semantik normal.
  Rule tidak menonaktifkan side effects semua dependency atau CSS.
- `vercel.json`: dua exact rewrites dari `/api/admin/site-visibility` dan
  `/api/site-visibility/revision` ke existing `/_render` function. Existing
  API/Auth/media/intake entries, rewrite media dan timeout settings dipertahankan.
  Cloud routing config ini belum deployed dan membutuhkan approval release.
- `scripts/verify-site-visibility-package.mjs`: regression verifier memakai
  copy packed function di luar workspace, real compiled shared Auth dengan
  synthetic upstream; unknown outbound blocked. Dua saves hanya in-memory
  synthetic, final ProjectsON. Semua19 routes dan21 section contract diuji.

Rule mengacu pada [official Rolldown treeshake API](https://rolldown.rs/reference/InputOptions.treeshake),
khusus granular external moduleSideEffects rule. Provider raw secret/env values
atau credentials tidak dicetak. No UI change: ZERO EMOTE, 8-point spacing,
Bluu Next/Manrope/Button tetap.

## Readiness matrix

| Pemeriksaan                    | Status / bukti                                                                                                                                                                                                                          |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actual failure source          | VERIFIED: sanitized production logs + isolated pre-fix boot exit1 matching native binding error                                                                                                                                         |
| Isolated shipped-function boot | VERIFIED after fix: Node22 import dan actual default.fetch sukses tanpa ancestor node_modules                                                                                                                                           |
| Compiled contract/Auth         | VERIFIED synthetic: all19 public200/three no-store headers/revision;19 pages21 sections; revision API200; login200; anonymous4 endpoints401; Origin/CSRF403; revoked permission403; save OFF/freshSSR/restoreON PASS; unknown outbound0 |
| Typecheck/build                | VERIFIED Node22:0 errors0 warnings36 hints / build PASS                                                                                                                                                                                 |
| Regression tests               | VERIFIED:54 PASS0 FAIL                                                                                                                                                                                                                  |
| Rewrite configuration          | VERIFIED local official routing-utils transform error=null; two exact destinations/_render; provider acceptance PENDING                                                                                                                 |
| Function count                 | VERIFIED detector11 root API +1SSR expected12; existing deployed release actual12; next cloud manifest PENDING                                                                                                                          |
| Production DB read             | VERIFIED12:25:38 UTC: seed revision;Home/ProjectsON/About/HoFOFF;19/21                                                                                                                                                                  |
| Actual primary alias           | FAILED current release032fdf9: all19 public500, two visibility endpoints404; three admin200                                                                                                                                             |
| Owner login / live save        | PENDING production; no real credentials/fixture intercept used on production                                                                                                                                                            |
| Commit/push/rollback of repair | PENDING separate approval; no extra push performed                                                                                                                                                                                      |

Migration and CMS snapshot SHA256 unchanged respectively:
`62844c643ca608582334647824978663b758753c8623b87a6ac7622dd7a1b82c` /
`4345f1abe445aa2a400c31413ccc058707a77105a7e388dc8d1074e78da94857`.
Evidence ignored: `artifacts/site-visibility/r7-repair-20261011/`, sanitized
runtime logs in R4 folder and `artifacts/site-visibility/package-verification/`.

Reproduce after a Node22 build, without production env file:

```sh
node scripts/verify-site-visibility-package.mjs
```

## Approval packages and expected final state

Urgent recovery package: rollback existing deployment to
`dpl_5Kp2u5fzhVTgnVUMtykugjKUef3o` / SHA144e681, candidate Home200 after failure.
Promote/rollback that existing deployment and verify Current/alias/public reads.
No DB/config flags reset, no build/push, no SQL/provider env/plan changes. Previous
web behavior will return; Pages & Sections runtime not live accepted yet.
Owner separately asked via approval question; no answer inferred from time.

Repair release package: explicitly approve commit and push of the two config
fixes + packaging verifier + related evidence/handoff updates. This causes one
new main deployment and applies the exact versioned routing config above.
No provider Node version/plan/env change, extra deploy hook/redeploy, SQL or live
save. Verify final SHA/READY/alias/functions, read19 public+3admin, both visibility
endpoints, existing content/media/intake, four widths/navigation/console. Expect
Home/ProjectsON, About/HoF chamber, seeded section preferences and actual seed
revision. If failure persists, report it and use separately authorized rollback;
do not claim READY alone means acceptance passed.

Live save/toggle/restore remains a separate approval package. Next confirmed save
should affect next fresh visit without rebuild, no0ms/open-tab update promise.
Post-R4 documentation updates and this fix are dirty; current Git HEAD/remote
remain032fdf984dbe31c9d18fda660d75704e000e1177 until next explicit instruction.
