# Pages & Sections — R3 function packaging fix lokal

11 Oktober 2026. Owner menyetujui proposal fix lokal lewat “wokee” dan meminta
kepastian dampak terhadap sistem. Scope hanya move entry/import dan dokumentasi.
Tidak ada commit/push, provider/config mutation, deployment atau live toggle.

## Perubahan dan dampak

Entry `api/admin/site-visibility.js` dipindah ke
`server/site-visibility-api.mjs`, relative import factory disesuaikan, dan import
visibility pada `src/pages/api/[...route].ts` diarahkan ke lokasi baru. URL
`/api/admin/site-visibility` tetap melalui whitelist bridge Astro. Factory,
response, shared CMS Auth/Origin/CSRF dan semua entry API existing tidak diubah.

Detector Vercel CLI pada working tree sekarang memilih 11 standalone API;
Astro menghasilkan satu SSR function. Expected total12 menghilangkan blocker
lokal total13 pada HEAD lama. Manifest deployment provider tetap pending;
detector lokal bukan bukti cloud acceptance.

## Bukti rerun

| Pemeriksaan                  | Status / bukti                                                                                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unit/regression              | VERIFIED: 54 PASS, 0 FAIL; visibility, shared CMS Auth, public content dan recruitment shared admin                                                                                        |
| Node22 check/build           | VERIFIED: 0 errors / 0 warnings / 36 hints; build workspace dan artifact nodejs22.x PASS                                                                                                   |
| Function discovery           | VERIFIED lokal: 11 standalone API + 1 generated SSR expected12; provider final manifest PENDING                                                                                            |
| Compiled shared Auth         | VERIFIED synthetic: login200; anonymous visibility/Projects/Team/Pendaftar401; invalid Origin/CSRF403; revoked permission403                                                               |
| Fresh SSR contract           | VERIFIED synthetic: save OFF menghasilkan revision baru dan Projects/Explore absent pada fresh SSR; restore ON confirmed; 19 public routes200 dan tiga no-store headers; unknown detail404 |
| Backend isolation            | VERIFIED: dua save hanya upstream synthetic, unknown outbound0; tidak memakai production credentials untuk integration test                                                                |
| Production loader setelah QA | VERIFIED read-only 11:44:33.864 UTC: revision seed, Home/ProjectsON, About/HoFOFF, 19 pages / 21 sections                                                                                  |
| UI visual                    | Bukti P0–P6/refinement terdahulu; full visual suite tidak direrun untuk move/import ini                                                                                                    |
| Production acceptance R5/R6  | PENDING: visibility runtime baru belum deployed; owner login dan live mutation terpisah belum dilakukan                                                                                    |

Evidence lokal ignored:
`artifacts/site-visibility/r3-function-fix-20261011/`, termasuk tests/check/build
logs, detected-builders.json, compiled-auth-routing.json dan
production-loader-after.json. Compiled routing test memakai actual generated
app dan shared Auth dengan upstream synthetic; bukan acceptance production.

Tidak ada perubahan UI, spacing, Bluu Next, Manrope atau Button. Migration SHA256
masih `62844c643ca608582334647824978663b758753c8623b87a6ac7622dd7a1b82c`.
Workspace CMS snapshot tetap
`4345f1abe445aa2a400c31413ccc058707a77105a7e388dc8d1074e78da94857`.
Enam collection, intake, akun/grant/allowlist dan deploy hook tidak disentuh.

## Release dan rollback

HEAD masih `51ce1984112283ad533e018dbebcb6b3730a138a`; fix belum committed,
sehingga SHA tersebut sendiri bukan final release candidate. Semua dirty docs
existing dipertahankan. Instruksi eksplisit baru “commit dan push” dengan scope
release jelas tetap wajib; database/API R2 sudah siap, provider final manifest,
READY/alias dan R5 acceptance tetap diperiksa pada release yang disetujui.

Rollback deployment candidate tetap current READY
`dpl_5Kp2u5fzhVTgnVUMtykugjKUef3o` / SHA
`144e6812cda44c5f59b3152bffe6f0d027bc2e6b`, diverifikasi kembali sebelum release.
Rollback/restore production memerlukan izin terpisah. Jangan drop additive SQL
atau mengubah existing schema/grants. Expected final state release sebelum live
toggle: Home/ProjectsON, About/HoF Under Development, seluruh section preference
seedON; fresh visit sesudah save confirmed membaca revision terbaru tanpa rebuild.
Tidak menjanjikan 0ms atau automatic update pada tab pengunjung terbuka.

Owner preview: [instruksi lokal](page-section-visibility-production-release-plan.md#15-preview-dan-qa-lokal-yang-dapat-direproduksi).
Gunakan fixture banner dan URL `/admin/#pages`, bukan credentials production.
