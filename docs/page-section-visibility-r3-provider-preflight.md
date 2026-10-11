# Pages & Sections — R3 provider/runtime preflight

## R3 fix packaging lokal — 11 Oct 2026

[Fix dan bukti rerun](page-section-visibility-r3-function-fix-local.md): owner menyetujui move visibility entry ke
server + update bridge import. Detector11 API +1 SSR expected12; Node22
check/build, 54 tests dan compiled shared Auth/routing synthetic PASS.
Production loader read-only tetap seed: Home/ProjectsON, About/HoFOFF,19/21.
Fix belum committed; HEAD51ce198 bukan final candidate. Tidak push/deploy,
provider/config mutation atau live toggle. R3 provider manifest/R5/R6 pending.
Checkpoint proposal R3 di bawah merupakan bukti sebelum fix ini.

11 Oktober 2026, 11:13–11:21 UTC (18:13–18:21 WIB). Read-only provider/backend,
isolated local QA dan dokumentasi; tidak source fix, config/provider mutation,
SQL baru/cache reload, deploy, commit/push atau live save/toggle.
[R2 DB/API PASS](page-section-visibility-r2-production-db.md) tetap berlaku.

## Hasil dan keputusan release

**Release candidate 51ce198 belum lolos R3.** Local builder detection memilih
12 standalone Node API functions dan satu Astro build menghasilkan satu SSR
function. Combined count yang diharapkan adalah13, melebihi batas Hobby12.
Ini bukti discovery/inference lokal, bukan klaim deployment sudah ditolak.
Tidak menjalankan deployment untuk memancing error.

| Pemeriksaan                     | Status dan bukti                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Git candidate                   | HEAD `51ce1984112283ad533e018dbebcb6b3730a138a`, remote `144e6812cda44c5f59b3152bffe6f0d027bc2e6b`; tidak source/config changes                                                                                                                                     |
| Current/alias                   | READY `dpl_5Kp2u5fzhVTgnVUMtykugjKUef3o`, SHA144e681; independent alias GET200 cocok; masih versi lama                                                                                                                                                              |
| Provider                        | project `prj_3KbX29t6DYN1RMTy88lKHXd0IUVE`, community-web/main, Astro, Hobby, Fluid=true, default function region iad1                                                                                                                                              |
| Backend behavioral match        | Production content API dan existing handler dengan URL/key target sama-sama source=supabase, identical revision/data/hash `b6b3ffc2891466b857170c897f218d6f87d71640884e3cb9976499d587849a40`                                                                        |
| Literal sensitive env           | Nilai tidak readable; behavioral match di atas mengurangi uncertainty, bukan klaim secret literal diekspor/dibandingkan. Production keys tetap registered dan tidak fixture/source local                                                                            |
| Actual server visibility loader | Module loader source remote200 contract valid, observed revision `00000000-0000-4000-8000-000000000001`, ProjectsON                                                                                                                                                 |
| Node version selection          | Package engines22.x mengesampingkan project24 menurut dokumentasi; Node22.23.3 isolated build benar-benar mengeluarkan nodejs22.x. Artifact26→24 terdahulu tidak membuktikan artifact production baru24                                                             |
| Node22 QA                       | Build PASS, Astro check0 errors/0 warnings/20 hints pada exact HEAD isolated checkout; 10 visibility tests PASS pada Node22                                                                                                                                         |
| Runtime SSR + remote DB         | Isolated generated Node22 harness membaca real production config: 19/19 HTTP200, consistent actual seed revision+3 no-store headers; Projects present; About/HoF chamber/noindex follow. Ini local runtime, bukan live domain acceptance                            |
| Production-source CMS prebuild  | Enam public read RPCs dan media GET, schema/media validation PASS pada Node22, snapshot hanya di /tmp; workspace snapshot tidak diubah                                                                                                                              |
| Snapshot freshness              | Latest remote snapshot berbeda20 field proyek/tim; hash isolated `1010e52085a97973ce91c622ecd588c4f00695d6d9ca1a1b9049f34571fce8b7`, committed/workspace `4345f1abe445aa2a400c31413ccc058707a77105a7e388dc8d1074e78da94857`; build atas latest remote snapshot PASS |
| API discovery                   | Installed Vercel CLI52.0.0 detectBuilders:12 distinct @vercel/node entrypoints; @vercel/static-build/Astro tambahan; tidak ada discovery errors                                                                                                                     |
| Combined function count         | Failed release readiness: inferred12 API +1 SSR =13; official Hobby limit12; provider exact release manifest belum ada                                                                                                                                              |
| Timeouts                        | Current standalone admin/recruitment90s, content/media30s. SSR .vc-config tidak maxDuration; provider Fluid=true, documented Hobby default300s. Existing API glob bukan override SSR; effective new manifest tetap diperiksa saat approved release                  |
| Auth positive/R5                | Pending owner login existing; tidak mencoba privileged save/no-op atau mengambil daftar pendaftar                                                                                                                                                                   |

Backend content revision identik:
`b4486141994e555408fe21c2f30d811dcc83fc8b8070bd3017f2c633ea77f3ce:da4a5640ce54cff23b38f3a357993fb25323879812f056e1b414bc2fe4b22a6b`.
Ini bukti perilaku current content API terhadap backend target yang kuat, tetapi
bukan pembacaan langsung literal SUPABASE_URL provider atau acceptance deployed
visibility endpoint baru. Encrypted/sensitive values tidak dicetak.

## Bukti function count dan proposal fix minimal

CLI detector dipanggil lokal terhadap daftar file exact HEAD dengan framework,
branch/build/output settings provider; tidak memakai deploy/link/pull, tidak
menulis konfigurasi provider. Dua belas API entrypoints: empat Auth, recruitment
admin catch-all, admin media/projects/visibility/team, public content,
recruitment application, public media. Astro menghasilkan `_render.func`.
Installed CLI build implementation memproses builder outputs lalu merge routes;
Build Output API tidak otomatis membuktikan root API discovery diabaikan.
Current deployment mempunyai11 Node functions sebelum visibility/SSR baru.

Proposal **belum dikerjakan**:

1. Pindahkan entry `api/admin/site-visibility.js` menjadi
   `server/site-visibility-api.mjs`; ubah relative import ke existing
   `./site-visibility-admin.mjs`. Factory/handler/response tetap sama.
2. Update hanya import visibility pada `src/pages/api/[...route].ts` ke entry
   baru. URL `/api/admin/site-visibility` tetap dipetakan oleh whitelist bridge.

Read-only discovery simulation dengan path visibility root API dikeluarkan
menghasilkan11 standalone API +1 SSR =12 expected; bukan build/test fix yang
sudah diterapkan. Root standalone existing tetap utuh, Auth/Origin/CSRF serta
handler visibility reuse, migration/schema/intake/allowlist tetap.

Scope Git berupa satu move (old/new path) dan satu bridge import, plus docs.
Tidak perlu mengubah engines, provider env/plan, vercel.json, UI atau database.
Setelah owner mengizinkan fix lokal: rerun detector, Node22 build/check+10 tests,
generated route count, anonymous visibility denial dan isolated fixture admin
save/read SSR. Remote Supabase hanya digunakan untuk GET/load, tidak live save.
Freeze SHA baru hanya setelah instruksi commit yang sesuai; kandidat release
akan berbeda bila fix committed. Jangan push51ce198 untuk menguji blocker.

Owner awal membatasi scope “hanya pembacaan/preflight dan pembaruan dokumentasi”
dan meminta scope/bukti dahulu bila perlu fix. Izin R2 SQL serta “okee” untuk
melanjutkan preflight tidak dipakai sebagai izin perubahan source di atas.
Persetujuan lokal fix terpisah diperlukan; belum meminta izin provider/deploy.

## Provenance, batas dan tindak lanjut

Node22 binary dari official nodejs.org/latest-v22.x, archive SHA256
`df450af89261115ef9f9e3830c3eeb2cc9213b63c720b1af623cb5dcbe2e02de`
diverifikasi sebelum dipakai; dependency version tidak diubah. Exact HEAD
checkout `/tmp/ds-r3-head-51ce198-srMTVw` terisolasi dari dirty docs/workspace.
Upaya awal memakai symlink dependencies gagal karena compiler path metadata;
retry memakai copied dependencies berhasil. Itu setup QA, bukan regression.
CLI entry path awal yang salah diperbaiki sebelum successful build.

CMS source remote validation memakai existing key in-memory; menulis snapshot/
cache media hanya di /tmp. Tidak reseed content atau force mode local agar
production build lolos. Actual provider build belum dilakukan: local validation
dan compiler build tetap dibedakan dari acceptance provider baru.

Temporary real-DB harness4350 dihentikan sesudah read checks; owner preview4348
fixture existing tidak dihentikan/rebuild. Source/hash/HEAD masih sama; SQL R2
dan default preferences tetap. Tidak deploy hook/polling/0ms guarantee.

GET deployment file tree404 bukan bukti deployment hilang: current/alias GET200
READY. API tersebut hanya menyediakan source tree untuk deployment via CLI/API
files, tidak membuktikan generated manifest Git deployment tersedia.

Ignored evidence `artifacts/site-visibility/r3-20261011/`: backend-match,
provider/deployment/alias/env-registration, actual loader-state, detected/proposed
builders, Node22 build/check/tests/runtime, CMS remote prebuild/snapshot diff,
latest-remote-snapshot build log, work path dan file-tree unavailable response.
Dokumentasi belum committed; baseline dirty tetap dipertahankan.

Referensi primary:
[engines overrides Node setting](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions),
[Hobby function count](https://vercel.com/docs/functions/runtimes),
[Fluid duration](https://vercel.com/docs/functions/limitations),
[sensitive env non-readable](https://vercel.com/docs/environment-variables/sensitive-environment-variables),
[Build Output primitives](https://vercel.com/docs/build-output-api/primitives),
[deployment source file tree](https://vercel.com/docs/rest-api/deployments/list-deployment-files).
